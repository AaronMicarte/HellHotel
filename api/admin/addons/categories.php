<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require_once '../../config/database.php';

class Category
{
    private $db;
    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getAllCategories()
    {
        $params = [];
        $query = "SELECT category_id, category_name FROM AddonCategory WHERE is_deleted = FALSE";
        // Accept search from GET or POST
        $search = '';
        if (!empty($_GET['search'])) {
            $search = $_GET['search'];
        } else if (!empty($_POST['search'])) {
            $search = $_POST['search'];
        }
        if ($search !== '') {
            $query .= " AND category_name LIKE :search";
            $params[':search'] = '%' . $search . '%';
        }
        $query .= " ORDER BY category_name";
        try {
            $stmt = $this->db->prepare($query);
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => 'success', 'data' => $results]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function getCategory($json)
    {
        $data = json_decode($json, true);
        $id = isset($data['category_id']) ? $data['category_id'] : null;
        if (!$id || !is_numeric($id) || $id <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid category ID']);
            return;
        }
        $query = "SELECT category_id, category_name FROM AddonCategory WHERE category_id = :id AND is_deleted = FALSE";
        try {
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                echo json_encode(['status' => 'success', 'data' => $result]);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Category not found']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function createCategory($json)
    {
        $data = json_decode($json, true);
        if (!$data || !isset($data['category_name']) || empty(trim($data['category_name']))) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Category name is required']);
            return;
        }
        $categoryName = trim($data['category_name']);
        // Check if category already exists
        $checkQuery = "SELECT category_id FROM AddonCategory WHERE category_name = :category_name AND is_deleted = FALSE";
        $checkStmt = $this->db->prepare($checkQuery);
        $checkStmt->bindParam(':category_name', $categoryName);
        $checkStmt->execute();
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['status' => 'error', 'message' => 'Category already exists']);
            return;
        }
        $query = "INSERT INTO AddonCategory (category_name) VALUES (:category_name)";
        try {
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':category_name', $categoryName);
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(['status' => 'success', 'message' => 'Category created successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Failed to create category']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function updateCategory($json)
    {
        $data = json_decode($json, true);
        if (!$data || !isset($data['category_id']) || !isset($data['category_name']) || empty(trim($data['category_name']))) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Category ID and name are required']);
            return;
        }
        $categoryId = $data['category_id'];
        $categoryName = trim($data['category_name']);
        if (!is_numeric($categoryId) || $categoryId <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid category ID']);
            return;
        }
        // Check if category exists
        $checkQuery = "SELECT category_id FROM AddonCategory WHERE category_id = :id AND is_deleted = FALSE";
        $checkStmt = $this->db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $categoryId, PDO::PARAM_INT);
        $checkStmt->execute();
        if (!$checkStmt->fetch()) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Category not found']);
            return;
        }
        // Check if new name already exists (excluding current category)
        $duplicateQuery = "SELECT category_id FROM AddonCategory WHERE category_name = :category_name AND category_id != :id AND is_deleted = FALSE";
        $duplicateStmt = $this->db->prepare($duplicateQuery);
        $duplicateStmt->bindParam(':category_name', $categoryName);
        $duplicateStmt->bindParam(':id', $categoryId, PDO::PARAM_INT);
        $duplicateStmt->execute();
        if ($duplicateStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['status' => 'error', 'message' => 'Category name already exists']);
            return;
        }
        $query = "UPDATE AddonCategory SET category_name = :category_name WHERE category_id = :id";
        try {
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':category_name', $categoryName);
            $stmt->bindParam(':id', $categoryId, PDO::PARAM_INT);
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Category updated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Failed to update category']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    public function deleteCategory($json)
    {
        $data = json_decode($json, true);
        $id = isset($data['category_id']) ? $data['category_id'] : null;
        if (!$id || !is_numeric($id) || $id <= 0) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Invalid category ID']);
            return;
        }
        // Check if category exists
        $checkQuery = "SELECT category_id FROM AddonCategory WHERE category_id = :id AND is_deleted = FALSE";
        $checkStmt = $this->db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $checkStmt->execute();
        if (!$checkStmt->fetch()) {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Category not found']);
            return;
        }
        // Check if category is being used by any addons
        $usageQuery = "SELECT COUNT(*) as count FROM Addon WHERE category_id = :id AND is_deleted = FALSE";
        $usageStmt = $this->db->prepare($usageQuery);
        $usageStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $usageStmt->execute();
        $usage = $usageStmt->fetch(PDO::FETCH_ASSOC);
        if ($usage['count'] > 0) {
            http_response_code(409);
            echo json_encode(['status' => 'error', 'message' => 'Cannot delete category. It is being used by ' . $usage['count'] . ' addon(s)']);
            return;
        }
        $query = "UPDATE AddonCategory SET is_deleted = TRUE WHERE category_id = :id";
        try {
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Category deleted successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => 'Failed to delete category']);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }
}

// Request handling
$operation = '';
$json = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : file_get_contents('php://input');
}

$category = new Category();
switch ($operation) {
    case 'getAllCategories':
        $category->getAllCategories();
        break;
    case 'getCategory':
        $category->getCategory($json);
        break;
    case 'createCategory':
        $category->createCategory($json);
        break;
    case 'updateCategory':
        $category->updateCategory($json);
        break;
    case 'deleteCategory':
        $category->deleteCategory($json);
        break;
    default:
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid operation']);
        break;
}
