<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class AddonOrderStatus
{
    // Log status change to AddonOrderStatusHistory
    private function logStatusChange($addon_order_id, $status_id, $changed_by_user_id, $remarks)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $sql = "INSERT INTO AddonOrderStatusHistory (addon_order_id, status_id, changed_by_user_id, remarks) VALUES (:addon_order_id, :status_id, :changed_by_user_id, :remarks)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":addon_order_id", $addon_order_id);
        $stmt->bindParam(":status_id", $status_id);
        $stmt->bindParam(":changed_by_user_id", $changed_by_user_id);
        $stmt->bindParam(":remarks", $remarks);
        $stmt->execute();
    }

    // Get full status change history for all addon orders
    function getAllAddonOrderStatusHistory()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $sql = "
            SELECT
                h.history_id,
                h.addon_order_id,
                ao.reservation_id,
                CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
                aos.order_status_name,
                h.changed_at,
                u.username AS changed_by_username,
                ur.role_type AS changed_by_role,
                h.remarks
            FROM AddonOrderStatusHistory h
            JOIN AddonOrder ao ON h.addon_order_id = ao.addon_order_id
            LEFT JOIN Reservation r ON ao.reservation_id = r.reservation_id
            LEFT JOIN Guest g ON r.guest_id = g.guest_id
            JOIN AddonOrderStatus aos ON h.status_id = aos.order_status_id
            LEFT JOIN User u ON h.changed_by_user_id = u.user_id
            LEFT JOIN UserRoles ur ON u.user_roles_id = ur.user_roles_id
            WHERE ao.is_deleted = 0
            ORDER BY h.changed_at DESC
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($rows);
    }

    function getAllOrderStatuses()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT * FROM AddonOrderStatus WHERE is_deleted = 0 ORDER BY order_status_id";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertOrderStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "INSERT INTO AddonOrderStatus (order_status_name) VALUES (:order_status_name)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":order_status_name", $json['order_status_name']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }

    function getOrderStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT * FROM AddonOrderStatus WHERE order_status_id = :order_status_id AND is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":order_status_id", $json['order_status_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function updateOrderStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE AddonOrderStatus SET order_status_name = :order_status_name WHERE order_status_id = :order_status_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":order_status_name", $json['order_status_name']);
        $stmt->bindParam(":order_status_id", $json['order_status_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteOrderStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE AddonOrderStatus SET is_deleted = 1 WHERE order_status_id = :order_status_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":order_status_id", $json['order_status_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }
    // Update AddonOrder status by order_id and status name
    function updateOrderStatusByName($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $addon_order_id = isset($json['addon_order_id']) ? $json['addon_order_id'] : null;
        $next_status = isset($json['next_status']) ? $json['next_status'] : null;
        $changed_by_user_id = isset($json['changed_by_user_id']) ? $json['changed_by_user_id'] : null;
        $remarks = isset($json['remarks']) ? $json['remarks'] : '';
        if (!$addon_order_id || !$next_status) {
            echo json_encode(['success' => false, 'message' => 'Missing parameters.']);
            return;
        }
        if (!$changed_by_user_id) {
            echo json_encode(['success' => false, 'message' => 'Missing changed_by_user_id. Please log in again.']);
            return;
        }
        // Get status id from name
        $stmt = $db->prepare("SELECT order_status_id FROM AddonOrderStatus WHERE order_status_name = :name AND is_deleted = 0 LIMIT 1");
        $stmt->bindParam(":name", $next_status);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            echo json_encode(['success' => false, 'message' => 'Invalid status name.']);
            return;
        }
        $order_status_id = $row['order_status_id'];
        // Get previous status
        $stmtPrev = $db->prepare("SELECT order_status_id FROM AddonOrder WHERE addon_order_id = :addon_order_id");
        $stmtPrev->bindParam(":addon_order_id", $addon_order_id);
        $stmtPrev->execute();
        $prevRow = $stmtPrev->fetch(PDO::FETCH_ASSOC);
        $prev_status_id = $prevRow ? $prevRow['order_status_id'] : null;
        // Get new status name
        $new_status_name = strtolower($next_status);
        // Get reservation_id for this order
        $stmtOrder = $db->prepare("SELECT reservation_id FROM AddonOrder WHERE addon_order_id = :addon_order_id");
        $stmtOrder->bindParam(":addon_order_id", $addon_order_id);
        $stmtOrder->execute();
        $orderRow = $stmtOrder->fetch(PDO::FETCH_ASSOC);
        $reservation_id = $orderRow ? $orderRow['reservation_id'] : null;
        // If trying to deliver, check reservation status
        if ($new_status_name === 'delivered' && $reservation_id) {
            $stmtRes = $db->prepare("SELECT rs.reservation_status FROM Reservation res LEFT JOIN ReservationStatus rs ON res.reservation_status_id = rs.reservation_status_id WHERE res.reservation_id = ? LIMIT 1");
            $stmtRes->execute([$reservation_id]);
            $resStatusRow = $stmtRes->fetch(PDO::FETCH_ASSOC);
            $reservation_status = $resStatusRow ? strtolower($resStatusRow['reservation_status']) : '';
            if ($reservation_status !== 'checked-in') {
                echo json_encode(['success' => false, 'message' => 'Cannot deliver addon: The guest reservation status is not checked-in.']);
                return;
            }
        }
        // Update AddonOrder
        $stmt2 = $db->prepare("UPDATE AddonOrder SET order_status_id = :order_status_id, updated_at = NOW() WHERE addon_order_id = :addon_order_id");
        $stmt2->bindParam(":order_status_id", $order_status_id);
        $stmt2->bindParam(":addon_order_id", $addon_order_id);
        $stmt2->execute();
        // Log status change
        $this->logStatusChange($addon_order_id, $order_status_id, $changed_by_user_id, $remarks);
        // Get billing_id for this reservation
        $billing_id = null;
        if ($reservation_id) {
            $stmtBill = $db->prepare("SELECT billing_id FROM Billing WHERE reservation_id = ? AND is_deleted = 0 LIMIT 1");
            $stmtBill->execute([$reservation_id]);
            $billRow = $stmtBill->fetch(PDO::FETCH_ASSOC);
            $billing_id = $billRow ? $billRow['billing_id'] : null;
        }
        // If new status is billable, insert BillingAddon rows if not present
        if ($billing_id && !in_array($new_status_name, ['pending', 'cancelled'])) {
            // Get all AddonOrderItems for this order
            $stmtItems = $db->prepare("SELECT addon_id, COUNT(*) as qty FROM AddonOrderItem WHERE addon_order_id = ? AND is_deleted = 0 GROUP BY addon_id");
            $stmtItems->execute([$addon_order_id]);
            $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
            foreach ($items as $item) {
                $addon_id = $item['addon_id'];
                $quantity = $item['qty'];
                // Check if already in BillingAddon
                $stmtCheck = $db->prepare("SELECT COUNT(*) FROM BillingAddon WHERE billing_id = ? AND addon_id = ? AND is_deleted = 0");
                $stmtCheck->execute([$billing_id, $addon_id]);
                $exists = $stmtCheck->fetchColumn();
                if (!$exists) {
                    // Get price
                    $stmtPrice = $db->prepare("SELECT price FROM Addon WHERE addon_id = ?");
                    $stmtPrice->execute([$addon_id]);
                    $addon = $stmtPrice->fetch(PDO::FETCH_ASSOC);
                    $unit_price = $addon ? $addon['price'] : 0;
                    $stmtAdd = $db->prepare("INSERT INTO BillingAddon (addon_id, billing_id, unit_price, quantity) VALUES (?, ?, ?, ?)");
                    $stmtAdd->execute([$addon_id, $billing_id, $unit_price, $quantity]);
                }
            }
        }
        // If new status is cancelled, mark related BillingAddon as deleted
        if ($billing_id && $new_status_name === 'cancelled') {
            $stmtDel = $db->prepare("UPDATE BillingAddon SET is_deleted = 1 WHERE billing_id = ? AND addon_id IN (SELECT addon_id FROM AddonOrderItem WHERE addon_order_id = ?)");
            $stmtDel->execute([$billing_id, $addon_order_id]);
        }
        if ($stmt2->rowCount() > 0) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Order not updated.']);
        }
    }
}

// Request handling
$operation = '';
$json = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';
    if (!$operation) {
        if (isset($_GET['order_status_id'])) {
            $operation = 'getOrderStatus';
            $json = json_encode(['order_status_id' => $_GET['order_status_id']]);
        } else {
            $operation = 'getAllOrderStatuses';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$orderStatus = new AddonOrderStatus();
switch ($operation) {
    case "updateOrderStatus":
        $orderStatus->updateOrderStatusByName($json);
        break;
    case "getAllOrderStatuses":
        $orderStatus->getAllOrderStatuses();
        break;
    case "insertOrderStatus":
        $orderStatus->insertOrderStatus($json);
        break;
    case "getOrderStatus":
        $orderStatus->getOrderStatus($json);
        break;
    case "updateOrderStatus":
        $orderStatus->updateOrderStatus($json);
        break;
    case "deleteOrderStatus":
        $orderStatus->deleteOrderStatus($json);
        break;
    case "getAllAddonOrderStatusHistory":
        $orderStatus->getAllAddonOrderStatusHistory();
        break;
}
