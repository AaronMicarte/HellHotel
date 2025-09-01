<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class BillingStatusAPI
{
    function getAllBillingStatuses()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT * FROM BillingStatus WHERE is_deleted = 0 ORDER BY billing_status_id";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertBillingStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "INSERT INTO BillingStatus (billing_status) VALUES (:billing_status)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":billing_status", $json['billing_status']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }

    function getBillingStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT * FROM BillingStatus WHERE billing_status_id = :billing_status_id AND is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":billing_status_id", $json['billing_status_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function updateBillingStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE BillingStatus SET billing_status = :billing_status WHERE billing_status_id = :billing_status_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":billing_status", $json['billing_status']);
        $stmt->bindParam(":billing_status_id", $json['billing_status_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteBillingStatus($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE BillingStatus SET is_deleted = 1 WHERE billing_status_id = :billing_status_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":billing_status_id", $json['billing_status_id']);
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
        if (isset($_GET['billing_status_id'])) {
            $operation = 'getBillingStatus';
            $json = json_encode(['billing_status_id' => $_GET['billing_status_id']]);
        } else {
            $operation = 'getAllBillingStatuses';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$billingStatus = new BillingStatusAPI();
switch ($operation) {
    case "getAllBillingStatuses":
        $billingStatus->getAllBillingStatuses();
        break;
    case "insertBillingStatus":
        $billingStatus->insertBillingStatus($json);
        break;
    case "getBillingStatus":
        $billingStatus->getBillingStatus($json);
        break;
    case "updateBillingStatus":
        $billingStatus->updateBillingStatus($json);
        break;
    case "deleteBillingStatus":
        $billingStatus->deleteBillingStatus($json);
        break;
}
