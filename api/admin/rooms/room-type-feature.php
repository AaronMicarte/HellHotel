<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class RoomTypeFeatureAPI
{
    // Get all features for a given room_type_id
    function getFeaturesForRoomType($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        // Accept both GET and POST for $json
        if (!$json && isset($_POST['room_type_id'])) {
            $json = json_encode(['room_type_id' => $_POST['room_type_id']]);
        }
        if (!$json && isset($_GET['room_type_id'])) {
            $json = json_encode(['room_type_id' => $_GET['room_type_id']]);
        }
        $json = json_decode($json, true);
        $room_type_id = $json['room_type_id'];

        $query = "SELECT f.feature_id, f.feature_name
                  FROM RoomTypeFeature rtf
                  JOIN Feature f ON rtf.feature_id = f.feature_id
                  WHERE rtf.room_type_id = ? AND f.is_deleted = FALSE";
        $stmt = $db->prepare($query);
        $stmt->execute([$room_type_id]);
        $features = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($features ?: []);
    }

    // Add a feature to a room type
    function addFeatureToRoomType($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $room_type_id = $_POST['room_type_id'] ?? null;
        $feature_id = $_POST['feature_id'] ?? null;

        $query = "INSERT IGNORE INTO RoomTypeFeature (room_type_id, feature_id) VALUES (:room_type_id, :feature_id)";
        $stmt = $db->prepare($query);

        try {
            $stmt->bindParam(':room_type_id', $room_type_id);
            $stmt->bindParam(':feature_id', $feature_id);
            $stmt->execute();
            // Return updated features for this room type
            $fstmt = $db->prepare("SELECT f.feature_id, f.feature_name FROM RoomTypeFeature rtf JOIN Feature f ON rtf.feature_id = f.feature_id WHERE rtf.room_type_id = ?");
            $fstmt->execute([$room_type_id]);
            $features = $fstmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['message' => 'Feature added to room type', 'features' => $features]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // Remove a feature from a room type
    function removeFeatureFromRoomType($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $json = json_decode($json, true);
        $room_type_id = $json['room_type_id'];
        $feature_id = $json['feature_id'];

        $query = "DELETE FROM RoomTypeFeature WHERE room_type_id = :room_type_id AND feature_id = :feature_id";
        $stmt = $db->prepare($query);

        try {
            $stmt->bindParam(':room_type_id', $room_type_id);
            $stmt->bindParam(':feature_id', $feature_id);
            $stmt->execute();
            echo json_encode(['message' => 'Feature removed from room type']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}

// Request handling
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';

    if (!$operation && isset($_GET['room_type_id'])) {
        $operation = 'getFeaturesForRoomType';
        $json = json_encode(['room_type_id' => $_GET['room_type_id']]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$api = new RoomTypeFeatureAPI();
switch ($operation) {
    case "getFeaturesForRoomType":
        $api->getFeaturesForRoomType($json);
        break;
    case "addFeatureToRoomType":
        $api->addFeatureToRoomType($json);
        break;
    case "removeFeatureFromRoomType":
        $api->removeFeatureFromRoomType($json);
        break;
}
