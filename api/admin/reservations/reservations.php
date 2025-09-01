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
               u.username AS created_by_username,
               u.user_id AS created_by_user_id,
               ur.role_type AS created_by_role
        FROM Reservation res
        LEFT JOIN Guest g ON res.guest_id = g.guest_id
        LEFT JOIN ReservationStatus rs ON res.reservation_status_id = rs.reservation_status_id
        LEFT JOIN ReservedRoom rr ON res.reservation_id = rr.reservation_id AND rr.is_deleted = 0
        LEFT JOIN Room r ON rr.room_id = r.room_id
        LEFT JOIN RoomType rt ON r.room_type_id = rt.room_type_id
        LEFT JOIN User u ON res.user_id = u.user_id
        LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id
        WHERE res.is_deleted = 0";

        // Apply filters
        $params = array();
        if ($statusFilter) {
            $sql .= " AND rs.reservation_status = :status";
            $params[':status'] = $statusFilter;
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

        $sql .= " GROUP BY res.reservation_id ORDER BY res.reservation_id DESC";

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
        // Merge companions from POST if present (FormData sends companions as a separate field)
        if (isset($_POST['companions']) && !isset($json['companions'])) {
            $json['companions'] = $_POST['companions'];
        }

        $userId = isset($json['user_id']) ? $json['user_id'] : null;
        $reservation_status_id = 1;

        // Always set reservation_type to 'walk-in' for admin-created reservations
        $reservation_type = 'walk-in';
        $sql = "INSERT INTO Reservation (user_id, reservation_status_id, guest_id, reservation_type, check_in_date, check_out_date)
        VALUES (:user_id, :reservation_status_id, :guest_id, :reservation_type, :check_in_date, :check_out_date)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':reservation_status_id', $reservation_status_id);
        $stmt->bindParam(':guest_id', $json['guest_id']);
        $stmt->bindParam(':reservation_type', $reservation_type);
        $stmt->bindParam(':check_in_date', $json['check_in_date']);
        $stmt->bindParam(':check_out_date', $json['check_out_date']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
            $reservationId = $db->lastInsertId();

            // --- Single Room Booking ---
            $reserved_room_id = null;
            if (!empty($json['room_type_id']) && !empty($json['room_id'])) {
                $sql2 = "INSERT INTO ReservedRoom (reservation_id, room_id) VALUES (:reservation_id, :room_id)";
                $stmt2 = $db->prepare($sql2);
                $stmt2->bindParam(':reservation_id', $reservationId);
                $stmt2->bindParam(':room_id', $json['room_id']);
                $stmt2->execute();
                $reserved_room_id = $db->lastInsertId();
            }

            // --- Save companions for single room booking ---
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
            if (!empty($companions) && $reserved_room_id) {
                foreach ($companions as $companionName) {
                    if (trim($companionName) !== "") {
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
                    if ($room_id) {
                        $sql2 = "INSERT INTO ReservedRoom (reservation_id, room_id) VALUES (:reservation_id, :room_id)";
                        $stmt2 = $db->prepare($sql2);
                        $stmt2->bindParam(':reservation_id', $reservationId);
                        $stmt2->bindParam(':room_id', $room_id);
                        $stmt2->execute();
                        $reserved_room_id_multi = $db->lastInsertId();
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
                        // Only set room status to reserved if reservation is confirmed
                        if ($reservation_status_id == 2) { // 2 = confirmed
                            $this->updateRoomStatus($room_id, 4); // 4 = reserved
                        }
                    }
                }
            }

            // --- AUTO BILLING: FULL AMOUNT, PARTIAL PAYMENT ---
            // Only insert billing if one does not already exist for this reservation
            $sqlCheckBill = "SELECT COUNT(*) FROM Billing WHERE reservation_id = :reservation_id AND is_deleted = 0";
            $stmtCheckBill = $db->prepare($sqlCheckBill);
            $stmtCheckBill->bindParam(":reservation_id", $reservationId);
            $stmtCheckBill->execute();
            $billingExists = $stmtCheckBill->fetchColumn();
            if (!$billingExists) {
                // Get total price for all rooms in this reservation
                $sqlRooms = "SELECT SUM(rt.price_per_stay) AS total_price\n                FROM Reservation res\n                LEFT JOIN ReservedRoom rr ON res.reservation_id = rr.reservation_id AND rr.is_deleted = 0\n                LEFT JOIN Room r ON rr.room_id = r.room_id\n                LEFT JOIN RoomType rt ON r.room_type_id = rt.room_type_id\n                WHERE res.reservation_id = :reservation_id";
                $stmtRooms = $db->prepare($sqlRooms);
                $stmtRooms->bindParam(":reservation_id", $reservationId);
                $stmtRooms->execute();
                $rowRooms = $stmtRooms->fetch(PDO::FETCH_ASSOC);
                $total_price = ($rowRooms && isset($rowRooms['total_price'])) ? floatval($rowRooms['total_price']) : 0;
                $partial_amount = $total_price * 0.5;
                // Insert billing with FULL price, PARTIAL status (id=3)
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
                    $sqlPay = "INSERT INTO Payment (user_id, billing_id, reservation_id, sub_method_id, amount_paid, payment_date, notes, reference_number, is_deleted) VALUES (:user_id, :billing_id, :reservation_id, :sub_method_id, :amount_paid, NOW(), :notes, :reference_number, 0)";
                    $stmtPay = $db->prepare($sqlPay);
                    $stmtPay->bindParam(":user_id", $userId);
                    $stmtPay->bindParam(":billing_id", $billingId);
                    $stmtPay->bindParam(":reservation_id", $reservationId);
                    $stmtPay->bindParam(":sub_method_id", $sub_method_id);
                    $stmtPay->bindParam(":amount_paid", $partial_amount);
                    $note = "Partial/Downpayment (auto)";
                    $stmtPay->bindParam(":notes", $note);
                    $reference_number = isset($json['reference_number']) ? $json['reference_number'] : null;
                    $stmtPay->bindParam(":reference_number", $reference_number);
                    $stmtPay->execute();
                }
            }

            $this->logStatusHistory($reservationId, $reservation_status_id, $userId);
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
                    reservation_status_id = :reservation_status_id
                WHERE reservation_id = :reservation_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":guest_id", $json['guest_id']);
        $stmt->bindParam(":check_in_date", $json['check_in_date']);
        $stmt->bindParam(":check_out_date", $json['check_out_date']);
        $stmt->bindParam(":reservation_status_id", $json['reservation_status_id']);
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
        $stmt->bindParam(':reservation_id', $reservationId);
        $stmt->bindParam(':status_id', $statusId);
        // Always bind user_id, even if null
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
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
}
