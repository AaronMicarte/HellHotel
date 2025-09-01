<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

class AddUser
{
    private $db;
    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // GET: List all roles
    public function getAllRoles()
    {
        $stmt = $this->db->prepare("SELECT user_roles_id, role_type FROM UserRoles WHERE is_deleted = 0 ORDER BY role_type");
        $stmt->execute();
        $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!$roles || count($roles) === 0) {
            echo json_encode([
                'status' => 'error',
                'message' => 'No roles found. Please check your UserRoles table. Try running: INSERT INTO UserRoles (role_type) VALUES (\'admin\'), (\'front desk\');'
            ]);
        } else {
            echo json_encode(['status' => 'success', 'roles' => $roles]);
        }
    }

    // POST: Add new user
    public function createUser($json)
    {
        $data = json_decode($json, true);
        if (empty($data['username']) || empty($data['password']) || empty($data['user_roles_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
            return;
        }
        // Check if username already exists
        $checkStmt = $this->db->prepare("SELECT user_id FROM User WHERE username = :username AND is_deleted = 0");
        $checkStmt->bindParam(':username', $data['username']);
        $checkStmt->execute();
        $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            echo json_encode(['status' => 'error', 'message' => 'Username already exists']);
            return;
        }
        // Hash the password
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        // Prepare and execute the insert statement
        $stmt = $this->db->prepare("INSERT INTO User (username, password, email, user_roles_id, new_password) VALUES (:username, :password, :email, :user_roles_id, :new_password)");
        $stmt->bindParam(':username', $data['username']);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':user_roles_id', $data['user_roles_id']);
        $stmt->bindParam(':new_password', $hashedPassword); // Set new_password to the same hash
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'User added successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add user']);
        }
    }
}

// --- Unified request handling (like rooms.php) ---
$operation = '';
$json = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';
    if (!$operation) {
        $operation = 'getAllRoles';
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : file_get_contents('php://input');
    if (!$operation) {
        $operation = 'createUser';
    }
}

$addUser = new AddUser();
switch ($operation) {
    case "getAllRoles":
        $addUser->getAllRoles();
        break;
    case "createUser":
        $addUser->createUser($json);
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid operation']);
        break;
}
