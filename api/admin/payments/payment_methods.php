<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class PaymentMethods
{
        private $db;

        public function __construct()
        {
                include_once '../../config/database.php';
                $database = new Database();
                $this->db = $database->getConnection();
        }

        function getAllPaymentCategories()
        {
                try {
                        if (!$this->db) {
                                echo json_encode(['error' => 'Database connection failed']);
                                return;
                        }

                        $sql = "SELECT payment_category_id, name, created_at, updated_at
                    FROM PaymentSubMethodCategory 
                    WHERE is_deleted = 0
                    ORDER BY payment_category_id";

                        $stmt = $this->db->prepare($sql);
                        $stmt->execute();
                        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

                        echo json_encode($rs);
                } catch (Exception $e) {
                        error_log("Error in getAllPaymentCategories: " . $e->getMessage());
                        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
                }
        }

        function getAllPaymentSubMethods()
        {
                try {
                        if (!$this->db) {
                                echo json_encode(['error' => 'Database connection failed']);
                                return;
                        }

                        $sql = "SELECT sm.sub_method_id, sm.payment_category_id, sm.name, 
                           c.name AS category_name, sm.created_at, sm.updated_at
                    FROM PaymentSubMethod sm
                    LEFT JOIN PaymentSubMethodCategory c ON sm.payment_category_id = c.payment_category_id
                    WHERE sm.is_deleted = 0 AND c.is_deleted = 0
                    ORDER BY c.payment_category_id, sm.name";

                        $stmt = $this->db->prepare($sql);
                        $stmt->execute();
                        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

                        echo json_encode($rs);
                } catch (Exception $e) {
                        error_log("Error in getAllPaymentSubMethods: " . $e->getMessage());
                        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
                }
        }

        function getPaymentSubMethodsByCategory($json)
        {
                try {
                        if (!$this->db) {
                                echo json_encode(['error' => 'Database connection failed']);
                                return;
                        }

                        $data = json_decode($json, true);
                        if (!isset($data['payment_category_id'])) {
                                echo json_encode(['error' => 'payment_category_id is required']);
                                return;
                        }

                        $categoryId = $data['payment_category_id'];

                        $sql = "SELECT sm.sub_method_id, sm.payment_category_id, sm.name, 
                           c.name AS category_name, sm.created_at, sm.updated_at
                    FROM PaymentSubMethod sm
                    LEFT JOIN PaymentSubMethodCategory c ON sm.payment_category_id = c.payment_category_id
                    WHERE sm.is_deleted = 0 AND c.is_deleted = 0 
                          AND sm.payment_category_id = :category_id
                    ORDER BY sm.name";

                        $stmt = $this->db->prepare($sql);
                        $stmt->bindParam(':category_id', $categoryId, PDO::PARAM_INT);
                        $stmt->execute();
                        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

                        echo json_encode($rs);
                } catch (Exception $e) {
                        error_log("Error in getPaymentSubMethodsByCategory: " . $e->getMessage());
                        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
                }
        }

        function getPaymentSubMethod($json)
        {
                try {
                        if (!$this->db) {
                                echo json_encode(['error' => 'Database connection failed']);
                                return;
                        }

                        $data = json_decode($json, true);
                        if (!isset($data['sub_method_id'])) {
                                echo json_encode(['error' => 'sub_method_id is required']);
                                return;
                        }

                        $subMethodId = $data['sub_method_id'];

                        $sql = "SELECT sm.sub_method_id, sm.payment_category_id, sm.name, 
                           c.name AS category_name, sm.created_at, sm.updated_at
                    FROM PaymentSubMethod sm
                    LEFT JOIN PaymentSubMethodCategory c ON sm.payment_category_id = c.payment_category_id
                    WHERE sm.is_deleted = 0 AND c.is_deleted = 0 
                          AND sm.sub_method_id = :sub_method_id";

                        $stmt = $this->db->prepare($sql);
                        $stmt->bindParam(':sub_method_id', $subMethodId, PDO::PARAM_INT);
                        $stmt->execute();
                        $rs = $stmt->fetch(PDO::FETCH_ASSOC);

                        if ($rs) {
                                echo json_encode($rs);
                        } else {
                                echo json_encode(['error' => 'Payment method not found']);
                        }
                } catch (Exception $e) {
                        error_log("Error in getPaymentSubMethod: " . $e->getMessage());
                        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
                }
        }

        function getSubMethodByName($json)
        {
                try {
                        if (!$this->db) {
                                echo json_encode(['error' => 'Database connection failed']);
                                return;
                        }

                        $data = json_decode($json, true);
                        if (!isset($data['name'])) {
                                echo json_encode(['error' => 'name is required']);
                                return;
                        }

                        $methodName = $data['name'];

                        $sql = "SELECT sm.sub_method_id, sm.payment_category_id, sm.name, 
                           c.name AS category_name, sm.created_at, sm.updated_at
                    FROM PaymentSubMethod sm
                    LEFT JOIN PaymentSubMethodCategory c ON sm.payment_category_id = c.payment_category_id
                    WHERE sm.is_deleted = 0 AND c.is_deleted = 0 
                          AND LOWER(sm.name) = LOWER(:name)";

                        $stmt = $this->db->prepare($sql);
                        $stmt->bindParam(':name', $methodName, PDO::PARAM_STR);
                        $stmt->execute();
                        $rs = $stmt->fetch(PDO::FETCH_ASSOC);

                        if ($rs) {
                                echo json_encode($rs);
                        } else {
                                echo json_encode(['error' => 'Payment method not found']);
                        }
                } catch (Exception $e) {
                        error_log("Error in getSubMethodByName: " . $e->getMessage());
                        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
                }
        }
}

// Handle different request methods and operations
$operation = '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $operation = isset($_GET['operation']) ? $_GET['operation'] : 'getAllPaymentSubMethods';
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
        $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$paymentMethods = new PaymentMethods();
switch ($operation) {
        case "getAllPaymentCategories":
                $paymentMethods->getAllPaymentCategories();
                break;
        case "getAllPaymentSubMethods":
                $paymentMethods->getAllPaymentSubMethods();
                break;
        case "getPaymentSubMethodsByCategory":
                $paymentMethods->getPaymentSubMethodsByCategory($json);
                break;
        case "getPaymentSubMethod":
                $paymentMethods->getPaymentSubMethod($json);
                break;
        case "getSubMethodByName":
                $paymentMethods->getSubMethodByName($json);
                break;
        default:
                // Default to getting all sub methods for backward compatibility
                $paymentMethods->getAllPaymentSubMethods();
                break;
}
