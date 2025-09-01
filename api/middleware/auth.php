<?php
function checkAdminAuth()
{
    // Enhanced security headers
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Content-Type: application/json');

    // Start session if not already started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Check for Authorization header
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
        // Log unauthorized access attempt
        logSecurityEvent('UNAUTHORIZED_ACCESS_NO_TOKEN', 'No token provided');

        http_response_code(401);
        echo json_encode([
            "success" => false,
            "error" => "Unauthorized - No valid token provided",
            "code" => "NO_TOKEN",
            "redirect" => "/Hotel-Reservation-Billing-System/admin/admin-login.html"
        ]);
        exit;
    }

    $token = substr($authHeader, 7); // Remove "Bearer " prefix

    // Validate token against session
    if (!isset($_SESSION['admin_token']) || $_SESSION['admin_token'] !== $token) {
        // Log invalid token attempt
        logSecurityEvent('UNAUTHORIZED_ACCESS_INVALID_TOKEN', 'Invalid token: ' . substr($token, 0, 10) . '...');

        // Clear invalid session
        session_unset();
        session_destroy();
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "error" => "Unauthorized - Invalid or expired token",
            "code" => "INVALID_TOKEN",
            "redirect" => "/Hotel-Reservation-Billing-System/admin/admin-login.html"
        ]);
        exit;
    }

    // Enhanced session timeout check (8 hours)
    $sessionTimeout = 8 * 60 * 60; // 8 hours
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > $sessionTimeout) {
        // Log session timeout
        logSecurityEvent('SESSION_TIMEOUT', 'User ID: ' . ($_SESSION['user_id'] ?? 'unknown'));

        session_unset();
        session_destroy();
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "error" => "Session expired - Please login again",
            "code" => "SESSION_EXPIRED",
            "redirect" => "/Hotel-Reservation-Billing-System/admin/admin-login.html"
        ]);
        exit;
    }

    // Validate user session data
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
        // Log invalid session data
        logSecurityEvent('INVALID_SESSION_DATA', 'Missing user data in session');

        session_unset();
        session_destroy();
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "error" => "Invalid session data",
            "code" => "INVALID_SESSION",
            "redirect" => "/Hotel-Reservation-Billing-System/admin/admin-login.html"
        ]);
        exit;
    }

    // Update last activity
    $_SESSION['last_activity'] = time();

    // Log successful access
    error_log("Admin access: User ID {$_SESSION['user_id']} ({$_SESSION['username']}) at " . date('Y-m-d H:i:s'));

    return true;
}

function requireAdminAuth()
{
    return checkAdminAuth();
}

// Add helper function for API endpoints
function validateAdminToken()
{
    return checkAdminAuth();
}

function logSecurityEvent($event, $details = '')
{
    $logEntry = date('Y-m-d H:i:s') . " - SECURITY: {$event}";
    if ($details) {
        $logEntry .= " - Details: {$details}";
    }
    $logEntry .= " - IP: " . ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR']);
    error_log($logEntry);
}
