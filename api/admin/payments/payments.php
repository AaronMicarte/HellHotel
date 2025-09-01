<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class PaymentAPI
{
    function getAllPayments()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $sql = "SELECT p.*, 
                       u.username, 
                       b.billing_id, 
                       b.total_amount, 
                       res.reservation_id, 
                       sm.name AS sub_method_name, 
                       cat.name AS payment_category
                FROM Payment p
                LEFT JOIN User u ON p.user_id = u.user_id
                LEFT JOIN Billing b ON p.billing_id = b.billing_id
                LEFT JOIN Reservation res ON p.reservation_id = res.reservation_id
                LEFT JOIN PaymentSubMethod sm ON p.sub_method_id = sm.sub_method_id
                LEFT JOIN PaymentSubMethodCategory cat ON sm.payment_category_id = cat.payment_category_id
                WHERE p.is_deleted = 0
                ORDER BY p.payment_date DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function insertPayment($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        // Debug: Log incoming payload
        file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " insertPayment payload: " . json_encode($json) . "\n", FILE_APPEND);

        // Validate required fields
        $required = ['user_id', 'billing_id', 'reservation_id', 'sub_method_id', 'amount_paid', 'payment_date'];
        foreach ($required as $field) {
            if (!isset($json[$field]) || $json[$field] === "" || $json[$field] === null) {
                $error = "Missing required field: $field";
                file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " ERROR: $error\n", FILE_APPEND);
                echo json_encode(['success' => false, 'error' => $error]);
                return;
            }
        }

        $sql = "INSERT INTO Payment (user_id, billing_id, reservation_id, sub_method_id, amount_paid, payment_date, notes)
                VALUES (:user_id, :billing_id, :reservation_id, :sub_method_id, :amount_paid, :payment_date, :notes)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":user_id", $json['user_id']);
        $stmt->bindParam(":billing_id", $json['billing_id']);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->bindParam(":sub_method_id", $json['sub_method_id']);
        $stmt->bindParam(":amount_paid", $json['amount_paid']);
        $stmt->bindParam(":payment_date", $json['payment_date']);
        $stmt->bindParam(":notes", $json['notes']);

        try {
            $stmt->execute();
            $returnValue = 0;
            if ($stmt->rowCount() > 0) {
                $returnValue = 1;
            }
            echo json_encode($returnValue);
        } catch (PDOException $e) {
            // Log and return error
            file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " PDOException: " . $e->getMessage() . "\n", FILE_APPEND);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    function getPayment($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT p.*, 
                       u.username, 
                       b.billing_id, 
                       b.total_amount, 
                       res.reservation_id, 
                       sm.name AS sub_method_name, 
                       cat.name AS payment_category
                FROM Payment p
                LEFT JOIN User u ON p.user_id = u.user_id
                LEFT JOIN Billing b ON p.billing_id = b.billing_id
                LEFT JOIN Reservation res ON p.reservation_id = res.reservation_id
                LEFT JOIN PaymentSubMethod sm ON p.sub_method_id = sm.sub_method_id
                LEFT JOIN PaymentSubMethodCategory cat ON sm.payment_category_id = cat.payment_category_id
                WHERE p.payment_id = :payment_id AND p.is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":payment_id", $json['payment_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function updatePayment($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE Payment 
                SET user_id = :user_id,
                    billing_id = :billing_id,
                    reservation_id = :reservation_id,
                    sub_method_id = :sub_method_id,
                    amount_paid = :amount_paid,
                    payment_date = :payment_date,
                    notes = :notes
                WHERE payment_id = :payment_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":user_id", $json['user_id']);
        $stmt->bindParam(":billing_id", $json['billing_id']);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->bindParam(":sub_method_id", $json['sub_method_id']);
        $stmt->bindParam(":amount_paid", $json['amount_paid']);
        $stmt->bindParam(":payment_date", $json['payment_date']);
        $stmt->bindParam(":notes", $json['notes']);
        $stmt->bindParam(":payment_id", $json['payment_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deletePayment($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE Payment SET is_deleted = 1 WHERE payment_id = :payment_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":payment_id", $json['payment_id']);
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
        if (isset($_GET['payment_id'])) {
            $operation = 'getPayment';
            $json = json_encode(['payment_id' => $_GET['payment_id']]);
        } else {
            $operation = 'getAllPayments';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$payment = new PaymentAPI();
switch ($operation) {
    case "getAllPayments":
        $payment->getAllPayments();
        break;
    case "insertPayment":
        $payment->insertPayment($json);
        break;
    case "getPayment":
        $payment->getPayment($json);
        break;
    case "updatePayment":
        $payment->updatePayment($json);
        break;
    case "deletePayment":
        $payment->deletePayment($json);
        break;
}
