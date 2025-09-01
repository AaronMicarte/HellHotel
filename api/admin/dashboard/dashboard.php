<?php
header('Content-Type: application/json');
require_once '../../config/database.php';

// Check if request method is GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

try {
    $db = new Database();
    $conn = $db->getConnection();

    // ### ROOMS STATISTICS ###
    // Get total rooms count
    $roomsStmt = $conn->prepare("SELECT COUNT(*) as total FROM Room WHERE is_deleted = 0");
    $roomsStmt->execute();
    $totalRooms = $roomsStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // Get available rooms count - join with RoomStatus table
    $availableStmt = $conn->prepare("
        SELECT COUNT(*) as available 
        FROM Room r
        JOIN RoomStatus rs ON r.room_status_id = rs.room_status_id
        WHERE r.is_deleted = 0 AND rs.room_status = 'available'
    ");
    $availableStmt->execute();
    $availableRooms = $availableStmt->fetch(PDO::FETCH_ASSOC)['available'] ?? 0;

    // ### GUEST STATISTICS ###
    // Get total guests count
    $guestsStmt = $conn->prepare("SELECT COUNT(*) as total FROM Guest WHERE is_deleted = 0");
    $guestsStmt->execute();
    $totalGuests = $guestsStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // ### RESERVATION STATISTICS ###
    // Get active reservations count - join with ReservationStatus
    $reservationsStmt = $conn->prepare("
        SELECT COUNT(*) as total 
        FROM Reservation r
        JOIN ReservationStatus rs ON r.reservation_status_id = rs.reservation_status_id
        WHERE rs.reservation_status IN ('confirmed', 'checked-in') 
        AND r.is_deleted = 0
    ");
    $reservationsStmt->execute();
    $activeReservations = $reservationsStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // ### REVENUE STATISTICS ###
    // Get total revenue from completed payments
    $revenueStmt = $conn->prepare("SELECT COALESCE(SUM(amount_paid), 0) as total FROM Payment WHERE is_deleted = 0");
    $revenueStmt->execute();
    $totalRevenue = $revenueStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // ### ROOM STATUS DISTRIBUTION ###
    // Get room status distribution for chart
    $roomStatusStmt = $conn->prepare("
        SELECT rs.room_status as status, COUNT(*) as count 
        FROM Room r
        JOIN RoomStatus rs ON r.room_status_id = rs.room_status_id
        WHERE r.is_deleted = 0 
        GROUP BY rs.room_status
    ");
    $roomStatusStmt->execute();
    $roomStatus = $roomStatusStmt->fetchAll(PDO::FETCH_ASSOC);

    // ### RECENT RESERVATIONS ###
    // Get recent reservations
    $recentStmt = $conn->prepare("
        SELECT r.reservation_id, CONCAT(g.first_name, ' ', g.last_name) as guest_name, 
               r.check_in_date, r.check_out_date, rs.reservation_status as status
        FROM Reservation r
        JOIN Guest g ON r.guest_id = g.guest_id
        JOIN ReservationStatus rs ON r.reservation_status_id = rs.reservation_status_id
        WHERE r.is_deleted = 0
        ORDER BY r.created_at DESC
        LIMIT 5
    ");
    $recentStmt->execute();
    $recentReservations = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

    // Format complete response
    $response = [
        'status' => 'success',
        'stats' => [
            'totalRooms' => (int)$totalRooms,
            'availableRooms' => (int)$availableRooms,
            'totalGuests' => (int)$totalGuests,
            'activeReservations' => (int)$activeReservations,
            'totalRevenue' => (float)$totalRevenue,
            'roomStatus' => $roomStatus
        ],
        'reservations' => $recentReservations
    ];

    // --- Revenue per day (last 14 days) ---
    $stmt = $conn->prepare("
        SELECT DATE(payment_date) as day, SUM(amount_paid) as revenue
        FROM Payment
        WHERE is_deleted = 0
        GROUP BY day
        ORDER BY day DESC
        LIMIT 14
    ");
    $stmt->execute();
    $revenuePerDay = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC)); // oldest first

    // --- Revenue per month (last 12 months) ---
    $stmt = $conn->prepare("
        SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount_paid) as revenue
        FROM Payment
        WHERE is_deleted = 0
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
    ");
    $stmt->execute();
    $revenuePerMonth = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC)); // oldest first

    // Add to response
    $response['stats']['revenuePerDay'] = $revenuePerDay;
    $response['stats']['revenuePerMonth'] = $revenuePerMonth;

    echo json_encode($response);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
