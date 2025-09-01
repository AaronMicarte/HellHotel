<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class ReservationCalendarAPI
{
    function getCalendarEvents()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        // Fetch reservations with guest, room, status, dates, times, and room type
        $query = "
            SELECT 
                r.reservation_id,
                r.guest_id, -- add this line
                CONCAT(g.first_name, ' ', g.last_name) AS guest,
                rr.room_id,
                rm.room_number,
                rt.type_name,
                rs.reservation_status,
                r.check_in_date,
                r.check_in_time,
                r.check_out_date,
                r.check_out_time
            FROM Reservation r
            LEFT JOIN Guest g ON r.guest_id = g.guest_id
            LEFT JOIN ReservedRoom rr ON r.reservation_id = rr.reservation_id
            LEFT JOIN Room rm ON rr.room_id = rm.room_id
            LEFT JOIN RoomType rt ON rm.room_type_id = rt.room_type_id
            LEFT JOIN ReservationStatus rs ON r.reservation_status_id = rs.reservation_status_id
            WHERE r.is_deleted = 0 AND (rr.is_deleted = 0 OR rr.is_deleted IS NULL)
            ORDER BY r.check_in_date
        ";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $events = [];
        foreach ($reservations as $row) {
            // Skip if no room assigned
            if (!$row['room_number']) continue;
            // Validate check-in and check-out dates
            if (empty($row['check_in_date']) || empty($row['check_out_date'])) continue;
            // Validate date format (YYYY-MM-DD)
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $row['check_in_date']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $row['check_out_date'])) continue;
            // Optionally validate time format (HH:MM:SS or HH:MM)
            $check_in_time = $row['check_in_time'];
            $check_out_time = $row['check_out_time'];
            if ($check_in_time && !preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $check_in_time)) $check_in_time = null;
            if ($check_out_time && !preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $check_out_time)) $check_out_time = null;

            $events[] = [
                'id' => $row['reservation_id'],
                'title' => ($row['type_name'] ? "{$row['type_name']} - " : "") . "Room {$row['room_number']} - {$row['guest']}",
                'start' => $row['check_in_date'],
                // FullCalendar expects exclusive end date, so add +1 day
                'end' => date('Y-m-d', strtotime($row['check_out_date'] . ' +1 day')),
                'guest' => $row['guest'],
                'guest_id' => $row['guest_id'], // <-- fix: output real guest_id
                'room' => $row['room_number'],
                'room_number' => $row['room_number'],
                'type_name' => $row['type_name'],
                'status' => $row['reservation_status'],
                'check_in_time' => $check_in_time,
                'check_out_time' => $check_out_time,
                'allDay' => true
            ];
        }
        echo json_encode($events);
    }
}

// Routing
$api = new ReservationCalendarAPI();
$api->getCalendarEvents();
