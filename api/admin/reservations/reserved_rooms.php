<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class ReservedRoom
{
    function getAllReservedRooms()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT rr.*, 
                       r.room_number, 
                       rt.type_name, 
                       res.reservation_id, 
                       CONCAT(g.first_name, ' ', g.last_name) AS guest_name
                FROM ReservedRoom rr
                LEFT JOIN Room r ON rr.room_id = r.room_id
                LEFT JOIN RoomType rt ON r.room_type_id = rt.room_type_id
                LEFT JOIN Reservation res ON rr.reservation_id = res.reservation_id
                LEFT JOIN Guest g ON res.guest_id = g.guest_id
                WHERE rr.is_deleted = 0
                ORDER BY rr.created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertReservedRoom($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "INSERT INTO ReservedRoom (reservation_id, room_id)
                VALUES (:reservation_id, :room_id)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->bindParam(":room_id", $json['room_id']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }

    function getReservedRoomsByReservation($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT rr.*, 
                       r.room_number, 
                       rt.type_name, 
                       rt.price_per_stay,
                       res.reservation_id, 
                       CONCAT(g.first_name, ' ', g.last_name) AS guest_name
                FROM ReservedRoom rr
                LEFT JOIN Room r ON rr.room_id = r.room_id
                LEFT JOIN RoomType rt ON COALESCE(r.room_type_id, rr.room_type_id) = rt.room_type_id
                LEFT JOIN Reservation res ON rr.reservation_id = res.reservation_id
                LEFT JOIN Guest g ON res.guest_id = g.guest_id
                WHERE rr.reservation_id = :reservation_id AND rr.is_deleted = 0
                ORDER BY rr.reserved_room_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->execute();
        $reservedRooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get companions for each reserved room
        foreach ($reservedRooms as &$room) {
            $sqlCompanions = "SELECT full_name FROM ReservedRoomCompanion 
                             WHERE reserved_room_id = :reserved_room_id AND is_deleted = 0";
            $stmtCompanions = $db->prepare($sqlCompanions);
            $stmtCompanions->bindParam(":reserved_room_id", $room['reserved_room_id']);
            $stmtCompanions->execute();
            $companions = $stmtCompanions->fetchAll(PDO::FETCH_COLUMN);
            $room['companions'] = $companions;
        }

        echo json_encode(['status' => 'success', 'data' => $reservedRooms]);
    }

    function getReservedRoom($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT rr.*, 
                       r.room_number, 
                       rt.type_name, 
                       res.reservation_id, 
                       CONCAT(g.first_name, ' ', g.last_name) AS guest_name
                FROM ReservedRoom rr
                LEFT JOIN Room r ON rr.room_id = r.room_id
                LEFT JOIN RoomType rt ON r.room_type_id = rt.room_type_id
                LEFT JOIN Reservation res ON rr.reservation_id = res.reservation_id
                LEFT JOIN Guest g ON res.guest_id = g.guest_id
                WHERE rr.reserved_room_id = :reserved_room_id AND rr.is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reserved_room_id", $json['reserved_room_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function updateReservedRoom($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE ReservedRoom 
                SET reservation_id = :reservation_id,
                    room_id = :room_id
                WHERE reserved_room_id = :reserved_room_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->bindParam(":room_id", $json['room_id']);
        $stmt->bindParam(":reserved_room_id", $json['reserved_room_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteReservedRoom($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE ReservedRoom SET is_deleted = 1 WHERE reserved_room_id = :reserved_room_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reserved_room_id", $json['reserved_room_id']);
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
        if (isset($_GET['reserved_room_id'])) {
            $operation = 'getReservedRoom';
            $json = json_encode(['reserved_room_id' => $_GET['reserved_room_id']]);
        } elseif (isset($_GET['reservation_id'])) {
            $operation = 'getReservedRoomsByReservation';
            $json = json_encode(['reservation_id' => $_GET['reservation_id']]);
        } else {
            $operation = 'getAllReservedRooms';
        }
    } else {
        // Build JSON from GET parameters for specific operations
        if ($operation === 'getReservedRoomsByReservation' && isset($_GET['reservation_id'])) {
            $json = json_encode(['reservation_id' => $_GET['reservation_id']]);
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';

    // Handle JSON input from request body
    if (!$json && $_POST) {
        $json = json_encode($_POST);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if ($input) {
        $operation = $input['operation'] ?? $operation;
        $json = $json ?: json_encode($input);
    }
}

$reservedRoom = new ReservedRoom();
switch ($operation) {
    case "getAllReservedRooms":
        $reservedRoom->getAllReservedRooms();
        break;
    case "getReservedRoomsByReservation":
        $reservedRoom->getReservedRoomsByReservation($json);
        break;
    case "insertReservedRoom":
        $reservedRoom->insertReservedRoom($json);
        break;
    case "getReservedRoom":
        $reservedRoom->getReservedRoom($json);
        break;
    case "updateReservedRoom":
        $reservedRoom->updateReservedRoom($json);
        break;
    case "deleteReservedRoom":
        $reservedRoom->deleteReservedRoom($json);
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid operation']);
        break;
}
