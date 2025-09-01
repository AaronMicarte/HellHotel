<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

include_once '../../config/database.php';
$database = new Database();
$db = $database->getConnection();

$sql = "SELECT sm.sub_method_id, sm.name, c.name AS category_name
        FROM PaymentSubMethod sm
        LEFT JOIN PaymentSubMethodCategory c ON sm.payment_category_id = c.payment_category_id
        WHERE sm.is_deleted = 0 AND c.is_deleted = 0";
$stmt = $db->prepare($sql);
$stmt->execute();
$methods = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($methods);
