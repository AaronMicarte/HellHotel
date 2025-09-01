<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class ReservedRoomCompanion
{
    function getAllCompanions()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT c.*, rr.reserved_room_id, r.room_number, res.reservation_id, CONCAT(g.first_name, ' ', g.last_name) AS guest_name
                FROM ReservedRoomCompanion c
                LEFT JOIN ReservedRoom rr ON c.reserved_room_id = rr.reserved_room_id
                LEFT JOIN Room r ON rr.room_id = r.room_id
                LEFT JOIN Reservation res ON rr.reservation_id = res.reservation_id
                LEFT JOIN Guest g ON res.guest_id = g.guest_id
                WHERE c.is_deleted = 0
                ORDER BY c.created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertCompanion($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "INSERT INTO ReservedRoomCompanion (reserved_room_id, full_name)
                VALUES (:reserved_room_id, :full_name)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reserved_room_id", $json['reserved_room_id']);
        $stmt->bindParam(":full_name", $json['full_name']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }

    function getCompanion($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT c.*, rr.reserved_room_id, r.room_number, res.reservation_id, CONCAT(g.first_name, ' ', g.last_name) AS guest_name
                FROM ReservedRoomCompanion c
                LEFT JOIN ReservedRoom rr ON c.reserved_room_id = rr.reserved_room_id
                LEFT JOIN Room r ON rr.room_id = r.room_id
                LEFT JOIN Reservation res ON rr.reservation_id = res.reservation_id
                LEFT JOIN Guest g ON res.guest_id = g.guest_id
                WHERE c.companion_id = :companion_id AND c.is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":companion_id", $json['companion_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function updateCompanion($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE ReservedRoomCompanion 
                SET reserved_room_id = :reserved_room_id,
                    full_name = :full_name
                WHERE companion_id = :companion_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reserved_room_id", $json['reserved_room_id']);
        $stmt->bindParam(":full_name", $json['full_name']);
        $stmt->bindParam(":companion_id", $json['companion_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteCompanion($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE ReservedRoomCompanion SET is_deleted = 1 WHERE companion_id = :companion_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":companion_id", $json['companion_id']);
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
        if (isset($_GET['companion_id'])) {
            $operation = 'getCompanion';
            $json = json_encode(['companion_id' => $_GET['companion_id']]);
        } else {
            $operation = 'getAllCompanions';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$companion = new ReservedRoomCompanion();
switch ($operation) {
    case "getAllCompanions":
        $companion->getAllCompanions();
        break;
    case "insertCompanion":
        $companion->insertCompanion($json);
        break;
    case "getCompanion":
        $companion->getCompanion($json);
        break;
    case "updateCompanion":
        $companion->updateCompanion($json);
        break;
    case "deleteCompanion":
        $companion->deleteCompanion($json);
        break;
}
