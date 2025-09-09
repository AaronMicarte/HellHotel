<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Reservation
{
    function getAllReservations()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        // Get query parameters
        $statusFilter = isset($_GET['status']) ? $_GET['status'] : null;
        $typeFilter = isset($_GET['type']) ? $_GET['type'] : null;
        $viewFilter = isset($_GET['view']) ? $_GET['view'] : null;
        $dateFrom = isset($_GET['dateFrom']) ? $_GET['dateFrom'] : null;
        $dateTo = isset($_GET['dateTo']) ? $_GET['dateTo'] : null;
        $search = isset($_GET['search']) ? $_GET['search'] : null;


        $sql = "SELECT res.*, 
               CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
               g.guest_id,
               rs.reservation_status AS reservation_status,
               rs.reservation_status_id,
               GROUP_CONCAT(CONCAT(rt.type_name, ' (', r.room_number, ')') ORDER BY rr.reserved_room_id SEPARATOR ', ') AS rooms_summary,
               GROUP_CONCAT(r.room_number ORDER BY rr.reserved_room_id SEPARATOR ', ') AS all_room_numbers,
               GROUP_CONCAT(rt.type_name ORDER BY rr.reserved_room_id SEPARATOR ', ') AS all_type_names,
               requested_rt.type_name AS requested_room_type,
               u.username AS created_by_username,
               u.user_id AS created_by_user_id,
               ur.role_type AS created_by_role,
               COALESCE(latest_status.changed_at, res.updated_at, res.created_at) AS latest_activity
        FROM Reservation res
        LEFT JOIN Guest g ON res.guest_id = g.guest_id
        LEFT JOIN ReservationStatus rs ON res.reservation_status_id = rs.reservation_status_id
        LEFT JOIN RoomType requested_rt ON res.requested_room_type_id = requested_rt.room_type_id
        LEFT JOIN ReservedRoom rr ON res.reservation_id = rr.reservation_id AND rr.is_deleted = 0
        LEFT JOIN Room r ON rr.room_id = r.room_id
        LEFT JOIN RoomType rt ON r.room_type_id = rt.room_type_id
        LEFT JOIN User u ON res.user_id = u.user_id
        LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id
        LEFT JOIN (
            SELECT reservation_id, MAX(changed_at) as changed_at 
            FROM ReservationStatusHistory 
            GROUP BY reservation_id
        ) latest_status ON res.reservation_id = latest_status.reservation_id
        WHERE res.is_deleted = 0";

        // Apply filters
        $params = array();

        // View-based filtering
        if ($viewFilter === 'confirmed') {
            // Show all operational statuses (not pending) - includes overdue
            $sql .= " AND rs.reservation_status IN ('confirmed', 'checked-in', 'checked-out', 'cancelled', 'overdue')";
        } elseif ($viewFilter === 'pending') {
            $sql .= " AND rs.reservation_status = 'pending'";
        }

        if ($statusFilter) {
            $sql .= " AND rs.reservation_status = :status";
            $params[':status'] = $statusFilter;
        }
        if ($typeFilter) {
            $sql .= " AND res.reservation_type = :type";
            $params[':type'] = $typeFilter;
        }
        if ($dateFrom) {
            $sql .= " AND res.check_in_date >= :dateFrom";
            $params[':dateFrom'] = $dateFrom;
        }
        if ($dateTo) {
            $sql .= " AND res.check_in_date <= :dateTo";
            $params[':dateTo'] = $dateTo;
        }
        if ($search) {
            $sql .= " AND (res.reservation_id LIKE :search 
                          OR CONCAT(g.first_name, ' ', g.last_name) LIKE :search 
                          OR rs.reservation_status LIKE :search)";
            $params[':search'] = "%$search%";
        }

        $sql .= " GROUP BY res.reservation_id ORDER BY latest_activity DESC";

        $stmt = $db->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fix: Always return an array, never null/false
        if (!$reservations) $reservations = [];

        echo json_encode($reservations);
    }

    function getReservation($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = is_array($json) ? $json : json_decode($json, true);

        $sql = "SELECT r.*, 
                       CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
                       u.username AS created_by,
                       rs.room_status AS reservation_status
                FROM Reservation r
                LEFT JOIN Guest g ON r.guest_id = g.guest_id
                LEFT JOIN User u ON r.user_id = u.user_id
                LEFT JOIN ReservationStatus rs ON r.reservation_status_id = rs.reservation_status_id
                WHERE r.reservation_id = :reservation_id AND r.is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertReservation($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = is_array($json) ? $json : json_decode($json, true);

        // Debug logging
        error_log("insertReservation called with data: " . print_r($json, true));

        // Merge companions from POST if present (FormData sends companions as a separate field)
        if (isset($_POST['companions']) && !isset($json['companions'])) {
            $json['companions'] = $_POST['companions'];
        }

        $userId = isset($json['user_id']) ? $json['user_id'] : null;

        // Set reservation_type based on the source:
        // 1. Use explicit reservation_type from payload if provided
        // 2. If user_id is present (admin/staff creating), it's 'walk-in'
        // 3. If no user_id (guest booking online), it's 'online'
        if (isset($json['reservation_type'])) {
            $reservation_type = $json['reservation_type'];
        } else {
            $reservation_type = $userId ? 'walk-in' : 'online';
        }

        // Set reservation status based on reservation TYPE, not user ID:
        // Walk-in reservations by admin should be confirmed by default (status 2)
        // Online reservations ALWAYS start as pending (status 1)
        if (isset($json['reservation_status_id']) && is_numeric($json['reservation_status_id'])) {
            $reservation_status_id = $json['reservation_status_id'];
        } else {
            $reservation_status_id = ($reservation_type === 'walk-in') ? 2 : 1; // Walk-in = confirmed, online = pending
        }

        // For walk-in reservations: use room_type_id from assigned room
        // For online reservations: use requested_room_type_id (what guest wants)
        $requestedRoomTypeId = null;

        if ($reservation_type === 'walk-in') {
            // Walk-in: use room_type_id from the assigned room
            $requestedRoomTypeId = isset($json['room_type_id']) ? $json['room_type_id'] : null;

            // If using rooms array format, get room_type_id from first room
            if (!$requestedRoomTypeId && !empty($json['rooms']) && is_array($json['rooms'])) {
                $requestedRoomTypeId = isset($json['rooms'][0]['room_type_id']) ? $json['rooms'][0]['room_type_id'] : null;
            }
        } else {
            // Online: use requested_room_type_id (what guest requested)
            $requestedRoomTypeId = isset($json['requested_room_type_id']) ? $json['requested_room_type_id'] : (isset($json['room_type_id']) ? $json['room_type_id'] : null);
        }

        // Debug logging
        error_log("Reservation type: " . $reservation_type . ", Determined requestedRoomTypeId: " . $requestedRoomTypeId);

        if (!$requestedRoomTypeId) {
            $missingField = $reservation_type === 'walk-in' ? 'room_type_id' : 'requested_room_type_id';
            echo json_encode(["success" => false, "message" => "Missing $missingField for $reservation_type reservation"]);
            return;
        }

        $sql = "INSERT INTO Reservation (user_id, reservation_status_id, guest_id, requested_room_type_id, reservation_type, check_in_date, check_out_date)
        VALUES (:user_id, :reservation_status_id, :guest_id, :requested_room_type_id, :reservation_type, :check_in_date, :check_out_date)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':reservation_status_id', $reservation_status_id);
        $stmt->bindParam(':guest_id', $json['guest_id']);
        $stmt->bindParam(':requested_room_type_id', $requestedRoomTypeId);
        $stmt->bindParam(':reservation_type', $reservation_type);
        $stmt->bindParam(':check_in_date', $json['check_in_date']);
        $stmt->bindParam(':check_out_date', $json['check_out_date']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $reservationId = $db->lastInsertId();
            // Return object with reservation_id for new code (guest booking),
            // but also include success flag for backward compatibility with admin
            $returnValue = [
                "reservation_id" => $reservationId,
                "success" => 1
            ];

            // --- Single Room Booking ---
            $reserved_room_id = null;
            $single_room_processed = false;
            // Always insert a ReservedRoom row for each booking (only if NOT using multi-room array)
            if (!empty($json['room_type_id']) && (empty($json['rooms']) || !is_array($json['rooms']))) {
                if (!empty($json['room_id'])) {
                    // Admin booking - assign specific room and type
                    $sql2 = "INSERT INTO ReservedRoom (reservation_id, room_id, room_type_id) VALUES (:reservation_id, :room_id, :room_type_id)";
                    $stmt2 = $db->prepare($sql2);
                    $stmt2->bindParam(':reservation_id', $reservationId);
                    $stmt2->bindParam(':room_id', $json['room_id']);
                    $stmt2->bindParam(':room_type_id', $json['room_type_id']);
                    $stmt2->execute();
                    $reserved_room_id = $db->lastInsertId();
                    $single_room_processed = true;
                } else {
                    // Online booking - assign only room_type_id, leave room_id NULL
                    $sql2 = "INSERT INTO ReservedRoom (reservation_id, room_id, room_type_id) VALUES (:reservation_id, NULL, :room_type_id)";
                    $stmt2 = $db->prepare($sql2);
                    $stmt2->bindParam(':reservation_id', $reservationId);
                    $stmt2->bindParam(':room_type_id', $json['room_type_id']);
                    $stmt2->execute();
                    $reserved_room_id = $db->lastInsertId();
                    $single_room_processed = true;
                }
            }

            // --- Save companions for reservations ---
            $companions = [];
            if (isset($json['companions'])) {
                if (is_string($json['companions'])) {
                    $decoded = json_decode($json['companions'], true);
                    if (is_array($decoded)) {
                        $companions = $decoded;
                    }
                } elseif (is_array($json['companions'])) {
                    $companions = $json['companions'];
                }
            }

            // Handle companions from FormData (sent as separate field)
            if (isset($_POST['companions']) && !isset($json['companions'])) {
                if (is_string($_POST['companions'])) {
                    $decoded = json_decode($_POST['companions'], true);
                    if (is_array($decoded)) {
                        $companions = $decoded;
                    }
                }
            }

            // For single room booking, save companions directly to the reserved room
            if (!empty($companions) && $reserved_room_id && $single_room_processed) {
                foreach ($companions as $companion) {
                    $companionName = '';
                    if (is_string($companion)) {
                        $companionName = trim($companion);
                    } elseif (is_array($companion) && isset($companion['full_name'])) {
                        $companionName = trim($companion['full_name']);
                    }

                    if ($companionName !== "") {
                        $sqlComp = "INSERT INTO ReservedRoomCompanion (reserved_room_id, full_name) VALUES (:reserved_room_id, :full_name)";
                        $stmtComp = $db->prepare($sqlComp);
                        $stmtComp->bindParam(':reserved_room_id', $reserved_room_id);
                        $stmtComp->bindParam(':full_name', $companionName);
                        $stmtComp->execute();
                    }
                }
            }

            // --- Multi-room booking: insert all ReservedRoom and companions (frontend payload support) ---
            if (!empty($json['rooms']) && is_array($json['rooms'])) {
                foreach ($json['rooms'] as $room) {
                    $room_id = isset($room['room_id']) ? $room['room_id'] : null;
                    $room_type_id = isset($room['room_type_id']) ? $room['room_type_id'] : null;

                    if ($room_type_id) { // For online booking, room_type_id is required, room_id can be null
                        if ($room_id) {
                            // Admin booking - check if this specific room is already added (prevent duplicates)
                            $sqlCheck = "SELECT COUNT(*) FROM ReservedRoom WHERE reservation_id = :reservation_id AND room_id = :room_id AND is_deleted = 0";
                            $stmtCheck = $db->prepare($sqlCheck);
                            $stmtCheck->bindParam(':reservation_id', $reservationId);
                            $stmtCheck->bindParam(':room_id', $room_id);
                            $stmtCheck->execute();
                            $exists = $stmtCheck->fetchColumn();

                            if (!$exists) {
                                // Get room_type_id from Room table if not provided
                                if (!$room_type_id) {
                                    $sqlGetType = "SELECT room_type_id FROM Room WHERE room_id = :room_id";
                                    $stmtGetType = $db->prepare($sqlGetType);
                                    $stmtGetType->bindParam(':room_id', $room_id);
                                    $stmtGetType->execute();
                                    $room_type_id = $stmtGetType->fetchColumn();
                                }

                                $sql2 = "INSERT INTO ReservedRoom (reservation_id, room_id, room_type_id) VALUES (:reservation_id, :room_id, :room_type_id)";
                                $stmt2 = $db->prepare($sql2);
                                $stmt2->bindParam(':reservation_id', $reservationId);
                                $stmt2->bindParam(':room_id', $room_id);
                                $stmt2->bindParam(':room_type_id', $room_type_id);
                                $stmt2->execute();
                                $reserved_room_id_multi = $db->lastInsertId();

                                // Only set room status to reserved if reservation is confirmed
                                if ($reservation_status_id == 2) { // 2 = confirmed
                                    $this->updateRoomStatus($room_id, 4); // 4 = reserved
                                }
                            }
                        } else {
                            // Online booking - room_id is null, just create ReservedRoom with room_type_id
                            $sql2 = "INSERT INTO ReservedRoom (reservation_id, room_id, room_type_id) VALUES (:reservation_id, NULL, :room_type_id)";
                            $stmt2 = $db->prepare($sql2);
                            $stmt2->bindParam(':reservation_id', $reservationId);
                            $stmt2->bindParam(':room_type_id', $room_type_id);
                            $stmt2->execute();
                            $reserved_room_id_multi = $db->lastInsertId();
                        }

                        // Save companions for this room
                        if (!empty($room['companions']) && is_array($room['companions'])) {
                            foreach ($room['companions'] as $companionName) {
                                if (trim($companionName) !== "") {
                                    $sqlComp = "INSERT INTO ReservedRoomCompanion (reserved_room_id, full_name) VALUES (:reserved_room_id, :full_name)";
                                    $stmtComp = $db->prepare($sqlComp);
                                    $stmtComp->bindParam(':reserved_room_id', $reserved_room_id_multi);
                                    $stmtComp->bindParam(':full_name', $companionName);
                                    $stmtComp->execute();
                                }
                            }
                        }
                    }
                }
            }

            // --- Handle companions for multi-room online bookings ---
            // Companions are sent with room_type_id and room_index for mapping
            if (!empty($companions) && is_array($companions) && !$single_room_processed) {
                // Get all reserved rooms for this reservation ordered by creation
                $sqlReservedRooms = "SELECT reserved_room_id, room_type_id FROM ReservedRoom 
                                    WHERE reservation_id = :reservation_id AND is_deleted = 0 
                                    ORDER BY created_at ASC";
                $stmtReservedRooms = $db->prepare($sqlReservedRooms);
                $stmtReservedRooms->bindParam(':reservation_id', $reservationId);
                $stmtReservedRooms->execute();
                $reservedRooms = $stmtReservedRooms->fetchAll(PDO::FETCH_ASSOC);

                // Group reserved rooms by room type for mapping
                $roomsByType = [];
                foreach ($reservedRooms as $room) {
                    if (!isset($roomsByType[$room['room_type_id']])) {
                        $roomsByType[$room['room_type_id']] = [];
                    }
                    $roomsByType[$room['room_type_id']][] = $room['reserved_room_id'];
                }

                // Save companions based on room_type_id and room_index
                foreach ($companions as $companion) {
                    if (isset($companion['room_type_id'], $companion['room_index'], $companion['full_name'])) {
                        $roomTypeId = $companion['room_type_id'];
                        $roomIndex = $companion['room_index'];
                        $fullName = trim($companion['full_name']);

                        if ($fullName !== "" && isset($roomsByType[$roomTypeId][$roomIndex])) {
                            $reservedRoomId = $roomsByType[$roomTypeId][$roomIndex];

                            $sqlComp = "INSERT INTO ReservedRoomCompanion (reserved_room_id, full_name) VALUES (:reserved_room_id, :full_name)";
                            $stmtComp = $db->prepare($sqlComp);
                            $stmtComp->bindParam(':reserved_room_id', $reservedRoomId);
                            $stmtComp->bindParam(':full_name', $fullName);
                            $stmtComp->execute();
                        }
                    }
                }
            }

            // --- AUTO BILLING: FOR WALK-IN/ADMIN BOOKINGS (not pending online bookings) ---
            if ($reservation_type === 'walk-in' || ($reservation_type !== 'online' && $reservation_status_id != 1)) {
                // Only insert billing if one does not already exist for this reservation
                $sqlCheckBill = "SELECT COUNT(*) FROM Billing WHERE reservation_id = :reservation_id AND is_deleted = 0";
                $stmtCheckBill = $db->prepare($sqlCheckBill);
                $stmtCheckBill->bindParam(":reservation_id", $reservationId);
                $stmtCheckBill->execute();
                $billingExists = $stmtCheckBill->fetchColumn();
                if (!$billingExists) {
                    // Get total price for all rooms in this reservation
                    $sqlRooms = "SELECT SUM(COALESCE(rt_rr.price_per_stay, rt_r.price_per_stay)) AS total_price
                    FROM Reservation res
                    LEFT JOIN ReservedRoom rr ON res.reservation_id = rr.reservation_id AND rr.is_deleted = 0
                    LEFT JOIN Room r ON rr.room_id = r.room_id
                    LEFT JOIN RoomType rt_rr ON rr.room_type_id = rt_rr.room_type_id
                    LEFT JOIN RoomType rt_r ON r.room_type_id = rt_r.room_type_id
                    WHERE res.reservation_id = :reservation_id";
                    $stmtRooms = $db->prepare($sqlRooms);
                    $stmtRooms->bindParam(":reservation_id", $reservationId);
                    $stmtRooms->execute();
                    $rowRooms = $stmtRooms->fetch(PDO::FETCH_ASSOC);
                    $total_price = ($rowRooms && isset($rowRooms['total_price'])) ? floatval($rowRooms['total_price']) : 0;
                    $partial_amount = $total_price * 0.5;
                    // Insert billing with FULL price, PARTIAL status (id=3), and payment fields
                    $sqlBill = "INSERT INTO Billing (reservation_id, billing_status_id, total_amount, billing_date) VALUES (:reservation_id, :billing_status_id, :total_amount, NOW())";
                    $stmtBill = $db->prepare($sqlBill);
                    $billing_status_id = 3; // PARTIAL
                    $stmtBill->bindParam(":reservation_id", $reservationId);
                    $stmtBill->bindParam(":billing_status_id", $billing_status_id);
                    $stmtBill->bindParam(":total_amount", $total_price);
                    $stmtBill->execute();

                    // Get the billing_id just created
                    $billingId = $db->lastInsertId();
                    // Insert payment for 50% (partial)
                    if ($billingId && $partial_amount > 0) {
                        // Use sub_method_id from frontend if provided, else default to 1 (GCash)
                        $sub_method_id = 1;
                        if (isset($json['sub_method_id']) && is_numeric($json['sub_method_id'])) {
                            $sub_method_id = intval($json['sub_method_id']);
                        }
                        $sqlPay = "INSERT INTO Payment (user_id, billing_id, reservation_id, sub_method_id, amount_paid, money_given, change_given, payment_date, notes, reference_number, is_deleted) VALUES (:user_id, :billing_id, :reservation_id, :sub_method_id, :amount_paid, :money_given, :change_given, NOW(), :notes, :reference_number, 0)";
                        $stmtPay = $db->prepare($sqlPay);
                        $stmtPay->bindParam(":user_id", $userId);
                        $stmtPay->bindParam(":billing_id", $billingId);
                        $stmtPay->bindParam(":reservation_id", $reservationId);
                        $stmtPay->bindParam(":sub_method_id", $sub_method_id);
                        $stmtPay->bindParam(":amount_paid", $partial_amount);
                        $money_given = isset($json['money_given']) ? $json['money_given'] : 0;
                        $change_given = isset($json['change_given']) ? $json['change_given'] : 0;
                        $stmtPay->bindParam(":money_given", $money_given);
                        $stmtPay->bindParam(":change_given", $change_given);
                        $note = "Partial/Downpayment (auto)";
                        $stmtPay->bindParam(":notes", $note);
                        $reference_number = isset($json['reference_number']) ? $json['reference_number'] : null;
                        $stmtPay->bindParam(":reference_number", $reference_number);
                        $stmtPay->execute();
                    }
                }
            }

            // --- CREATE BILLING FOR ONLINE BOOKINGS (Hidden until confirmation) ---
            if ($reservation_type === 'online') {
                // Calculate total price for billing
                $sqlRooms = "SELECT SUM(COALESCE(rt_rr.price_per_stay, rt_r.price_per_stay)) AS total_price
                FROM Reservation res
                LEFT JOIN ReservedRoom rr ON res.reservation_id = rr.reservation_id AND rr.is_deleted = 0
                LEFT JOIN Room r ON rr.room_id = r.room_id
                LEFT JOIN RoomType rt_rr ON rr.room_type_id = rt_rr.room_type_id
                LEFT JOIN RoomType rt_r ON r.room_type_id = rt_r.room_type_id
                WHERE res.reservation_id = :reservation_id";
                $stmtRooms = $db->prepare($sqlRooms);
                $stmtRooms->bindParam(":reservation_id", $reservationId);
                $stmtRooms->execute();
                $rowRooms = $stmtRooms->fetch(PDO::FETCH_ASSOC);
                $total_price = ($rowRooms && isset($rowRooms['total_price'])) ? floatval($rowRooms['total_price']) : 0;

                // Create billing record (hidden until confirmation)
                $sqlBill = "INSERT INTO Billing (reservation_id, billing_status_id, total_amount, billing_date) VALUES (:reservation_id, :billing_status_id, :total_amount, NOW())";
                $stmtBill = $db->prepare($sqlBill);
                $billing_status_id = 3; // PARTIAL status
                $stmtBill->bindParam(":reservation_id", $reservationId);
                $stmtBill->bindParam(":billing_status_id", $billing_status_id);
                $stmtBill->bindParam(":total_amount", $total_price);
                $stmtBill->execute();

                // Store billing_id for payment linking
                $billingId = $db->lastInsertId();
                $returnValue['billing_id'] = $billingId;
            }

            $this->logStatusHistory($reservationId, $reservation_status_id, $userId);
        } else {
            // Debug: log insertion failure
            error_log("Reservation insertion failed. SQL Error: " . print_r($stmt->errorInfo(), true));
            $returnValue = ["success" => false, "message" => "Failed to insert reservation", "error" => $stmt->errorInfo()];
        }
        echo json_encode($returnValue);
    }

    function updateReservation($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = is_array($json) ? $json : json_decode($json, true);

        // --- Update Payment sub_method_id and reference_number for this reservation's partial payment if present ---
        if (isset($json['sub_method_id']) && is_numeric($json['sub_method_id'])) {
            // Find the latest partial payment for this reservation
            $sqlPay = "SELECT payment_id FROM Payment WHERE reservation_id = :reservation_id AND is_deleted = 0 ORDER BY payment_id DESC LIMIT 1";
            $stmtPay = $db->prepare($sqlPay);
            $stmtPay->bindParam(":reservation_id", $json['reservation_id']);
            $stmtPay->execute();
            $paymentId = $stmtPay->fetchColumn();
            if ($paymentId) {
                $updateFields = ["sub_method_id = :sub_method_id"];
                $updateParams = [":sub_method_id" => $json['sub_method_id']];

                // Include reference_number if provided
                if (isset($json['reference_number'])) {
                    $updateFields[] = "reference_number = :reference_number";
                    $updateParams[":reference_number"] = $json['reference_number'];
                }

                $sqlUpdatePay = "UPDATE Payment SET " . implode(", ", $updateFields) . " WHERE payment_id = :payment_id";
                $updateParams[":payment_id"] = $paymentId;

                $stmtUpdatePay = $db->prepare($sqlUpdatePay);
                foreach ($updateParams as $param => $value) {
                    $stmtUpdatePay->bindValue($param, $value);
                }
                $stmtUpdatePay->execute();
            }
        }

        // --- Get previous status for comparison ---
        $sqlPrev = "SELECT reservation_status_id FROM Reservation WHERE reservation_id = :reservation_id";
        $stmtPrev = $db->prepare($sqlPrev);
        $stmtPrev->bindParam(":reservation_id", $json['reservation_id']);
        $stmtPrev->execute();
        $prevStatusId = $stmtPrev->fetchColumn();

        // --- Update Guest if guest_id and guest fields are present ---
        if (!empty($json['guest_id']) && (
            !empty($json['first_name']) || !empty($json['last_name']) || !empty($json['email'])
        )) {
            $guestUpdateFields = [];
            $guestParams = [];
            foreach (['first_name', 'last_name', 'middle_name', 'suffix', 'date_of_birth', 'email', 'phone_number', 'id_type', 'id_number'] as $field) {
                if (isset($json[$field])) {
                    $guestUpdateFields[] = "$field = :$field";
                    $guestParams[":$field"] = $json[$field];
                }
            }
            if (!empty($guestUpdateFields)) {
                $sql = "UPDATE Guest SET " . implode(", ", $guestUpdateFields) . " WHERE guest_id = :guest_id";
                $guestParams[":guest_id"] = $json['guest_id'];
                $stmt = $db->prepare($sql);
                $stmt->execute($guestParams);
            }
        }

        // --- Get the current room_id if any ---
        $sql = "SELECT rr.room_id 
                FROM ReservedRoom rr 
                WHERE rr.reservation_id = :reservation_id AND rr.is_deleted = 0
                LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->execute();
        $oldRoomId = $stmt->fetch(PDO::FETCH_COLUMN);

        // --- Update reservation (do NOT insert a new one) ---
        $sql = "UPDATE Reservation 
        SET guest_id = :guest_id, 
            check_in_date = :check_in_date, 
            check_out_date = :check_out_date,
            reservation_status_id = :reservation_status_id,
            notes = :notes
        WHERE reservation_id = :reservation_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":guest_id", $json['guest_id']);
        $stmt->bindParam(":check_in_date", $json['check_in_date']);
        $stmt->bindParam(":check_out_date", $json['check_out_date']);
        $stmt->bindParam(":reservation_status_id", $json['reservation_status_id']);
        $stmt->bindParam(":notes", $json['notes']);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->execute();

        $returnValue = 0;
        // --- Update ReservedRoom logic ---
        if ($oldRoomId != $json['room_id']) {
            // Mark old ReservedRoom as deleted and set old room to available
            if ($oldRoomId) {
                $this->updateRoomStatus($oldRoomId, 1); // 1 = available
                $sql = "UPDATE ReservedRoom SET is_deleted = 1 
                        WHERE reservation_id = :reservation_id AND room_id = :room_id";
                $stmt = $db->prepare($sql);
                $stmt->bindParam(":reservation_id", $json['reservation_id']);
                $stmt->bindParam(":room_id", $oldRoomId);
                $stmt->execute();
            }
            // Insert new ReservedRoom record if not exists
            $sqlCheck = "SELECT COUNT(*) FROM ReservedRoom WHERE reservation_id = :reservation_id AND room_id = :room_id AND is_deleted = 0";
            $stmtCheck = $db->prepare($sqlCheck);
            $stmtCheck->bindParam(':reservation_id', $json['reservation_id']);
            $stmtCheck->bindParam(':room_id', $json['room_id']);
            $stmtCheck->execute();
            $exists = $stmtCheck->fetchColumn();
            if (!$exists) {
                $sql2 = "INSERT INTO ReservedRoom (reservation_id, room_id) VALUES (:reservation_id, :room_id)";
                $stmt2 = $db->prepare($sql2);
                $stmt2->bindParam(':reservation_id', $json['reservation_id']);
                $stmt2->bindParam(':room_id', $json['room_id']);
                $stmt2->execute();
            }
        }
        // Always update new/current room status based on reservation status
        // pending (1) => available (1)
        // confirmed (2) => reserved (4)
        // checked-in (3) => occupied (2)
        // checked-out (4) or cancelled (5) => available (1)
        $roomStatusId = 1; // Default to available (pending, checked-out, cancelled)
        if ($json['reservation_status_id'] == 2) {
            $roomStatusId = 4; // confirmed => reserved
        } else if ($json['reservation_status_id'] == 3) {
            $roomStatusId = 2; // checked-in => occupied
        }
        $this->updateRoomStatus($json['room_id'], $roomStatusId);

        // If status changed, log history
        if ($prevStatusId != $json['reservation_status_id']) {
            $this->logStatusHistory(
                $json['reservation_id'],
                $json['reservation_status_id'],
                isset($json['user_id']) ? $json['user_id'] : null
            );
        }

        // If any update happened, return 1
        if ($stmt->rowCount() > 0 || $oldRoomId != $json['room_id']) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }

    function getAllStatuses()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT * FROM ReservationStatus WHERE is_deleted = 0 ORDER BY reservation_status_id";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($statuses);
    }

    // Helper function to update room status
    private function updateRoomStatus($roomId, $statusId)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "UPDATE Room SET room_status_id = :status_id WHERE room_id = :room_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":room_id", $roomId);
        $stmt->bindParam(":status_id", $statusId);
        return $stmt->execute();
    }

    // --- Add this helper to log status history ---
    private function logStatusHistory($reservationId, $statusId, $userId = null)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "INSERT INTO ReservationStatusHistory (reservation_id, status_id, changed_by_user_id, changed_at)
                VALUES (:reservation_id, :status_id, :user_id, NOW())";
        $stmt = $db->prepare($sql);
        // --- Validate room availability for new dates ---
        if (!empty($json['room_id']) && !empty($json['check_in_date']) && !empty($json['check_out_date'])) {
            $sqlCheck = "SELECT rr.reserved_room_id
                FROM ReservedRoom rr
                INNER JOIN Reservation res ON rr.reservation_id = res.reservation_id AND res.is_deleted = 0
                WHERE rr.room_id = :room_id AND rr.is_deleted = 0
                AND res.reservation_id != :reservation_id
                AND (
                    (res.check_in_date <= :check_out_date AND res.check_out_date >= :check_in_date)
                )";
            $stmtCheck = $db->prepare($sqlCheck);
            $stmtCheck->bindParam(":room_id", $json['room_id']);
            $stmtCheck->bindParam(":reservation_id", $json['reservation_id']);
            $stmtCheck->bindParam(":check_in_date", $json['check_in_date']);
            $stmtCheck->bindParam(":check_out_date", $json['check_out_date']);
            $stmtCheck->execute();
            $conflict = $stmtCheck->fetchColumn();
            if ($conflict) {
                echo json_encode(["success" => false, "message" => "Selected room is not available for the chosen dates."]);
                return;
            }
        }
        $stmt->bindParam(':reservation_id', $reservationId);
        $stmt->bindParam(':status_id', $statusId);
        // Always bind user_id, even if null
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
    }

    // Confirm and create billing for pending online booking with on-hold payment info
    function confirmAndCreateBilling()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $reservation_id = isset($_POST['reservation_id']) ? $_POST['reservation_id'] : null;
        if (!$reservation_id) {
            echo json_encode(["success" => false, "message" => "Missing reservation_id."]);
            return;
        }
        // Fetch reservation
        $sql = "SELECT * FROM Reservation WHERE reservation_id = :reservation_id AND is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $reservation_id);
        $stmt->execute();
        $reservation = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$reservation) {
            echo json_encode(["success" => false, "message" => "Reservation not found."]);
            return;
        }
        if ($reservation['reservation_status_id'] != 1) { // 1 = pending
            echo json_encode(["success" => false, "message" => "Reservation is not pending."]);
            return;
        }
        // Get on-hold payment from Payment table
        $sqlPayment = "SELECT * FROM Payment WHERE reservation_id = :reservation_id AND payment_status_id = 1 ORDER BY created_at DESC LIMIT 1";
        $stmtPayment = $db->prepare($sqlPayment);
        $stmtPayment->bindParam(":reservation_id", $reservation_id);
        $stmtPayment->execute();
        $onHoldPayment = $stmtPayment->fetch(PDO::FETCH_ASSOC);

        // Insert with room_type_id if provided
        $sql2 = "INSERT INTO ReservedRoom (reservation_id, room_id, room_type_id) VALUES (:reservation_id, :room_id, :room_type_id)";
        $stmt2 = $db->prepare($sql2);
        $stmt2->bindParam(':reservation_id', $json['reservation_id']);
        $stmt2->bindParam(':room_id', $json['room_id']);
        $room_type_id = isset($json['room_type_id']) ? $json['room_type_id'] : null;
        $stmt2->bindParam(':room_type_id', $room_type_id);
        $stmt2->execute();
        $sqlRooms = "SELECT SUM(COALESCE(rt_rr.price_per_stay, rt_r.price_per_stay)) AS total_price
            FROM Reservation res
            LEFT JOIN ReservedRoom rr ON res.reservation_id = rr.reservation_id AND rr.is_deleted = 0
            LEFT JOIN Room r ON rr.room_id = r.room_id
            LEFT JOIN RoomType rt_rr ON rr.room_type_id = rt_rr.room_type_id
            LEFT JOIN RoomType rt_r ON r.room_type_id = rt_r.room_type_id
            WHERE res.reservation_id = :reservation_id";
        $stmtRooms = $db->prepare($sqlRooms);
        $stmtRooms->bindParam(":reservation_id", $reservation_id);
        $stmtRooms->execute();
        $rowRooms = $stmtRooms->fetch(PDO::FETCH_ASSOC);
        $total_price = ($rowRooms && isset($rowRooms['total_price'])) ? floatval($rowRooms['total_price']) : 0;
        // Check if billing already exists (from online booking)
        $sqlCheckBilling = "SELECT billing_id FROM Billing WHERE reservation_id = :reservation_id AND is_deleted = 0";
        $stmtCheckBilling = $db->prepare($sqlCheckBilling);
        // --- Update billing if room type or room changes ---
        if (!empty($json['reservation_id'])) {
            // Get total price for the new room type
            $sqlPrice = "SELECT price_per_stay FROM RoomType WHERE room_type_id = :room_type_id";
            $stmtPrice = $db->prepare($sqlPrice);
            $room_type_id = isset($json['room_type_id']) ? $json['room_type_id'] : null;
            $stmtPrice->bindParam(':room_type_id', $room_type_id);
            $stmtPrice->execute();
            $price = $stmtPrice->fetchColumn();
            if ($price !== false) {
                $sqlUpdateBill = "UPDATE Billing SET total_amount = :total_amount WHERE reservation_id = :reservation_id AND is_deleted = 0";
                $stmtUpdateBill = $db->prepare($sqlUpdateBill);
                $stmtUpdateBill->bindParam(':total_amount', $price);
                $stmtUpdateBill->bindParam(':reservation_id', $json['reservation_id']);
                $stmtUpdateBill->execute();
            }
        }
        $stmtCheckBilling->bindParam(":reservation_id", $reservation_id);
        $stmtCheckBilling->execute();
        $existingBilling = $stmtCheckBilling->fetch(PDO::FETCH_ASSOC);

        if ($existingBilling) {
            // Use existing billing (created during online booking)
            $billingId = $existingBilling['billing_id'];

            // Update billing status to confirmed if needed
            $sqlUpdateBilling = "UPDATE Billing SET billing_status_id = 3, updated_at = NOW() WHERE billing_id = :billing_id";
            $stmtUpdateBilling = $db->prepare($sqlUpdateBilling);
            $stmtUpdateBilling->bindParam(":billing_id", $billingId);
            $stmtUpdateBilling->execute();
        } else {
            // Fallback: Create new billing if somehow it doesn't exist
            $sqlBill = "INSERT INTO Billing (reservation_id, billing_status_id, total_amount, billing_date) VALUES (:reservation_id, :billing_status_id, :total_amount, NOW())";
            $stmtBill = $db->prepare($sqlBill);
            $billing_status_id = 3; // PARTIAL
            $stmtBill->bindParam(":reservation_id", $reservation_id);
            $stmtBill->bindParam(":billing_status_id", $billing_status_id);
            $stmtBill->bindParam(":total_amount", $total_price);
            $stmtBill->execute();
            $billingId = $db->lastInsertId();
        }
        // Confirm the on-hold payment by changing its status to confirmed (2)
        if ($billingId && $onHoldPayment['amount_paid'] > 0) {
            // Update payment status to confirmed (billing_id should already be set)
            $sqlUpdatePayment = "UPDATE Payment SET payment_status_id = 2, updated_at = NOW() WHERE payment_id = :payment_id";
            $stmtUpdatePayment = $db->prepare($sqlUpdatePayment);
            $stmtUpdatePayment->bindParam(":payment_id", $onHoldPayment['payment_id']);
            $stmtUpdatePayment->execute();

            // Double check billing_id is set (in case of old data)
            if (!$onHoldPayment['billing_id']) {
                $sqlUpdatePaymentBilling = "UPDATE Payment SET billing_id = :billing_id WHERE payment_id = :payment_id";
                $stmtUpdatePaymentBilling = $db->prepare($sqlUpdatePaymentBilling);
                $stmtUpdatePaymentBilling->bindParam(":billing_id", $billingId);
                $stmtUpdatePaymentBilling->bindParam(":payment_id", $onHoldPayment['payment_id']);
                $stmtUpdatePaymentBilling->execute();
            }
        }
        // Update reservation: set status to confirmed (2)
        $sqlUpdate = "UPDATE Reservation SET reservation_status_id = 2, updated_at = NOW() WHERE reservation_id = :reservation_id";
        $stmtUpdate = $db->prepare($sqlUpdate);
        $stmtUpdate->bindParam(":reservation_id", $reservation_id);
        $stmtUpdate->execute();
        // Log status history
        $this->logStatusHistory($reservation_id, 2, $reservation['user_id']);
        echo json_encode(["success" => true]);
    }


    // Method to delete a reservation (soft delete)
    function deleteReservation($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = is_array($json) ? $json : json_decode($json, true);

        $reservationId = $json['reservation_id'];

        // Soft delete the reservation
        $sql = "UPDATE Reservation SET is_deleted = 1 WHERE reservation_id = :reservation_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $reservationId);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;

            // Also mark ReservedRoom as deleted and update room status to available
            $sql = "SELECT room_id FROM ReservedRoom WHERE reservation_id = :reservation_id AND is_deleted = 0";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(":reservation_id", $reservationId);
            $stmt->execute();
            $roomIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            // Mark ReservedRoom as deleted
            $sql = "UPDATE ReservedRoom SET is_deleted = 1 WHERE reservation_id = :reservation_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(":reservation_id", $reservationId);
            $stmt->execute();

            // Update room status to available
            foreach ($roomIds as $roomId) {
                $this->updateRoomStatus($roomId, 1); // 1 = available
            }
        }
        echo json_encode($returnValue);
    }

    // --- API to get reservation status history ---
    function getReservationStatusHistory($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = is_array($json) ? $json : json_decode($json, true);

        $sql = "SELECT h.*, s.reservation_status, u.username
                FROM ReservationStatusHistory h
                LEFT JOIN ReservationStatus s ON h.status_id = s.reservation_status_id
                LEFT JOIN User u ON h.changed_by_user_id = u.user_id
                WHERE h.reservation_id = :reservation_id
                ORDER BY h.changed_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':reservation_id', $json['reservation_id']);
        $stmt->execute();
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($history);
    }

    // --- API to get ALL reservation status histories with guest and room info ---
    function getAllReservationStatusHistory()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT h.*, s.reservation_status, u.username, ur.role_type AS user_role,
                       u.user_id AS changed_by_user_id,
                       r.guest_id, CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
                       rm.room_number, rt.type_name
                FROM ReservationStatusHistory h
                LEFT JOIN ReservationStatus s ON h.status_id = s.reservation_status_id
                LEFT JOIN User u ON h.changed_by_user_id = u.user_id
                LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id
                LEFT JOIN Reservation r ON h.reservation_id = r.reservation_id
                LEFT JOIN Guest g ON r.guest_id = g.guest_id
                LEFT JOIN ReservedRoom rr ON r.reservation_id = rr.reservation_id AND rr.is_deleted = 0
                LEFT JOIN Room rm ON rr.room_id = rm.room_id
                LEFT JOIN RoomType rt ON rm.room_type_id = rt.room_type_id
                ORDER BY h.changed_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($history);
    }
}

