<?php
header('Content-Type: application/json');
require_once '../../config/database.php';
session_start();

class UserAPI
{
    private $db;
    public function __construct()
    {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    // Get all users (except current user if session)
    public function getAllUsers()
    {
        $currentUserId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
        if ($currentUserId) {
            $stmt = $this->db->prepare("SELECT u.*, ur.role_type FROM User u JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id WHERE u.user_id != :current_user_id ORDER BY u.created_at DESC");
            $stmt->bindParam(':current_user_id', $currentUserId);
        } else {
            $stmt = $this->db->prepare("SELECT u.*, ur.role_type FROM User u JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id ORDER BY u.created_at DESC");
        }
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['status' => 'success', 'users' => $users]);
    }

    // Get single user
    public function getUser($json)
    {
        $data = is_array($json) ? $json : json_decode($json, true);
        $id = isset($data['user_id']) ? $data['user_id'] : (isset($_GET['id']) ? $_GET['id'] : null);
        if (!$id) {
            echo json_encode(['status' => 'error', 'message' => 'User ID required']);
            return;
        }
        $stmt = $this->db->prepare("SELECT u.*, ur.role_type FROM User u JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id WHERE u.user_id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            echo json_encode(['status' => 'success', 'user' => $user]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
        }
    }

    // Update user (edit or status)
    public function updateUser($json)
    {
        $data = is_array($json) ? $json : json_decode($json, true);
        if (!isset($data['user_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'User ID required']);
            return;
        }
        // Status-only update (activate/deactivate)
        if (isset($data['update_type']) && $data['update_type'] === 'status_only' && isset($data['is_deleted'])) {
            $stmt = $this->db->prepare("UPDATE User SET is_deleted = :is_deleted WHERE user_id = :user_id");
            $stmt->bindParam(':is_deleted', $data['is_deleted']);
            $stmt->bindParam(':user_id', $data['user_id']);
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'User status updated']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update user status']);
            }
            return;
        }
        // Normal update (edit user)
        if (empty($data['username']) || empty($data['user_roles_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Required fields missing']);
            return;
        }
        $fields = "username = :username, email = :email, user_roles_id = :user_roles_id";
        if (!empty($data['password'])) {
            $fields .= ", password = :password, new_password = NULL"; // Clear new_password on password change
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        $sql = "UPDATE User SET $fields WHERE user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':username', $data['username']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':user_roles_id', $data['user_roles_id']);
        $stmt->bindParam(':user_id', $data['user_id']);
        if (!empty($data['password'])) {
            $stmt->bindParam(':password', $data['password']);
        }
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'User updated']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update user']);
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
        if (isset($_GET['id'])) {
            $operation = 'getUser';
            $json = json_encode(['user_id' => $_GET['id']]);
        } else {
            $operation = 'getAllUsers';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : file_get_contents('php://input');
    if (!$operation) {
        $operation = 'updateUser';
    }
}

$userAPI = new UserAPI();
switch ($operation) {
    case "getAllUsers":
        $userAPI->getAllUsers();
        break;
    case "getUser":
        $userAPI->getUser($json);
        break;
    case "updateUser":
        $userAPI->updateUser($json);
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid operation']);
        break;
}
