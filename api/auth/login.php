<?php
// Include required files
require_once '../config/cors.php';
require_once '../config/database.php';

// Set content type to JSON
header("Content-Type: application/json");

// Only accept POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

// Get request body
$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (!isset($data['username']) || !isset($data['password'])) {
    echo json_encode(["success" => false, "message" => "Username and password are required"]);
    exit;
}

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();

    // FIX: Corrected JOIN condition - Join on user_roles_id (which exists in both tables)
    // instead of trying to join on ur.user_id which doesn't match the schema
    $query = "SELECT u.user_id, u.username, u.password, u.user_roles_id, u.new_password, u.is_deleted, ur.role_type 
              FROM User u 
              JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id 
              WHERE u.username = :username";

    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $data['username']);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if user is inactive/deleted (treat 1, "1", true, "true" as inactive)
        if (
            isset($user['is_deleted']) &&
            ($user['is_deleted'] === 1 || $user['is_deleted'] === "1" || $user['is_deleted'] === true || $user['is_deleted'] === "true")
        ) {
            echo json_encode([
                "success" => false,
                "message" => "Your account is deactivated. Please contact the administrator."
            ]);
            exit;
        }

        // Verify password
        if (password_verify($data['password'], $user['password'])) {
            // Password verified successfully
        } else if ($data['password'] === $user['password']) {
            // Plain text password match (development only)
        } else {
            echo json_encode(["success" => false, "message" => "Invalid credentials"]);
            exit;
        }

        // Start session with enhanced security
        session_start();
        session_regenerate_id(true); // Regenerate session ID for security

        // Generate a secure token
        $token = bin2hex(random_bytes(32));

        // Store session data
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role_type'] = $user['role_type'];
        $_SESSION['admin_token'] = $token;
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();
        $_SESSION['admin_user'] = [
            "user_id" => $user['user_id'],
            "username" => $user['username'],
            "role_type" => $user['role_type']
        ];

        // Log user id to PHP error log
        error_log("Login: User ID {$user['user_id']} ({$user['username']}) at " . date('Y-m-d H:i:s'));

        // Return user info (excluding password)
        unset($user['password']);

        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "token" => $token,
            "user" => [
                "user_id" => $user['user_id'],
                "username" => $user['username'],
                "role_type" => $user['role_type'],
                "user_roles_id" => $user['user_roles_id'],
                "new_password" => $user['new_password'] // For force password change logic
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
