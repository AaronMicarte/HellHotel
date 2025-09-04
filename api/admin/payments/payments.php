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

        // Check reservation status first - only allow payments for confirmed reservations
        $sqlStatus = "SELECT rs.reservation_status 
                     FROM Reservation r 
                     LEFT JOIN ReservationStatus rs ON r.reservation_status_id = rs.reservation_status_id 
                     WHERE r.reservation_id = :reservation_id AND r.is_deleted = 0";
        $stmtStatus = $db->prepare($sqlStatus);
        $stmtStatus->bindParam(":reservation_id", $json['reservation_id']);
        $stmtStatus->execute();
        $statusRow = $stmtStatus->fetch(PDO::FETCH_ASSOC);

        if (!$statusRow || $statusRow['reservation_status'] === 'pending') {
            $error = "Cannot accept payments for pending reservations. Please confirm the reservation first.";
            file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " ERROR: $error\n", FILE_APPEND);
            echo json_encode(['success' => false, 'error' => $error]);
            return;
        }

        // Validate required fields - user_id is optional for online guest bookings
        $required = ['billing_id', 'reservation_id', 'sub_method_id', 'amount_paid', 'payment_date'];
        foreach ($required as $field) {
            if (!isset($json[$field]) || $json[$field] === "" || $json[$field] === null) {
                $error = "Missing required field: $field";
                file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " ERROR: $error\n", FILE_APPEND);
                echo json_encode(['success' => false, 'error' => $error]);
                return;
            }
        }

        // Set user_id to null for online guest bookings if not provided
        $user_id = isset($json['user_id']) && !empty($json['user_id']) ? $json['user_id'] : null;

        // Validate notes and reference number for electronic payments (GCash=1, PayMaya=2)
        $sub_method_id = intval($json['sub_method_id']);
        if ($sub_method_id == 1 || $sub_method_id == 2) { // GCash or PayMaya
            if (!isset($json['notes']) || trim($json['notes']) === "") {
                $error = "Notes are required for electronic payments";
                file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " ERROR: $error\n", FILE_APPEND);
                echo json_encode(['success' => false, 'error' => $error]);
                return;
            }
            if (!isset($json['reference_number']) || trim($json['reference_number']) === "") {
                $error = "Reference number is required for electronic payments";
                file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " ERROR: $error\n", FILE_APPEND);
                echo json_encode(['success' => false, 'error' => $error]);
                return;
            }
        }

        // Handle proof of payment file upload
        $proof_of_payment_url = null;
        if (isset($_FILES['proof_of_payment']) && $_FILES['proof_of_payment']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../../../assets/images/uploads/proof-of-payment/';

            // Create directory if it doesn't exist
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $fileName = 'proof_' . uniqid() . '.' . pathinfo($_FILES['proof_of_payment']['name'], PATHINFO_EXTENSION);
            $uploadPath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['proof_of_payment']['tmp_name'], $uploadPath)) {
                $proof_of_payment_url = 'assets/images/uploads/proof-of-payment/' . $fileName;
                file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " Proof of payment uploaded: $proof_of_payment_url\n", FILE_APPEND);
            } else {
                file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " Failed to upload proof of payment\n", FILE_APPEND);
            }
        }

        $sql = "INSERT INTO Payment (user_id, billing_id, reservation_id, sub_method_id, amount_paid, payment_date, notes, reference_number, proof_of_payment_url)
                VALUES (:user_id, :billing_id, :reservation_id, :sub_method_id, :amount_paid, :payment_date, :notes, :reference_number, :proof_of_payment_url)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":billing_id", $json['billing_id']);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->bindParam(":sub_method_id", $json['sub_method_id']);
        $stmt->bindParam(":amount_paid", $json['amount_paid']);
        $stmt->bindParam(":payment_date", $json['payment_date']);
        $stmt->bindParam(":notes", $json['notes']);
        $reference_number = isset($json['reference_number']) ? $json['reference_number'] : null;
        $stmt->bindParam(":reference_number", $reference_number);
        $stmt->bindParam(":proof_of_payment_url", $proof_of_payment_url);

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

    function insertOnHoldPayment($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        // Debug: Log incoming payload
        file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " insertOnHoldPayment payload: " . json_encode($json) . "\n", FILE_APPEND);

        try {
            // Handle proof of payment file upload
            $proofOfPaymentUrl = null;
            if (isset($_FILES['proof_of_payment']) && $_FILES['proof_of_payment']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = '../../../assets/images/payment/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }

                $fileName = time() . '_' . basename($_FILES['proof_of_payment']['name']);
                $targetPath = $uploadDir . $fileName;

                if (move_uploaded_file($_FILES['proof_of_payment']['tmp_name'], $targetPath)) {
                    $proofOfPaymentUrl = 'assets/images/payment/' . $fileName;
                    file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " File uploaded: " . $proofOfPaymentUrl . "\n", FILE_APPEND);
                }
            }

            // Insert payment record with billing_id if provided
            $sql = "INSERT INTO Payment (
                        user_id, 
                        billing_id,
                        reservation_id, 
                        sub_method_id, 
                        amount_paid, 
                        payment_date, 
                        notes, 
                        reference_number, 
                        proof_of_payment_url
                    ) VALUES (
                        NULL, 
                        :billing_id,
                        :reservation_id, 
                        :sub_method_id, 
                        :amount_paid, 
                        :payment_date, 
                        :notes, 
                        :reference_number, 
                        :proof_of_payment_url
                    )";

            $stmt = $db->prepare($sql);
            $billing_id = isset($json['billing_id']) ? $json['billing_id'] : null;
            $stmt->bindParam(":billing_id", $billing_id);
            $stmt->bindParam(":reservation_id", $json['reservation_id']);
            $stmt->bindParam(":sub_method_id", $json['sub_method_id']);
            $stmt->bindParam(":amount_paid", $json['amount_paid']);
            $stmt->bindParam(":payment_date", $json['payment_date']);
            $stmt->bindParam(":notes", $json['notes']);
            $stmt->bindParam(":reference_number", $json['reference_number']);
            $stmt->bindParam(":proof_of_payment_url", $proofOfPaymentUrl);
            $stmt->execute();

            $paymentId = $db->lastInsertId();

            if ($paymentId) {
                file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " Payment inserted successfully with ID: " . $paymentId . "\n", FILE_APPEND);
                echo json_encode([
                    'success' => true,
                    'payment_id' => $paymentId,
                    'message' => 'On-hold payment created successfully'
                ]);
            } else {
                throw new Exception('Failed to create payment record');
            }
        } catch (PDOException $e) {
            file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " PDOException in insertOnHoldPayment: " . $e->getMessage() . "\n", FILE_APPEND);
            echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
        } catch (Exception $e) {
            file_put_contents(__DIR__ . '/payment_debug.log', date('c') . " Exception in insertOnHoldPayment: " . $e->getMessage() . "\n", FILE_APPEND);
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
                    notes = :notes,
                    reference_number = :reference_number
                WHERE payment_id = :payment_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":user_id", $json['user_id']);
        $stmt->bindParam(":billing_id", $json['billing_id']);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->bindParam(":sub_method_id", $json['sub_method_id']);
        $stmt->bindParam(":amount_paid", $json['amount_paid']);
        $stmt->bindParam(":payment_date", $json['payment_date']);
        $stmt->bindParam(":notes", $json['notes']);
        $stmt->bindParam(":reference_number", $json['reference_number'] ?? null);
        $stmt->bindParam(":payment_id", $json['payment_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function updateLatestPayment($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        // Find the latest payment for this billing
        $sqlFind = "SELECT payment_id FROM Payment WHERE billing_id = :billing_id AND is_deleted = 0 ORDER BY payment_id DESC LIMIT 1";
        $stmtFind = $db->prepare($sqlFind);
        $stmtFind->bindParam(":billing_id", $json['billing_id']);
        $stmtFind->execute();
        $paymentId = $stmtFind->fetchColumn();

        if (!$paymentId) {
            echo json_encode(['success' => false, 'error' => 'No payment found to update']);
            return;
        }

        // Handle proof of payment file upload
        $proof_of_payment_url = null;
        if (isset($_FILES['proof_of_payment']) && $_FILES['proof_of_payment']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../../../assets/images/uploads/proof-of-payment/';

            // Create directory if it doesn't exist
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $fileName = 'proof_' . uniqid() . '.' . pathinfo($_FILES['proof_of_payment']['name'], PATHINFO_EXTENSION);
            $uploadPath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['proof_of_payment']['tmp_name'], $uploadPath)) {
                $proof_of_payment_url = 'assets/images/uploads/proof-of-payment/' . $fileName;
            }
        }

        // Update the payment
        $updateFields = [];
        $params = [':payment_id' => $paymentId];

        foreach (['sub_method_id', 'amount_paid', 'notes', 'reference_number'] as $field) {
            if (isset($json[$field])) {
                $updateFields[] = "$field = :$field";
                $params[":$field"] = $json[$field];
            }
        }

        // Add proof of payment URL if uploaded
        if ($proof_of_payment_url !== null) {
            $updateFields[] = "proof_of_payment_url = :proof_of_payment_url";
            $params[":proof_of_payment_url"] = $proof_of_payment_url;
        }

        if (empty($updateFields)) {
            echo json_encode(['success' => false, 'error' => 'No fields to update']);
            return;
        }

        $sql = "UPDATE Payment SET " . implode(", ", $updateFields) . " WHERE payment_id = :payment_id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'payment_id' => $paymentId]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Payment update failed']);
        }
    }

    function getPaymentsByReservation($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = is_array($json) ? $json : json_decode($json, true);

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
                WHERE p.reservation_id = :reservation_id AND p.is_deleted = 0
                ORDER BY p.payment_date DESC, p.payment_id DESC";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":reservation_id", $json['reservation_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
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
        } else if (isset($_GET['reservation_id'])) {
            $operation = 'getPaymentsByReservation';
            $json = json_encode(['reservation_id' => $_GET['reservation_id']]);
        } else {
            $operation = 'getAllPayments';
        }
    } else if ($operation === 'getPaymentsByReservation' && isset($_GET['reservation_id'])) {
        $json = json_encode(['reservation_id' => $_GET['reservation_id']]);
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
    case "insertOnHoldPayment":
        $payment->insertOnHoldPayment($json);
        break;
    case "getPayment":
        $payment->getPayment($json);
        break;
    case "updatePayment":
        $payment->updatePayment($json);
        break;
    case "updateLatestPayment":
        $payment->updateLatestPayment($json);
        break;
    case "getPaymentsByReservation":
        $payment->getPaymentsByReservation($json);
        break;
    case "deletePayment":
        $payment->deletePayment($json);
        break;
}
