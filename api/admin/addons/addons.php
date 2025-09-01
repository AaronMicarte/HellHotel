<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class AddonAPI
{
    private function getDb()
    {
        include_once '../../config/database.php';
        $database = new Database();
        return $database->getConnection();
    }

    function getAllAddons()
    {
        $db = $this->getDb();
        $where = "a.is_deleted = FALSE";
        $params = [];
        // Add category filter if provided
        if (isset($_GET['category']) && $_GET['category'] !== '') {
            $where .= " AND a.category_id = :category_id";
            $params[':category_id'] = $_GET['category'];
        }
        // Add search filter if provided
        if (isset($_GET['search']) && trim($_GET['search']) !== '') {
            $where .= " AND (a.name LIKE :search OR c.category_name LIKE :search)";
            $params[':search'] = '%' . $_GET['search'] . '%';
        }
        $query = "SELECT a.*, c.category_name FROM Addon a LEFT JOIN AddonCategory c ON a.category_id = c.category_id WHERE $where ORDER BY a.addon_id";
        $stmt = $db->prepare($query);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $addons = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($addons ?: []);
    }

    function getAddon($json)
    {
        $db = $this->getDb();
        $json = json_decode($json, true);
        $id = $json['addon_id'];
        $query = "SELECT a.*, c.category_name FROM Addon a LEFT JOIN AddonCategory c ON a.category_id = c.category_id WHERE a.addon_id = ? AND a.is_deleted = FALSE";
        $stmt = $db->prepare($query);
        $stmt->execute([$id]);
        $addon = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($addon ?: []);
    }

    function createAddon($json)
    {
        $db = $this->getDb();
        // Accept JSON or POST
        $data = is_array($json) ? $json : json_decode($json, true);
        $name = $data['name'] ?? $_POST['name'] ?? null;
        $category_id = $data['category_id'] ?? $_POST['category_id'] ?? null;
        $price = $data['price'] ?? $_POST['price'] ?? null;
        $is_available = $data['is_available'] ?? $_POST['is_available'] ?? 1;
        $imageUrl = null;

        // Handle file upload if present
        if (isset($_FILES['addon_image']) && $_FILES['addon_image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../../../assets/images/uploads/addon-images/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $fileTmp = $_FILES['addon_image']['tmp_name'];
            $fileName = basename($_FILES['addon_image']['name']);
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array($fileExt, $allowed)) {
                $newFileName = uniqid('addon_', true) . '.' . $fileExt;
                $destPath = $uploadDir . $newFileName;
                if (move_uploaded_file($fileTmp, $destPath)) {
                    $imageUrl = $newFileName;
                }
            }
        }

        $query = "INSERT INTO Addon (name, category_id, price, is_available, image_url) VALUES (:name, :category_id, :price, :is_available, :image_url)";
        $stmt = $db->prepare($query);
        try {
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':category_id', $category_id);
            $stmt->bindParam(':price', $price);
            $stmt->bindParam(':is_available', $is_available);
            // Always bind image_url, even if null
            $stmt->bindParam(':image_url', $imageUrl);
            $stmt->execute();
            echo json_encode(1);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    function updateAddon($json)
    {
        $db = $this->getDb();
        // Accept JSON or POST
        $data = is_array($json) ? $json : json_decode($json, true);
        $addon_id = $data['addon_id'] ?? $_POST['addon_id'] ?? null;
        $name = $data['name'] ?? $_POST['name'] ?? null;
        $category_id = $data['category_id'] ?? $_POST['category_id'] ?? null;
        $price = $data['price'] ?? $_POST['price'] ?? null;
        $is_available = $data['is_available'] ?? $_POST['is_available'] ?? 1;
        $imageUrl = null;

        // Handle file upload if present
        if (isset($_FILES['addon_image']) && $_FILES['addon_image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../../../assets/images/uploads/addon-images/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $fileTmp = $_FILES['addon_image']['tmp_name'];
            $fileName = basename($_FILES['addon_image']['name']);
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array($fileExt, $allowed)) {
                $newFileName = uniqid('addon_', true) . '.' . $fileExt;
                $destPath = $uploadDir . $newFileName;
                if (move_uploaded_file($fileTmp, $destPath)) {
                    $imageUrl = $newFileName;
                }
            }
        }

        $query = "UPDATE Addon SET name = :name, category_id = :category_id, price = :price, is_available = :is_available";
        if ($imageUrl) {
            $query .= ", image_url = :image_url";
        }
        $query .= " WHERE addon_id = :addon_id";
        $stmt = $db->prepare($query);
        try {
            $stmt->bindParam(':addon_id', $addon_id);
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':category_id', $category_id);
            $stmt->bindParam(':price', $price);
            $stmt->bindParam(':is_available', $is_available);
            if ($imageUrl) {
                $stmt->bindParam(':image_url', $imageUrl);
            }
            $stmt->execute();
            echo json_encode(1);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    function deleteAddon($json)
    {
        $db = $this->getDb();
        $json = json_decode($json, true);
        $id = $json['addon_id'];
        $query = "UPDATE Addon SET is_deleted = TRUE WHERE addon_id = :id";
        $stmt = $db->prepare($query);
        try {
            $stmt->execute([':id' => $id]);
            echo json_encode(1);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}

// Request handling
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = $_GET['operation'] ?? '';
    $json = $_GET['json'] ?? '';
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = $_POST['operation'] ?? '';
    $json = $_POST['json'] ?? '';
}

$addonAPI = new AddonAPI();
switch ($operation) {
    case "getAllAddons":
        $addonAPI->getAllAddons();
        break;
    case "getAddon":
        $addonAPI->getAddon($json);
        break;
    case "createAddon":
        $addonAPI->createAddon($json);
        break;
    case "updateAddon":
        $addonAPI->updateAddon($json);
        break;
    case "deleteAddon":
        $addonAPI->deleteAddon($json);
        break;
}
