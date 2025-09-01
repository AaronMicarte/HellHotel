
<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class AddonOrderItemAPI
{
    function getAllOrderItems()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT oi.*, ao.addon_order_id, a.name AS addon_name
                FROM AddonOrderItem oi
                LEFT JOIN AddonOrder ao ON oi.addon_order_id = ao.addon_order_id
                LEFT JOIN Addon a ON oi.addon_id = a.addon_id
                WHERE oi.is_deleted = 0
                ORDER BY oi.created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertOrderItem($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "INSERT INTO AddonOrderItem (addon_order_id, addon_id)
                VALUES (:addon_order_id, :addon_id)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":addon_order_id", $json['addon_order_id']);
        $stmt->bindParam(":addon_id", $json['addon_id']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }

    function getOrderItem($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT oi.*, ao.addon_order_id, a.name AS addon_name
                FROM AddonOrderItem oi
                LEFT JOIN AddonOrder ao ON oi.addon_order_id = ao.addon_order_id
                LEFT JOIN Addon a ON oi.addon_id = a.addon_id
                WHERE oi.order_item_id = :order_item_id AND oi.is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":order_item_id", $json['order_item_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }
    public function getOrderItemsByOrderId($addon_order_id)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $sql = "SELECT a.name, a.price, COUNT(*) as quantity, oi.addon_id
            FROM AddonOrderItem oi
            JOIN Addon a ON oi.addon_id = a.addon_id
            WHERE oi.addon_order_id = ? AND oi.is_deleted = 0
            GROUP BY oi.addon_id, a.name, a.price";
        $stmt = $db->prepare($sql);
        $stmt->execute([$addon_order_id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($items);
    }

    function updateOrderItem($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE AddonOrderItem 
                SET addon_order_id = :addon_order_id,
                    addon_id = :addon_id
                WHERE order_item_id = :order_item_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":addon_order_id", $json['addon_order_id']);
        $stmt->bindParam(":addon_id", $json['addon_id']);
        $stmt->bindParam(":order_item_id", $json['order_item_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteOrderItem($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE AddonOrderItem SET is_deleted = 1 WHERE order_item_id = :order_item_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":order_item_id", $json['order_item_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
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
        if (isset($_GET['order_item_id'])) {
            $operation = 'getOrderItem';
            $json = json_encode(['order_item_id' => $_GET['order_item_id']]);
        } else {
            $operation = 'getAllOrderItems';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$orderItem = new AddonOrderItemAPI();
switch ($operation) {
    case "getAllOrderItems":
        $orderItem->getAllOrderItems();
        break;
    case "insertOrderItem":
        $orderItem->insertOrderItem($json);
        break;
    case "getOrderItem":
        $orderItem->getOrderItem($json);
        break;
    case "updateOrderItem":
        $orderItem->updateOrderItem($json);
        break;
    case "deleteOrderItem":
        $orderItem->deleteOrderItem($json);
        break;
    case "getOrderItemsByOrderId":
        $addon_order_id = isset($_GET['addon_order_id']) ? intval($_GET['addon_order_id']) : 0;
        $orderItem->getOrderItemsByOrderId($addon_order_id);
        break;
}
