<?php
// archived_bookings.php
// API endpoint for archived bookings (checked-out or cancelled) using class and switch-case

require_once '../../config/database.php';
require_once '../../config/cors.php';
header('Content-Type: application/json');

class ArchivedBookingsAPI
{
    private $conn;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function getArchivedStatusIds()
    {
        $sql = "SELECT reservation_status_id FROM ReservationStatus WHERE reservation_status IN ('checked-out', 'cancelled') AND is_deleted = 0";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $status_ids = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $status_ids[] = $row['reservation_status_id'];
        }
        return $status_ids;
    }

    public function fetchArchivedBookings($search = '')
    {
        $status_ids = $this->getArchivedStatusIds();
        if (empty($status_ids)) {
            return ['success' => false, 'message' => 'No archived statuses found.'];
        }
        $status_ids_str = implode(',', array_map('intval', $status_ids));

        $sql = "SELECT 
                    r.*,
                    g.first_name,
                    g.last_name,
                    g.email,
                    rs.reservation_status,
                    GROUP_CONCAT(
                        DISTINCT CONCAT(rm.room_number, ' (', rt.type_name, ')') 
                        ORDER BY rm.room_number SEPARATOR ', '
                    ) as rooms_summary,
                    CONCAT(g.first_name, ' ', g.last_name) as guest_name,
                    u.username AS archived_by_username,
                    ur.role_type AS archived_by_role
                FROM Reservation r
                LEFT JOIN Guest g ON r.guest_id = g.guest_id
                LEFT JOIN ReservationStatus rs ON r.reservation_status_id = rs.reservation_status_id
                LEFT JOIN ReservedRoom rr ON r.reservation_id = rr.reservation_id AND rr.is_deleted = 0
                LEFT JOIN Room rm ON rr.room_id = rm.room_id
                LEFT JOIN RoomType rt ON rm.room_type_id = rt.room_type_id
                LEFT JOIN User u ON r.user_id = u.user_id
                LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id
                WHERE r.reservation_status_id IN ($status_ids_str) AND r.is_deleted = 0";

        if ($search !== '') {
            $sql .= " AND (g.first_name LIKE :search OR g.last_name LIKE :search OR r.reservation_id LIKE :search OR g.email LIKE :search)";
        }

        $sql .= " GROUP BY r.reservation_id ORDER BY r.updated_at DESC, r.created_at DESC";

        $stmt = $this->conn->prepare($sql);
        if ($search !== '') {
            $searchParam = "%$search%";
            $stmt->bindParam(':search', $searchParam, PDO::PARAM_STR);
        }
        $stmt->execute();
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return ['success' => true, 'data' => $bookings];
    }

    public function archiveBooking($reservationId, $archivedByUserId = null)
    {
        try {
            $this->conn->beginTransaction();

            // First, get the current reservation to check its status
            $checkSql = "SELECT reservation_status_id, (SELECT reservation_status FROM ReservationStatus WHERE reservation_status_id = r.reservation_status_id) as current_status 
                        FROM Reservation r WHERE reservation_id = :reservation_id AND is_deleted = 0";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $checkStmt->execute();
            $currentReservation = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$currentReservation) {
                $this->conn->rollBack();
                return ['success' => false, 'message' => 'Reservation not found or already deleted.'];
            }

            $currentStatus = $currentReservation['current_status'];

            // Determine the archived status based on current status
            $archivedStatus = 'checked-out'; // Default to checked-out
            if (in_array(strtolower($currentStatus), ['cancelled'])) {
                $archivedStatus = 'cancelled'; // Keep cancelled as cancelled
            }

            // Get the archived status ID
            $statusSql = "SELECT reservation_status_id FROM ReservationStatus WHERE reservation_status = :status AND is_deleted = 0";
            $statusStmt = $this->conn->prepare($statusSql);
            $statusStmt->bindParam(':status', $archivedStatus, PDO::PARAM_STR);
            $statusStmt->execute();
            $statusRow = $statusStmt->fetch(PDO::FETCH_ASSOC);

            if (!$statusRow) {
                $this->conn->rollBack();
                return ['success' => false, 'message' => 'Archived status not found.'];
            }

            $archivedStatusId = $statusRow['reservation_status_id'];

            // Update the reservation status to archived
            $updateSql = "UPDATE Reservation SET reservation_status_id = :status_id, updated_at = CURRENT_TIMESTAMP WHERE reservation_id = :reservation_id";
            $updateStmt = $this->conn->prepare($updateSql);
            $updateStmt->bindParam(':status_id', $archivedStatusId, PDO::PARAM_INT);
            $updateStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
            $updateResult = $updateStmt->execute();

            if (!$updateResult) {
                $this->conn->rollBack();
                return ['success' => false, 'message' => 'Failed to update reservation status.'];
            }

            // Log the status change in reservation history
            if ($archivedByUserId) {
                $historySql = "INSERT INTO ReservationStatusHistory (reservation_id, status_id, changed_by_user_id, changed_at) 
                              VALUES (:reservation_id, :status_id, :user_id, CURRENT_TIMESTAMP)";
                $historyStmt = $this->conn->prepare($historySql);
                $historyStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                $historyStmt->bindParam(':status_id', $archivedStatusId, PDO::PARAM_INT);
                $historyStmt->bindParam(':user_id', $archivedByUserId, PDO::PARAM_INT);
                $historyStmt->execute(); // Don't fail transaction if history logging fails
            }

            // If archiving as checked-out, set associated rooms as available
            if ($archivedStatus === 'checked-out') {
                // Get the available status ID first
                $availableStatusSql = "SELECT room_status_id FROM RoomStatus WHERE room_status = 'available' AND is_deleted = 0 LIMIT 1";
                $availableStatusStmt = $this->conn->prepare($availableStatusSql);
                $availableStatusStmt->execute();
                $availableStatusRow = $availableStatusStmt->fetch(PDO::FETCH_ASSOC);

                if ($availableStatusRow) {
                    $availableStatusId = $availableStatusRow['room_status_id'];
                    $roomsSql = "UPDATE Room SET room_status_id = :available_status_id 
                                WHERE room_id IN (SELECT room_id FROM ReservedRoom WHERE reservation_id = :reservation_id AND is_deleted = 0)";
                    $roomsStmt = $this->conn->prepare($roomsSql);
                    $roomsStmt->bindParam(':available_status_id', $availableStatusId, PDO::PARAM_INT);
                    $roomsStmt->bindParam(':reservation_id', $reservationId, PDO::PARAM_INT);
                    $roomsStmt->execute(); // Don't fail transaction if room status update fails
                }
            }

            $this->conn->commit();
            return ['success' => true, 'message' => "Booking successfully archived as {$archivedStatus}."];
        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("Error archiving booking: " . $e->getMessage());
            error_log("Stack trace: " . $e->getTraceAsString());
            return ['success' => false, 'message' => 'An error occurred while archiving the booking: ' . $e->getMessage()];
        }
    }
}

