<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class PaymentSubMethodCategory
{
    function getAllCategories()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT * FROM PaymentSubMethodCategory WHERE is_deleted = 0 ORDER BY payment_category_id";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertCategory($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "INSERT INTO PaymentSubMethodCategory (name) VALUES (:name)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":name", $json['name']);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $returnValue = 1;
        }
        echo json_encode($returnValue);
    }

    function getCategory($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT * FROM PaymentSubMethodCategory WHERE payment_category_id = :payment_category_id AND is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":payment_category_id", $json['payment_category_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function updateCategory($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE PaymentSubMethodCategory SET name = :name WHERE payment_category_id = :payment_category_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":name", $json['name']);
        $stmt->bindParam(":payment_category_id", $json['payment_category_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteCategory($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE PaymentSubMethodCategory SET is_deleted = 1 WHERE payment_category_id = :payment_category_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":payment_category_id", $json['payment_category_id']);
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
        if (isset($_GET['payment_category_id'])) {
            $operation = 'getCategory';
            $json = json_encode(['payment_category_id' => $_GET['payment_category_id']]);
        } else {
            $operation = 'getAllCategories';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$category = new PaymentSubMethodCategory();
switch ($operation) {
    case "getAllCategories":
        $category->getAllCategories();
        break;
    case "insertCategory":
        $category->insertCategory($json);
        break;
    case "getCategory":
        $category->getCategory($json);
        break;
    case "updateCategory":
        $category->updateCategory($json);
        break;
    case "deleteCategory":
        $category->deleteCategory($json);
        break;
}
