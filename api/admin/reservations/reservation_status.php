<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class ReservationStatus
{
    // Get full status change history for all reservations
    function getAllStatusHistory()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "
            SELECT
                h.history_id,
                h.reservation_id,
                r.guest_id,
                CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
                rs.reservation_status,
                h.changed_at,
                u.username AS changed_by_username,
                ur.role_type AS changed_by_role
            FROM ReservationStatusHistory h
            JOIN Reservation r ON h.reservation_id = r.reservation_id
            LEFT JOIN Guest g ON r.guest_id = g.guest_id
            JOIN ReservationStatus rs ON h.status_id = rs.reservation_status_id
            LEFT JOIN User u ON h.changed_by_user_id = u.user_id
            LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id
            WHERE r.is_deleted = 0
            ORDER BY h.changed_at DESC
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($rows);
    }
    // Change reservation status with validation and audit
    function changeReservationStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $reservation_id = $json['reservation_id'];
        $new_status_id = $json['new_status_id'];
        $changed_by_user_id = isset($json['changed_by_user_id']) ? $json['changed_by_user_id'] : null;

        // Get current reservation and status
        $sql = "SELECT r.reservation_status_id, rs.reservation_status, r.guest_id, r.user_id FROM Reservation r JOIN ReservationStatus rs ON r.reservation_status_id = rs.reservation_status_id WHERE r.reservation_id = :reservation_id AND r.is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $reservation_id);
        $stmt->execute();
        $reservation = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$reservation) {
            echo json_encode(["success" => false, "message" => "Reservation not found."]);
            return;
        }

        $current_status_id = $reservation['reservation_status_id'];
        $current_status = $reservation['reservation_status'];

        // Get new status name
        $sql = "SELECT reservation_status FROM ReservationStatus WHERE reservation_status_id = :new_status_id AND is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":new_status_id", $new_status_id);
        $stmt->execute();
        $new_status_row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$new_status_row) {
            echo json_encode(["success" => false, "message" => "Invalid status."]);
            return;
        }
        $new_status = $new_status_row['reservation_status'];

        // Allowed transitions
        $allowed = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['checked-in', 'cancelled'],
            'checked-in' => ['checked-out'],
            'checked-out' => [],
            'cancelled' => [],
        ];
        if (!isset($allowed[$current_status]) || !in_array($new_status, $allowed[$current_status])) {
            echo json_encode(["success" => false, "message" => "Invalid status transition."]);
            return;
        }

        // If checking out, ensure bill is paid
        if ($new_status === 'checked-out') {
            // Get billing status
            $sql = "SELECT b.billing_status_id, bs.billing_status FROM Billing b JOIN BillingStatus bs ON b.billing_status_id = bs.billing_status_id WHERE b.reservation_id = :reservation_id AND b.is_deleted = 0 ORDER BY b.billing_id DESC LIMIT 1";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(":reservation_id", $reservation_id);
            $stmt->execute();
            $billing = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$billing || $billing['billing_status'] !== 'paid') {
                echo json_encode(["success" => false, "message" => "Cannot check out: bill is not fully paid."]);
                return;
            }
        }

        // Update reservation status
        $sql = "UPDATE Reservation SET reservation_status_id = :new_status_id, updated_at = NOW() WHERE reservation_id = :reservation_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":new_status_id", $new_status_id);
        $stmt->bindParam(":reservation_id", $reservation_id);
        $stmt->execute();

        // Update room status if needed
        // Get reserved rooms
        $sql = "SELECT rr.room_id FROM ReservedRoom rr WHERE rr.reservation_id = :reservation_id AND rr.is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $reservation_id);
        $stmt->execute();
        $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if ($rooms) {
            foreach ($rooms as $room) {
                $room_id = $room['room_id'];
                if ($new_status === 'checked-in') {
                    // Set room to occupied
                    $room_status_id = $this->getRoomStatusId($db, 'occupied');
                } else if ($new_status === 'checked-out' || $new_status === 'cancelled') {
                    // Set room to available
                    $room_status_id = $this->getRoomStatusId($db, 'available');
                } else if ($new_status === 'confirmed') {
                    // Set room to reserved
                    $room_status_id = $this->getRoomStatusId($db, 'reserved');
                } else {
                    $room_status_id = null;
                }
                if ($room_status_id) {
                    $sql2 = "UPDATE Room SET room_status_id = :room_status_id, updated_at = NOW() WHERE room_id = :room_id";
                    $stmt2 = $db->prepare($sql2);
                    $stmt2->bindParam(":room_status_id", $room_status_id);
                    $stmt2->bindParam(":room_id", $room_id);
                    $stmt2->execute();
                }
            }
        }

        // Log status change
        $sql = "INSERT INTO ReservationStatusHistory (reservation_id, status_id, changed_by_user_id) VALUES (:reservation_id, :status_id, :changed_by_user_id)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $reservation_id);
        $stmt->bindParam(":status_id", $new_status_id);
        $stmt->bindParam(":changed_by_user_id", $changed_by_user_id);
        $stmt->execute();

        echo json_encode(["success" => true, "message" => "Status updated."]);
    }

    // Helper: get room_status_id by name
    function getRoomStatusId($db, $status_name)
    {
        $sql = "SELECT room_status_id FROM RoomStatus WHERE room_status = :status_name AND is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":status_name", $status_name);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? $row['room_status_id'] : null;
    }
    function getAllStatuses()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT * FROM ReservationStatus WHERE is_deleted = 0 ORDER BY reservation_status_id";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "INSERT INTO ReservationStatus (reservation_status) VALUES (:reservation_status)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_status", $json['reservation_status']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }

    function getStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT * FROM ReservationStatus WHERE reservation_status_id = :reservation_status_id AND is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_status_id", $json['reservation_status_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function updateStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE ReservationStatus SET reservation_status = :reservation_status WHERE reservation_status_id = :reservation_status_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_status", $json['reservation_status']);
        $stmt->bindParam(":reservation_status_id", $json['reservation_status_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE ReservationStatus SET is_deleted = 1 WHERE reservation_status_id = :reservation_status_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_status_id", $json['reservation_status_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }
}

// Request handling
$operation = '';
$json = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';
    if (!$operation) {
        if (isset($_GET['reservation_status_id'])) {
            $operation = 'getStatus';
            $json = json_encode(['reservation_status_id' => $_GET['reservation_status_id']]);
        } else {
            $operation = 'getAllStatuses';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$resStatus = new ReservationStatus();
switch ($operation) {
    case "getAllStatuses":
        $resStatus->getAllStatuses();
        break;
    case "getAllStatusHistory":
        $resStatus->getAllStatusHistory();
        break;
    case "insertStatus":
        $resStatus->insertStatus($json);
        break;
    case "getStatus":
        $resStatus->getStatus($json);
        break;
    case "updateStatus":
        $resStatus->updateStatus($json);
        break;
    case "deleteStatus":
        $resStatus->deleteStatus($json);
        break;
    case "changeReservationStatus":
        $resStatus->changeReservationStatus($json);
        break;
}
