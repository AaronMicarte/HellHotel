<?php
header("Content-Type: application/json");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

// Enhanced security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

session_start();

// Check for Authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
    session_unset();
    session_destroy();
    echo json_encode([
        "success" => false,
        "message" => "No valid authorization header provided",
        "code" => "NO_AUTH_HEADER"
    ]);
    exit;
}

$token = substr($authHeader, 7); // Remove "Bearer " prefix

// Validate token and session
if (!isset($_SESSION['admin_token']) || $_SESSION['admin_token'] !== $token) {
    session_unset();
    session_destroy();
    echo json_encode([
        "success" => false,
        "message" => "Invalid or expired token",
        "code" => "INVALID_TOKEN"
    ]);
    exit;
}

// Enhanced session timeout check (8 hours)
$sessionTimeout = 8 * 60 * 60; // 8 hours in seconds

if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > $sessionTimeout) {
    session_unset();
    session_destroy();
    echo json_encode([
        "success" => false,
        "message" => "Session expired due to inactivity",
        "code" => "SESSION_TIMEOUT"
    ]);
    exit;
}

// Validate required session data
if (!isset($_SESSION['user_id']) || !isset($_SESSION['username']) || !isset($_SESSION['admin_user'])) {
    session_unset();
    session_destroy();
    echo json_encode([
        "success" => false,
        "message" => "Incomplete session data",
        "code" => "INCOMPLETE_SESSION"
    ]);
    exit;
}

// Update last activity time
$_SESSION['last_activity'] = time();

// Calculate session info
$loginTime = $_SESSION['login_time'] ?? time();
$sessionAge = time() - $loginTime;
$timeRemaining = $sessionTimeout - $sessionAge;

// Ensure user object has all needed fields
$user = $_SESSION['admin_user'];
if (!isset($user['user_id']) && isset($_SESSION['user_id'])) $user['user_id'] = $_SESSION['user_id'];
if (!isset($user['role_type']) && isset($_SESSION['role_type'])) $user['role_type'] = $_SESSION['role_type'];
if (!isset($user['user_roles_id']) && isset($_SESSION['user_roles_id'])) $user['user_roles_id'] = $_SESSION['user_roles_id'];
if (!isset($user['new_password']) && isset($_SESSION['new_password'])) $user['new_password'] = $_SESSION['new_password'];

// Log user id to PHP error log
if (isset($user['user_id'])) {
    error_log("Session check: User ID {$user['user_id']} at " . date('Y-m-d H:i:s'));
}

echo json_encode([
    "success" => true,
    "message" => "Session valid",
    "user" => $user,
    "session_info" => [
        "time_remaining" => $timeRemaining,
        "last_activity" => $_SESSION['last_activity']
    ]
]);
