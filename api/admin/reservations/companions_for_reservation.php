<?php
// Get all companions (including main guest) for a reservation
header('Content-Type: application/json');
require_once '../../config/database.php';

$reservation_id = isset($_GET['reservation_id']) ? intval($_GET['reservation_id']) : 0;
if (!$reservation_id) {
    echo json_encode([]);
    exit;
}

try {
    $database = new Database();
    $pdo = $database->getConnection();
    // Get main guest
    $stmt = $pdo->prepare('SELECT g.guest_id, g.first_name, g.last_name, g.email FROM Reservation r JOIN Guest g ON r.guest_id = g.guest_id WHERE r.reservation_id = ? AND r.is_deleted = 0');
    $stmt->execute([$reservation_id]);
    $main_guest = $stmt->fetch(PDO::FETCH_ASSOC);
    // Get all reserved_room_ids for this reservation
    $stmt = $pdo->prepare('SELECT reserved_room_id FROM ReservedRoom WHERE reservation_id = ? AND is_deleted = 0');
    $stmt->execute([$reservation_id]);
    $reserved_room_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $companions = [];
    if ($reserved_room_ids) {
        $in = str_repeat('?,', count($reserved_room_ids) - 1) . '?';
        $stmt = $pdo->prepare("SELECT companion_id, full_name FROM ReservedRoomCompanion WHERE reserved_room_id IN ($in) AND is_deleted = 0");
        $stmt->execute($reserved_room_ids);
        $companions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    $result = [];
    if ($main_guest) {
        $result[] = [
            'type' => 'main_guest',
            'guest_id' => $main_guest['guest_id'],
            'full_name' => $main_guest['first_name'] . ' ' . $main_guest['last_name'],
            'email' => $main_guest['email']
        ];
    }
    foreach ($companions as $c) {
        $result[] = [
            'type' => 'companion',
            'companion_id' => $c['companion_id'],
            'full_name' => $c['full_name']
        ];
    }
    echo json_encode($result);
} catch (Exception $e) {
    echo json_encode([]);
}
