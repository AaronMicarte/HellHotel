<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class FeatureAPI
{
    function getAllFeatures()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $query = "SELECT * FROM feature WHERE is_deleted = FALSE ORDER BY feature_id";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $features = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($features ?: []);
    }

    function getFeature($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $json = json_decode($json, true);
        $id = $json['feature_id'];

        $query = "SELECT * FROM feature WHERE feature_id = ? AND is_deleted = FALSE";
        $stmt = $db->prepare($query);
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result === false) {
            http_response_code(404);
            echo json_encode(['error' => 'Feature not found']);
            return;
        }

        echo json_encode($result);
    }

    function createFeature($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $feature_name = $_POST['feature_name'] ?? null;

        $query = "INSERT INTO feature (feature_name) VALUES (:feature_name)";
        $stmt = $db->prepare($query);

        try {
            $stmt->bindParam(':feature_name', $feature_name);
            $stmt->execute();
            $feature_id = $db->lastInsertId();
            echo json_encode(['message' => 'Feature created successfully', 'feature_id' => $feature_id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    function updateFeature($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $feature_id = $_POST['feature_id'] ?? null;
        $feature_name = $_POST['feature_name'] ?? null;

        $query = "UPDATE feature SET feature_name = :feature_name WHERE feature_id = :feature_id";
        $stmt = $db->prepare($query);

        try {
            $stmt->bindParam(':feature_id', $feature_id);
            $stmt->bindParam(':feature_name', $feature_name);
            $stmt->execute();
            echo json_encode(['message' => 'Feature updated successfully']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    function deleteFeature($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $json = json_decode($json, true);
        $id = $json['feature_id'];

        // Remove from all RoomTypeFeature associations
        $deleteAssoc = $db->prepare("DELETE FROM RoomTypeFeature WHERE feature_id = :id");
        $deleteAssoc->execute([':id' => $id]);

        $query = "UPDATE feature SET is_deleted = TRUE WHERE feature_id = :id";
        $stmt = $db->prepare($query);

        try {
            $stmt->execute([':id' => $id]);
            echo json_encode(['message' => 'Feature deleted successfully']);
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

    if (!$operation) {
        if (isset($_GET['id'])) {
            $operation = 'getFeature';
            $json = json_encode(['feature_id' => $_GET['id']]);
        } else {
            $operation = 'getAllFeatures';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$featureAPI = new FeatureAPI();
switch ($operation) {
    case "getAllFeatures":
        $featureAPI->getAllFeatures();
        break;
    case "getFeature":
        $featureAPI->getFeature($json);
        break;
    case "createFeature":
        $featureAPI->createFeature($json);
        break;
    case "updateFeature":
        $featureAPI->updateFeature($json);
        break;
    case "deleteFeature":
        $featureAPI->deleteFeature($json);
        break;
}
