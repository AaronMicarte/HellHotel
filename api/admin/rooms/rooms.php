<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Room
{
    function getAllRooms()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $params = [];
        $where = ["r.is_deleted = FALSE"];

        if (isset($_GET['search']) && !empty($_GET['search'])) {
            $search = "%{$_GET['search']}%";
            $where[] = "(r.room_number LIKE :search OR rt.type_name LIKE :search OR rs.room_status LIKE :search)";
            $params[':search'] = $search;
        }

        if (isset($_GET['type_id']) && !empty($_GET['type_id'])) {
            $where[] = "r.room_type_id = :type_id";
            $params[':type_id'] = $_GET['type_id'];
        } else if (isset($_GET['type']) && !empty($_GET['type'])) {
            $where[] = "LOWER(rt.type_name) = LOWER(:type)";
            $params[':type'] = $_GET['type'];
        }

        if (isset($_GET['status']) && !empty($_GET['status'])) {
            $where[] = "LOWER(rs.room_status) = LOWER(:status)";
            $params[':status'] = $_GET['status'];
        }

        // Feature filter (by feature_id)
        $featureJoin = '';
        if (isset($_GET['feature_id']) && !empty($_GET['feature_id'])) {
            $featureJoin = "JOIN RoomTypeFeature rtf ON r.room_type_id = rtf.room_type_id AND rtf.feature_id = :feature_id";
            $params[':feature_id'] = $_GET['feature_id'];
        }

        $whereClause = implode(" AND ", $where);

        $query = "SELECT 
                    r.*, 
                    rt.type_name, 
                    rt.description AS room_type_description,
                    rt.room_size_sqm,
                    rt.max_capacity,
                    rt.price_per_stay,
                    rt.image_url AS room_type_image_url,
                    rs.room_status 
                  FROM Room r 
                  LEFT JOIN RoomType rt ON r.room_type_id = rt.room_type_id 
                  LEFT JOIN RoomStatus rs ON r.room_status_id = rs.room_status_id 
                  $featureJoin
                  WHERE {$whereClause}
                  ORDER BY r.room_number";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Attach features for each room (by room_type_id)
        foreach ($rooms as &$room) {
            $features = [];
            if (!empty($room['room_type_id'])) {
                $fstmt = $db->prepare("SELECT f.feature_id, f.feature_name FROM RoomTypeFeature rtf JOIN Feature f ON rtf.feature_id = f.feature_id WHERE rtf.room_type_id = ?");
                $fstmt->execute([$room['room_type_id']]);
                $features = $fstmt->fetchAll(PDO::FETCH_ASSOC);
            }
            $room['features'] = $features;
        }

        echo json_encode($rooms);
    }

    function getRoom($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $query = "SELECT 
                    r.*, 
                    rt.type_name, 
                    rt.description AS room_type_description,
                    rt.room_size_sqm,
                    rt.max_capacity,
                    rt.price_per_stay,
                    rt.image_url AS room_type_image_url,
                    rs.room_status 
                  FROM Room r 
                  LEFT JOIN RoomType rt ON r.room_type_id = rt.room_type_id 
                  LEFT JOIN RoomStatus rs ON r.room_status_id = rs.room_status_id 
                  WHERE r.room_id = :room_id AND r.is_deleted = FALSE";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":room_id", $json['room_id']);
        $stmt->execute();

        $room = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Attach features for this room (by room_type_id)
        if (!empty($room[0]['room_type_id'])) {
            $fstmt = $db->prepare("SELECT f.feature_id, f.feature_name FROM RoomTypeFeature rtf JOIN Feature f ON rtf.feature_id = f.feature_id WHERE rtf.room_type_id = ?");
            $fstmt->execute([$room[0]['room_type_id']]);
            $features = $fstmt->fetchAll(PDO::FETCH_ASSOC);
            $room[0]['features'] = $features;
        }

        echo json_encode($room);
    }

    function insertRoom($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $json['room_status_id'] = 1;

        $sql = "INSERT INTO Room (room_status_id, room_type_id, room_number) 
                VALUES (:status_id, :type_id, :room_number)";

        $stmt = $db->prepare($sql);
        $stmt->bindParam(':status_id', $json['room_status_id']);
        $stmt->bindParam(':type_id', $json['room_type_id']);
        $stmt->bindParam(':room_number', $json['room_number']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function updateRoom($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        if (isset($json['update_type']) && $json['update_type'] === 'status_only') {
            $sql = "UPDATE Room SET room_status_id = :status_id WHERE room_id = :room_id";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':status_id', $json['room_status_id']);
            $stmt->bindParam(':room_id', $json['room_id']);
            $stmt->execute();
            $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
            echo json_encode($returnValue);
            return;
        }

        $sql = "UPDATE Room 
                SET room_type_id = :type_id,
                    room_number = :room_number,
                    room_status_id = :status_id
                WHERE room_id = :room_id";

        $stmt = $db->prepare($sql);
        $stmt->bindParam(':type_id', $json['room_type_id']);
        $stmt->bindParam(':room_number', $json['room_number']);
        $stmt->bindParam(':status_id', $json['room_status_id']);
        $stmt->bindParam(':room_id', $json['room_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteRoom($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE Room SET is_deleted = TRUE WHERE room_id = :room_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":room_id", $json['room_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    // MOVED THE getAvailableRooms METHOD HERE
    function getAvailableRooms()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $room_type_id = $_GET['room_type_id'] ?? null;
        $check_in_date = $_GET['check_in_date'] ?? null;
        $check_out_date = $_GET['check_out_date'] ?? null;
        $reservation_id = $_GET['reservation_id'] ?? null;

        if (!$room_type_id) {
            echo json_encode([]);
            return;
        }

        if (!$check_out_date && $check_in_date) {
            $dt = new DateTime($check_in_date);
            $dt->modify('+1 day');
            $check_out_date = $dt->format('Y-m-d');
        }

        $params = [':room_type_id' => $room_type_id];
        $dateFilter = '';

        // Only filter by date if both check-in and check-out are provided
        if ($check_in_date && $check_out_date) {
            $dateFilter = "AND r.room_id NOT IN (
                SELECT rr.room_id
                FROM ReservedRoom rr
                JOIN Reservation res ON rr.reservation_id = res.reservation_id
                WHERE rr.is_deleted = 0
                  AND res.is_deleted = 0
                  AND res.reservation_status_id != (SELECT reservation_status_id FROM ReservationStatus WHERE reservation_status = 'cancelled' LIMIT 1)
                  AND (
                    (res.check_in_date < :check_out_date AND res.check_out_date > :check_in_date)
                  )";
            $params[':check_in_date'] = $check_in_date;
            $params[':check_out_date'] = $check_out_date;
            // If editing, allow the current reservation's room to be available
            if ($reservation_id) {
                $dateFilter .= " AND res.reservation_id != :reservation_id";
                $params[':reservation_id'] = $reservation_id;
            }
            $dateFilter .= ")";
        }

        $sql = "SELECT r.room_id, r.room_number, rt.type_name
                FROM Room r
                JOIN RoomType rt ON r.room_type_id = rt.room_type_id
                WHERE r.is_deleted = 0
                AND r.room_type_id = :room_type_id
                $dateFilter
                ORDER BY r.room_number ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rooms);
    }
}

class RoomStatus
{
    function getAllRoomStatus()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $stmt = $db->prepare("SELECT * FROM RoomStatus WHERE is_deleted = 0 ORDER BY room_status_id ASC");
        $stmt->execute();
        $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($statuses);
    }
}

// Handle request routing
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';

    if (!$operation) {
        if (isset($_GET['room_id'])) {
            $operation = 'getRoom';
            $json = json_encode(['room_id' => $_GET['room_id']]);
        } else {
            $operation = 'getAllRooms';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$room = new Room();
$roomStatus = new RoomStatus();

switch ($operation) {
    case "getAllRooms":
        $room->getAllRooms();
        break;
    case "insertRoom":
        $room->insertRoom($json);
        break;
    case "getRoom":
        $room->getRoom($json);
        break;
    case "updateRoom":
        $room->updateRoom($json);
        break;
    case "deleteRoom":
        $room->deleteRoom($json);
        break;
    case "getAllRoomStatus":
        $roomStatus->getAllRoomStatus();
        break;
    case "getAvailableRooms":
        $room->getAvailableRooms();
        break;
    default:
        echo json_encode(['error' => 'Invalid operation']);
        break;
}
