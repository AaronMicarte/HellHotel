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

// Log logout attempt
if (isset($_SESSION['user_id'])) {
    error_log("Logout: User ID {$_SESSION['user_id']} ({$_SESSION['username']}) at " . date('Y-m-d H:i:s'));
}

// Clear all session data
session_unset();
session_destroy();

// Clear the session cookie securely
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Regenerate session ID for security
session_regenerate_id(true);

echo json_encode([
    "success" => true,
    "message" => "Logged out successfully"
]);
