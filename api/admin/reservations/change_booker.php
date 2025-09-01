<?php
// File: change_booker.php
// Endpoint to change the main booker (payer) for a reservation
header('Content-Type: application/json');

require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$reservation_id = isset($data['reservation_id']) ? intval($data['reservation_id']) : 0;
$new_guest_id = isset($data['new_guest_id']) ? intval($data['new_guest_id']) : 0;

if (!$reservation_id || !$new_guest_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing reservation_id or new_guest_id']);
    exit;
}

try {
    $database = new Database();
    $pdo = $database->getConnection();
    // Check if reservation exists
    $stmt = $pdo->prepare('SELECT * FROM Reservation WHERE reservation_id = ? AND is_deleted = 0');
    $stmt->execute([$reservation_id]);
    $reservation = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$reservation) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Reservation not found']);
        exit;
    }
    // Check if guest exists
    $stmt = $pdo->prepare('SELECT * FROM Guest WHERE guest_id = ? AND is_deleted = 0');
    $stmt->execute([$new_guest_id]);
    $guest = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$guest) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Guest not found']);
        exit;
    }

    // Get previous main guest info before changing
    $prev_guest_id = $reservation['guest_id'];
    $prev_guest_name = '';
    $stmt = $pdo->prepare('SELECT first_name, last_name FROM Guest WHERE guest_id = ?');
    $stmt->execute([$prev_guest_id]);
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $prev_guest_name = trim($row['first_name'] . ' ' . $row['last_name']);
    }

    // Update Reservation.guest_id
    $stmt = $pdo->prepare('UPDATE Reservation SET guest_id = ?, updated_at = NOW() WHERE reservation_id = ?');
    $stmt->execute([$new_guest_id, $reservation_id]);

    // Demote previous main guest to companion (if not already a companion)
    if ($prev_guest_id && $prev_guest_id != $new_guest_id && $prev_guest_name) {
        // Get all reserved_room_ids for this reservation
        $stmt = $pdo->prepare('SELECT reserved_room_id FROM ReservedRoom WHERE reservation_id = ? AND is_deleted = 0');
        $stmt->execute([$reservation_id]);
        $reserved_room_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if ($reserved_room_ids) {
            // Check if already a companion
            $in = str_repeat('?,', count($reserved_room_ids) - 1) . '?';
            $params = $reserved_room_ids;
            $params[] = $prev_guest_name;
            $sql = "SELECT companion_id FROM ReservedRoomCompanion WHERE reserved_room_id IN ($in) AND full_name = ? AND is_deleted = 0";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $already = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$already) {
                // Add as companion to the first reserved_room_id
                $stmt = $pdo->prepare('INSERT INTO ReservedRoomCompanion (reserved_room_id, full_name) VALUES (?, ?)');
                $stmt->execute([$reserved_room_ids[0], $prev_guest_name]);
            }
        }
    }

    // Remove (mark as deleted) any companion entry with the same name as the new guest (now main guest)
    // This prevents duplicate display as both guest and companion
    $stmt = $pdo->prepare('SELECT first_name, last_name FROM Guest WHERE guest_id = ?');
    $stmt->execute([$new_guest_id]);
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $new_guest_name = trim($row['first_name'] . ' ' . $row['last_name']);
        if (!empty($new_guest_name) && !empty($reserved_room_ids)) {
            $in = str_repeat('?,', count($reserved_room_ids) - 1) . '?';
            $params = $reserved_room_ids;
            $params[] = $new_guest_name;
            $sql = "UPDATE ReservedRoomCompanion SET is_deleted = 1 WHERE reserved_room_id IN ($in) AND full_name = ? AND is_deleted = 0";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }
    }

    // Optionally: log the change (audit)
    // ...
    echo json_encode(['success' => true, 'message' => 'Booker updated successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error', 'error' => $e->getMessage()]);
}