// --- Unified request handling (like SIR MAC) ---
$operation = '';
$json = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';
    if (!$operation) {
        if (isset($_GET['reservation_id'])) {
            $operation = 'getReservation';
            $json = json_encode(['reservation_id' => $_GET['reservation_id']]);
        } else {
            $operation = 'getAllReservations';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
    // --- Get user_id from session if available and inject into $json for logging ---
    if (in_array($operation, ['updateReservation', 'insertReservation', 'deleteReservation'])) {
        session_start();
        if (!empty($_SESSION['user_id'])) {
            $jsonArr = json_decode($json, true);
            $jsonArr['user_id'] = $_SESSION['user_id'];
            $json = json_encode($jsonArr);
        }
    }
}

$reservation = new Reservation();
switch ($operation) {
    case "getAllReservations":
        $reservation->getAllReservations();
        break;
    case "insertReservation":
        $reservation->insertReservation($json);
        break;
    case "getReservation":
        $reservation->getReservation($json);
        break;
    case "updateReservation":
        $reservation->updateReservation($json);
        break;
    case "deleteReservation":
        $reservation->deleteReservation($json);
        break;
    case "getReservationStatusHistory":
        $reservation->getReservationStatusHistory($json);
        break;
    case "getAllReservationStatusHistory":
        $reservation->getAllReservationStatusHistory();
        break;
    case "confirmAndCreateBilling":
        $reservation->confirmAndCreateBilling();
        break;
}