$api = new ArchivedBookingsAPI();

// Handle different operations
try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $operation = $_POST['operation'] ?? '';
        $json = $_POST['json'] ?? '';

        switch ($operation) {
            case 'archiveBooking':
                if ($json) {
                    $data = json_decode($json, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        echo json_encode(['success' => false, 'message' => 'Invalid JSON data: ' . json_last_error_msg()]);
                        exit;
                    }

                    $reservationId = $data['reservation_id'] ?? null;
                    $archivedByUserId = $data['archived_by_user_id'] ?? null;

                    if ($reservationId) {
                        $result = $api->archiveBooking($reservationId, $archivedByUserId);
                        echo json_encode($result);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Missing reservation ID.']);
                    }
                } else {
                    echo json_encode(['success' => false, 'message' => 'Missing JSON data.']);
                }
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Invalid operation: ' . $operation]);
                break;
        }
    } else {
        // GET requests - fetch archived bookings
        $action = isset($_GET['action']) ? $_GET['action'] : 'fetch';
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';

        switch ($action) {
            case 'fetch':
            default:
                $result = $api->fetchArchivedBookings($search);
                echo json_encode($result);
                break;
        }
    }
} catch (Exception $e) {
    error_log("Archived bookings API error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
} catch (Error $e) {
    error_log("Archived bookings API fatal error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Fatal error: ' . $e->getMessage()]);
}
