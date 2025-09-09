
<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

class BillingHistory
{
    private $db;
    private $user_id;
    private $role_type;

    public function __construct()
    {
        include_once '../../config/database.php';
        require_once '../../middleware/auth.php';
        $database = new Database();
        $this->db = $database->getConnection();
        $this->user_id = $_SESSION['user_id'] ?? null;
        $this->role_type = $_SESSION['role_type'] ?? null;
    }

    // Fetch all billing history with pagination and optional filters
    public function getAllHistory()
    {
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
        $offset = ($page - 1) * $limit;
        $status = isset($_GET['status']) ? $_GET['status'] : null;
        $guest_id = isset($_GET['guest_id']) ? $_GET['guest_id'] : null;
        $date_from = isset($_GET['date_from']) ? $_GET['date_from'] : null;
        $date_to = isset($_GET['date_to']) ? $_GET['date_to'] : null;

        $where = [];
        $params = [];
        if ($status) {
            $where[] = 'bh.status = :status';
            $params[':status'] = $status;
        }
        if ($guest_id) {
            $where[] = 'bh.guest_id = :guest_id';
            $params[':guest_id'] = $guest_id;
        }
        if ($date_from) {
            $where[] = 'bh.created_at >= :date_from';
            $params[':date_from'] = $date_from;
        }
        if ($date_to) {
            $where[] = 'bh.created_at <= :date_to';
            $params[':date_to'] = $date_to;
        }
        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        // Count total
        $countSql = "SELECT COUNT(*) FROM BillingHistory bh $whereSql";
        $countStmt = $this->db->prepare($countSql);
        foreach ($params as $key => $val) {
            $countStmt->bindValue($key, $val);
        }
        $countStmt->execute();
        $total = $countStmt->fetchColumn();

        // Main query
        $sql = "SELECT bh.id, bh.guest_id, CONCAT(g.first_name, ' ', g.last_name) AS guest_name, bh.amount, bh.status, bh.created_at, bh.action, bh.performed_by, u.username AS performed_by_username
                FROM BillingHistory bh
                LEFT JOIN Guest g ON bh.guest_id = g.guest_id
                LEFT JOIN User u ON bh.performed_by = u.user_id
                $whereSql
                ORDER BY bh.created_at DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'data' => $rs,
            'total' => intval($total),
            'page' => $page,
            'limit' => $limit,
            'debug' => [
                'session_user_id' => $this->user_id,
                'session_role_type' => $this->role_type
            ]
        ]);
    }

    // Fetch billing history by billing ID
    public function getHistoryByBilling($json)
    {
        $json = json_decode($json, true);
        $billing_id = $json['billing_id'] ?? null;
        if (!$billing_id) {
            echo json_encode(['error' => 'Missing billing_id']);
            return;
        }
        $sql = "SELECT bh.id, bh.guest_id, CONCAT(g.first_name, ' ', g.last_name) AS guest_name, bh.amount, bh.status, bh.created_at, bh.action, bh.performed_by, u.username AS performed_by_username
                FROM BillingHistory bh
                LEFT JOIN Guest g ON bh.guest_id = g.guest_id
                LEFT JOIN User u ON bh.performed_by = u.user_id
                WHERE bh.id = :billing_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':billing_id', $billing_id);
        $stmt->execute();
        $rs = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['data' => $rs]);
    }

    // Insert a billing audit record
    public function insertHistory($json)
    {
        $json = json_decode($json, true);
        $guest_id = $json['guest_id'] ?? null;
        $amount = $json['amount'] ?? null;
        $status = $json['status'] ?? null;
        $action = $json['action'] ?? null;
        $performed_by = $this->user_id;
        if (!$guest_id || !$amount || !$status || !$action) {
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }
        $sql = "INSERT INTO BillingHistory (guest_id, amount, status, action, performed_by, created_at)
                VALUES (:guest_id, :amount, :status, :action, :performed_by, NOW())";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':guest_id', $guest_id);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':performed_by', $performed_by);
        $stmt->execute();
        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode(['success' => $returnValue]);
    }
}

// Request handling
$operation = '';
$json = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';
    if (!$operation) {
        if (isset($_GET['billing_id'])) {
            $operation = 'getHistoryByBilling';
            $json = json_encode(['billing_id' => $_GET['billing_id']]);
        } else {
            $operation = 'getAllHistory';
        }
    } else if ($operation === 'getHistoryByBilling' && isset($_GET['billing_id'])) {
        $json = json_encode(['billing_id' => $_GET['billing_id']]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
    if (!$operation) {
        $operation = 'insertHistory';
        $json = file_get_contents('php://input');
    }
}

$history = new BillingHistory();
switch ($operation) {
    case "getAllHistory":
        $history->getAllHistory();
        break;
    case "insertHistory":
        $history->insertHistory($json);
        break;
    case "getHistoryByBilling":
        $history->getHistoryByBilling($json);
        break;
    default:
        echo json_encode(['error' => 'Invalid operation']);
        break;
}
