<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class BillingAddon
{
    function getAllBillingAddons()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT ba.*, 
                       a.name AS addon_name, 
                       b.billing_id, 
                       b.total_amount, 
                       b.billing_date,
                       res.reservation_id,
                       CONCAT(g.first_name, ' ', g.last_name) AS guest_name
                FROM BillingAddon ba
                LEFT JOIN Addon a ON ba.addon_id = a.addon_id
                LEFT JOIN Billing b ON ba.billing_id = b.billing_id
                LEFT JOIN Reservation res ON b.reservation_id = res.reservation_id
                LEFT JOIN Guest g ON res.guest_id = g.guest_id
                WHERE ba.is_deleted = 0
                ORDER BY ba.created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertBillingAddon($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "INSERT INTO BillingAddon (addon_id, billing_id, unit_price, quantity)
                VALUES (:addon_id, :billing_id, :unit_price, :quantity)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":addon_id", $json['addon_id']);
        $stmt->bindParam(":billing_id", $json['billing_id']);
        $stmt->bindParam(":unit_price", $json['unit_price']);
        $stmt->bindParam(":quantity", $json['quantity']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }

    function getBillingAddon($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT ba.*, a.name AS addon_name, b.billing_id, b.total_amount, b.billing_date
                FROM BillingAddon ba
                LEFT JOIN Addon a ON ba.addon_id = a.addon_id
                LEFT JOIN Billing b ON ba.billing_id = b.billing_id
                WHERE ba.billing_addon_id = :billing_addon_id AND ba.is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":billing_addon_id", $json['billing_addon_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function updateBillingAddon($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE BillingAddon 
                SET addon_id = :addon_id,
                    billing_id = :billing_id,
                    unit_price = :unit_price,
                    quantity = :quantity
                WHERE billing_addon_id = :billing_addon_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":addon_id", $json['addon_id']);
        $stmt->bindParam(":billing_id", $json['billing_id']);
        $stmt->bindParam(":unit_price", $json['unit_price']);
        $stmt->bindParam(":quantity", $json['quantity']);
        $stmt->bindParam(":billing_addon_id", $json['billing_addon_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteBillingAddon($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE BillingAddon SET is_deleted = 1 WHERE billing_addon_id = :billing_addon_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":billing_addon_id", $json['billing_addon_id']);
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
        if (isset($_GET['billing_addon_id'])) {
            $operation = 'getBillingAddon';
            $json = json_encode(['billing_addon_id' => $_GET['billing_addon_id']]);
        } else {
            $operation = 'getAllBillingAddons';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$billingAddon = new BillingAddon();
switch ($operation) {
    case "getAllBillingAddons":
        $billingAddon->getAllBillingAddons();
        break;
    case "insertBillingAddon":
        $billingAddon->insertBillingAddon($json);
        break;
    case "getBillingAddon":
        $billingAddon->getBillingAddon($json);
        break;
    case "updateBillingAddon":
        $billingAddon->updateBillingAddon($json);
        break;
    case "deleteBillingAddon":
        $billingAddon->deleteBillingAddon($json);
        break;
}
