<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class ReservationHistory
{
    // PAGINATED getAllHistory implementation
    function getAllHistory()
    {
        include_once '../../config/database.php';
        require_once '../../middleware/auth.php';
        $database = new Database();
        $db = $database->getConnection();
        $user_id = $_SESSION['user_id'] ?? null;
        $role_type = $_SESSION['role_type'] ?? null;

        // Pagination params
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
        $offset = ($page - 1) * $limit;

        // Count total
        $countSql = "SELECT COUNT(*) FROM ReservationStatusHistory rsh 
            LEFT JOIN User u ON rsh.changed_by_user_id = u.user_id 
            LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id ";
        if ($role_type === 'front desk') {
            $countSql .= " WHERE ur.role_type = 'front desk'";
        }
        $countStmt = $db->prepare($countSql);
        $countStmt->execute();
        $total = $countStmt->fetchColumn();

        // Main query
        if ($role_type === 'front desk') {
            $sql = "SELECT rsh.history_id, rsh.reservation_id, rsh.changed_at, rs.reservation_status, 
            u.username as changed_by_username, ur.role_type as changed_by_role, 
            CONCAT(g.first_name, ' ', g.last_name) as guest_name 
            FROM ReservationStatusHistory rsh 
            LEFT JOIN ReservationStatus rs ON rsh.status_id = rs.reservation_status_id 
            LEFT JOIN User u ON rsh.changed_by_user_id = u.user_id 
            LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id 
            LEFT JOIN Reservation r ON rsh.reservation_id = r.reservation_id 
            LEFT JOIN Guest g ON r.guest_id = g.guest_id 
            WHERE ur.role_type = 'front desk' 
            ORDER BY rsh.changed_at DESC 
            LIMIT :limit OFFSET :offset";
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        } else {
            $sql = "SELECT rsh.history_id, rsh.reservation_id, rsh.changed_at, rs.reservation_status, 
                    u.username as changed_by_username, ur.role_type as changed_by_role, 
                    CONCAT(g.first_name, ' ', g.last_name) as guest_name 
                    FROM ReservationStatusHistory rsh 
                    LEFT JOIN ReservationStatus rs ON rsh.status_id = rs.reservation_status_id 
                    LEFT JOIN User u ON rsh.changed_by_user_id = u.user_id 
                    LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id 
                    LEFT JOIN Reservation r ON rsh.reservation_id = r.reservation_id 
                    LEFT JOIN Guest g ON r.guest_id = g.guest_id 
                    ORDER BY rsh.changed_at DESC 
                    LIMIT :limit OFFSET :offset";
            $stmt = $db->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // If changed_by_username or changed_by_role is null, set to 'Guest'
        foreach ($rs as &$row) {
            if (is_null($row['changed_by_username'])) {
                $row['changed_by_username'] = 'Guest';
            }
            if (is_null($row['changed_by_role'])) {
                $row['changed_by_role'] = 'Guest';
            }
        }
        unset($row);
        echo json_encode([
            'data' => $rs,
            'total' => intval($total),
            'page' => $page,
            'limit' => $limit,
            'debug' => [
                'session_user_id' => $user_id,
                'session_role_type' => $role_type
            ]
        ]);
    }

    function getHistoryByReservation($json)
    {
        include_once '../../config/database.php';
        require_once '../../middleware/auth.php';
        $database = new Database();
        $db = $database->getConnection();
        $user_id = $_SESSION['user_id'] ?? null;
        $role_type = $_SESSION['role_type'] ?? null;
        $json = json_decode($json, true);

        if ($role_type === 'front desk') {
            $sql = "SELECT rsh.history_id, rsh.reservation_id, rsh.changed_at, rs.reservation_status, 
            u.username as changed_by_username, ur.role_type as changed_by_role, 
            CONCAT(g.first_name, ' ', g.last_name) as guest_name 
            FROM ReservationStatusHistory rsh 
            LEFT JOIN ReservationStatus rs ON rsh.status_id = rs.reservation_status_id 
            LEFT JOIN User u ON rsh.changed_by_user_id = u.user_id 
            LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id 
            LEFT JOIN Reservation r ON rsh.reservation_id = r.reservation_id 
            LEFT JOIN Guest g ON r.guest_id = g.guest_id 
            WHERE rsh.reservation_id = :reservation_id 
            AND ur.role_type = 'front desk' 
            ORDER BY rsh.changed_at DESC";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(":reservation_id", $json['reservation_id']);
        } else {
            $sql = "SELECT rsh.history_id, rsh.reservation_id, rsh.changed_at, rs.reservation_status, 
                    u.username as changed_by_username, ur.role_type as changed_by_role, 
                    CONCAT(g.first_name, ' ', g.last_name) as guest_name 
                    FROM ReservationStatusHistory rsh 
                    LEFT JOIN ReservationStatus rs ON rsh.status_id = rs.reservation_status_id 
                    LEFT JOIN User u ON rsh.changed_by_user_id = u.user_id 
                    LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id 
                    LEFT JOIN Reservation r ON rsh.reservation_id = r.reservation_id 
                    LEFT JOIN Guest g ON r.guest_id = g.guest_id 
                    WHERE rsh.reservation_id = :reservation_id 
                    ORDER BY rsh.changed_at DESC";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(":reservation_id", $json['reservation_id']);
        }

        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // If changed_by_username or changed_by_role is null, set to 'Guest'
        foreach ($rs as &$row) {
            if (is_null($row['changed_by_username'])) {
                $row['changed_by_username'] = 'Guest';
            }
            if (is_null($row['changed_by_role'])) {
                $row['changed_by_role'] = 'Guest';
            }
        }
        unset($row);
        echo json_encode([
            'data' => $rs,
            'debug' => [
                'session_user_id' => $user_id,
                'session_role_type' => $role_type
            ]
        ]);
    }
    function insertHistory($json)
    {
        include_once '../../config/database.php';
        require_once '../../middleware/auth.php';
        $database = new Database();
        $db = $database->getConnection();
        $user_id = $_SESSION['user_id'] ?? null;
        $json = json_decode($json, true);

        $sql = "INSERT INTO ReservationStatusHistory (reservation_id, status_id, changed_by_user_id, changed_at) 
                VALUES (:reservation_id, (SELECT reservation_status_id FROM Reservation WHERE reservation_id = :reservation_id), :user_id, NOW())";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }
}

// Request handling
$operation = '';
$json = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';
    if (!$operation) {
        if (isset($_GET['reservation_id'])) {
            $operation = 'getHistoryByReservation';
            $json = json_encode(['reservation_id' => $_GET['reservation_id']]);
        } else {
            $operation = 'getAllHistory';
        }
    } else if ($operation === 'getHistoryByReservation' && isset($_GET['reservation_id'])) {
        $json = json_encode(['reservation_id' => $_GET['reservation_id']]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
    if (!$operation) {
        $operation = 'insertHistory';
        $json = file_get_contents('php://input');
    }
}

$history = new ReservationHistory();
switch ($operation) {
    case "getAllHistory":
        $history->getAllHistory();
        break;
    case "insertHistory":
        $history->insertHistory($json);
        break;
    case "getHistoryByReservation":
        $history->getHistoryByReservation($json);
        break;
}
