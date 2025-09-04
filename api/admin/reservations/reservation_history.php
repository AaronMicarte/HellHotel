<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../middleware/auth.php';

header('Content-Type: application/json');

try {
    $database = new Database();
    $pdo = $database->getConnection();

    // Get the request method and data
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        // For logging room assignment actions
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON input']);
            exit;
        }

        $reservation_id = $input['reservation_id'] ?? null;
        $action = $input['action'] ?? 'room_assignment';
        $details = $input['details'] ?? null;
        $user_id = $_SESSION['user_id'] ?? null;

        if (!$reservation_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Reservation ID is required']);
            exit;
        }

        // Insert reservation history record
        $stmt = $pdo->prepare("
            INSERT INTO ReservationStatusHistory 
            (reservation_id, status_id, changed_by_user_id, changed_at) 
            VALUES (?, 
                    (SELECT reservation_status_id FROM Reservation WHERE reservation_id = ?), 
                    ?, 
                    NOW())
        ");

        $result = $stmt->execute([$reservation_id, $reservation_id, $user_id]);

        if ($result) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Room assignment logged successfully',
                'data' => [
                    'reservation_id' => $reservation_id,
                    'action' => $action,
                    'logged_at' => date('Y-m-d H:i:s')
                ]
            ]);
        } else {
            throw new Exception('Failed to log room assignment');
        }
    } else if ($method === 'GET') {
        // For retrieving reservation history
        $reservation_id = $_GET['reservation_id'] ?? null;

        if ($reservation_id) {
            // Get history for specific reservation
            $stmt = $pdo->prepare("
                SELECT 
                    rsh.history_id,
                    rsh.reservation_id,
                    rsh.changed_at,
                    rs.reservation_status,
                    u.username as changed_by_username,
                    ur.role_type as changed_by_role,
                    CONCAT(g.first_name, ' ', g.last_name) as guest_name
                FROM ReservationStatusHistory rsh
                LEFT JOIN ReservationStatus rs ON rsh.status_id = rs.reservation_status_id
                LEFT JOIN User u ON rsh.changed_by_user_id = u.user_id
                LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id
                LEFT JOIN Reservation r ON rsh.reservation_id = r.reservation_id
                LEFT JOIN Guest g ON r.guest_id = g.guest_id
                WHERE rsh.reservation_id = ?
                ORDER BY rsh.changed_at DESC
            ");

            $stmt->execute([$reservation_id]);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'status' => 'success',
                'data' => $history
            ]);
        } else {
            // Get all reservation history
            $stmt = $pdo->prepare("
                SELECT 
                    rsh.history_id,
                    rsh.reservation_id,
                    rsh.changed_at,
                    rs.reservation_status,
                    u.username as changed_by_username,
                    ur.role_type as changed_by_role,
                    CONCAT(g.first_name, ' ', g.last_name) as guest_name
                FROM ReservationStatusHistory rsh
                LEFT JOIN ReservationStatus rs ON rsh.status_id = rs.reservation_status_id
                LEFT JOIN User u ON rsh.changed_by_user_id = u.user_id
                LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id
                LEFT JOIN Reservation r ON rsh.reservation_id = r.reservation_id
                LEFT JOIN Guest g ON r.guest_id = g.guest_id
                ORDER BY rsh.changed_at DESC
                LIMIT 100
            ");

            $stmt->execute();
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'status' => 'success',
                'data' => $history
            ]);
        }
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log("Reservation History Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
