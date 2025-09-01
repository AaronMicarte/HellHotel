<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class PaymentSubMethodAPI
{
    function getAllSubMethods()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT sm.*, cat.name AS payment_category
                FROM PaymentSubMethod sm
                LEFT JOIN PaymentSubMethodCategory cat ON sm.payment_category_id = cat.payment_category_id
                WHERE sm.is_deleted = 0
                ORDER BY sm.sub_method_id";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertSubMethod($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "INSERT INTO PaymentSubMethod (payment_category_id, name)
                VALUES (:payment_category_id, :name)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":payment_category_id", $json['payment_category_id']);
        $stmt->bindParam(":name", $json['name']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }

    function getSubMethod($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT sm.*, cat.name AS payment_category
                FROM PaymentSubMethod sm
                LEFT JOIN PaymentSubMethodCategory cat ON sm.payment_category_id = cat.payment_category_id
                WHERE sm.sub_method_id = :sub_method_id AND sm.is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":sub_method_id", $json['sub_method_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function updateSubMethod($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE PaymentSubMethod 
                SET payment_category_id = :payment_category_id,
                    name = :name
                WHERE sub_method_id = :sub_method_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":payment_category_id", $json['payment_category_id']);
        $stmt->bindParam(":name", $json['name']);
        $stmt->bindParam(":sub_method_id", $json['sub_method_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteSubMethod($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE PaymentSubMethod SET is_deleted = 1 WHERE sub_method_id = :sub_method_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":sub_method_id", $json['sub_method_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function getSubMethodByName($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT sm.*, cat.name AS payment_category
                FROM PaymentSubMethod sm
                LEFT JOIN PaymentSubMethodCategory cat ON sm.payment_category_id = cat.payment_category_id
                WHERE sm.name = :name AND sm.is_deleted = 0
                LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":name", $json['name']);
        $stmt->execute();
        $rs = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode($rs ? $rs : []);
    }
}

// Request handling
$operation = '';
$json = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';
    if (!$operation) {
        if (isset($_GET['sub_method_id'])) {
            $operation = 'getSubMethod';
            $json = json_encode(['sub_method_id' => $_GET['sub_method_id']]);
        } else if (isset($_GET['name'])) {
            $operation = 'getSubMethodByName';
            $json = json_encode(['name' => $_GET['name']]);
        } else {
            $operation = 'getAllSubMethods';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$subMethod = new PaymentSubMethodAPI();
switch ($operation) {
    case "getAllSubMethods":
        $subMethod->getAllSubMethods();
        break;
    case "insertSubMethod":
        $subMethod->insertSubMethod($json);
        break;
    case "getSubMethod":
        $subMethod->getSubMethod($json);
        break;
    case "getSubMethodByName":
        $subMethod->getSubMethodByName($json);
        break;
    case "updateSubMethod":
        $subMethod->updateSubMethod($json);
        break;
    case "deleteSubMethod":
        $subMethod->deleteSubMethod($json);
        break;
}
