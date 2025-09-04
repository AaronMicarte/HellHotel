<?php
// DEBUG: Always show errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class Guest
{
    function getAllGuests()
    {
        try {
            include_once '../../config/database.php';
            $database = new Database();
            $db = $database->getConnection();

            if (!$db) {
                error_log("Database connection failed in getAllGuests");
                echo json_encode(['error' => 'Database connection failed']);
                return;
            }

            $sql = "SELECT g.*, t.id_type 
                    FROM Guest g 
                    LEFT JOIN GuestIDType t ON g.guest_idtype_id = t.guest_idtype_id
                    WHERE g.is_deleted = 0
                    ORDER BY g.last_name, g.first_name";

            error_log("Executing SQL: " . $sql);

            $stmt = $db->prepare($sql);
            $stmt->execute();
            $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            error_log("Query executed successfully. Found " . count($rs) . " guests");
            error_log("Sample data: " . json_encode(array_slice($rs, 0, 2)));

            echo json_encode($rs);
        } catch (Exception $e) {
            error_log("Error in getAllGuests: " . $e->getMessage());
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    }

    function insertGuest($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        // Handle both JSON parameter and direct POST data
        if (is_string($json)) {
            $data = json_decode($json, true);
        } else {
            $data = $json;
        }

        // If JSON decode failed or data is empty, try to get from POST
        if (!$data) {
            $data = $_POST;
        }


        // Handle file upload: save to /assets/images/uploads/id-pictures/ and store path
        $id_picture_path = null;
        if (isset($_FILES['id_picture']) && $_FILES['id_picture']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/assets/images/uploads/id-pictures/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $fileTmp = $_FILES['id_picture']['tmp_name'];
            $fileName = basename($_FILES['id_picture']['name']);
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array($fileExt, $allowed)) {
                $newFileName = uniqid('idpic_', true) . '.' . $fileExt;
                $destPath = $uploadDir . $newFileName;
                if (move_uploaded_file($fileTmp, $destPath)) {
                    $id_picture_path = '/assets/images/uploads/id-pictures/' . $newFileName;
                }
            }
        } else if (isset($data['id_picture']) && $data['id_picture']) {
            // If already a path (from uploadIdPicture), just use it
            $id_picture_path = $data['id_picture'];
        }

        // Defensive: check required fields
        if (
            empty($data['guest_idtype_id']) ||
            empty($data['last_name']) ||
            empty($data['first_name']) ||
            empty($data['email']) ||
            empty($data['phone_number']) ||
            empty($data['id_number'])
        ) {
            echo json_encode(0);
            return;
        }


        $sql = "INSERT INTO Guest (guest_idtype_id, last_name, first_name, middle_name, suffix, date_of_birth, email, phone_number, id_number, id_picture)
        VALUES (:guest_idtype_id, :last_name, :first_name, :middle_name, :suffix, :date_of_birth, :email, :phone_number, :id_number, :id_picture)";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":guest_idtype_id", $data['guest_idtype_id']);
        $stmt->bindParam(":last_name", $data['last_name']);
        $stmt->bindParam(":first_name", $data['first_name']);
        $stmt->bindParam(":middle_name", $data['middle_name']);
        $stmt->bindParam(":suffix", $data['suffix']);
        $stmt->bindParam(":date_of_birth", $data['date_of_birth']);
        $stmt->bindParam(":email", $data['email']);
        $stmt->bindParam(":phone_number", $data['phone_number']);
        $stmt->bindParam(":id_number", $data['id_number']);
        $stmt->bindParam(":id_picture", $id_picture_path);
        $stmt->execute();

        $returnValue = 0;
        if ($stmt->rowCount() > 0) {
            $guest_id = $db->lastInsertId();
            // Return object with guest_id for new code, but also make it backwards compatible
            $returnValue = [
                "guest_id" => $guest_id,
                "success" => 1
            ];
        }
        echo json_encode($returnValue);
    }

    function getGuest($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT g.*, t.id_type 
                FROM Guest g 
                LEFT JOIN GuestIDType t ON g.guest_idtype_id = t.guest_idtype_id
                WHERE g.guest_id = :guest_id AND g.is_deleted = 0";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":guest_id", $json['guest_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }

    function updateGuest($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);


        // Handle file upload: save to /assets/images/uploads/id-pictures/ and store path
        if (isset($_FILES['id_picture']) && $_FILES['id_picture']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/assets/images/uploads/id-pictures/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $fileTmp = $_FILES['id_picture']['tmp_name'];
            $fileName = basename($_FILES['id_picture']['name']);
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array($fileExt, $allowed)) {
                $newFileName = uniqid('idpic_', true) . '.' . $fileExt;
                $destPath = $uploadDir . $newFileName;
                if (move_uploaded_file($fileTmp, $destPath)) {
                    $json['id_picture'] = '/assets/images/uploads/id-pictures/' . $newFileName;
                }
            }
        } else if (empty($json['id_picture']) || strpos($json['id_picture'], 'blob:') === 0 || $json['id_picture'] === 'null') {
            // Fetch current id_picture
            $sqlPic = "SELECT id_picture FROM Guest WHERE guest_id = :guest_id";
            $stmtPic = $db->prepare($sqlPic);
            $stmtPic->bindParam(":guest_id", $json['guest_id']);
            $stmtPic->execute();
            $currentPic = $stmtPic->fetchColumn();
            $json['id_picture'] = $currentPic;
        }

        $sql = "UPDATE Guest 
                SET guest_idtype_id = :guest_idtype_id,
                    last_name = :last_name,
                    first_name = :first_name,
                    middle_name = :middle_name,
                    suffix = :suffix,
                    date_of_birth = :date_of_birth,
                    email = :email,
                    phone_number = :phone_number,
                    id_number = :id_number,
                    id_picture = :id_picture
                WHERE guest_id = :guest_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":guest_idtype_id", $json['guest_idtype_id']);
        $stmt->bindParam(":last_name", $json['last_name']);
        $stmt->bindParam(":first_name", $json['first_name']);
        $stmt->bindParam(":middle_name", $json['middle_name']);
        $stmt->bindParam(":suffix", $json['suffix']);
        $stmt->bindParam(":date_of_birth", $json['date_of_birth']);
        $stmt->bindParam(":email", $json['email']);
        $stmt->bindParam(":phone_number", $json['phone_number']);
        $stmt->bindParam(":id_number", $json['id_number']);
        $stmt->bindParam(":id_picture", $json['id_picture']);
        $stmt->bindParam(":guest_id", $json['guest_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    function deleteGuest($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "UPDATE Guest SET is_deleted = 1 WHERE guest_id = :guest_id";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":guest_id", $json['guest_id']);
        $stmt->execute();

        $returnValue = $stmt->rowCount() > 0 ? 1 : 0;
        echo json_encode($returnValue);
    }

    // Add this function to get guest info + latest reservation
    function getGuestWithLatestReservation($json)
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();
        $json = json_decode($json, true);

        $sql = "SELECT 
                    g.*, 
                    t.id_type,
                    r.reservation_id,
                    r.check_in_date,
                    r.check_out_date,
                    rs.reservation_status,
                    rm.room_number,
                    rt.type_name
                FROM Guest g
                LEFT JOIN GuestIDType t ON g.guest_idtype_id = t.guest_idtype_id
                LEFT JOIN Reservation r ON r.guest_id = g.guest_id AND r.is_deleted = 0
                LEFT JOIN ReservationStatus rs ON r.reservation_status_id = rs.reservation_status_id
                LEFT JOIN ReservedRoom rr ON rr.reservation_id = r.reservation_id AND rr.is_deleted = 0
                LEFT JOIN Room rm ON rr.room_id = rm.room_id AND rm.is_deleted = 0
                LEFT JOIN RoomType rt ON rm.room_type_id = rt.room_type_id
                WHERE g.guest_id = :guest_id AND g.is_deleted = 0
                ORDER BY r.check_in_date DESC, r.reservation_id DESC
                LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->bindParam(":guest_id", $json['guest_id']);
        $stmt->execute();
        $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rs);
    }
}

// Request handling

$operation = '';
$json = '';
// Minimal output for CLI/browser test
if (php_sapi_name() === 'cli' || empty($_SERVER['REQUEST_METHOD'])) {
    echo json_encode(["status" => "OK", "msg" => "guests.php loaded"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';
    if (!$operation) {
        if (isset($_GET['guest_id'])) {
            $operation = 'getGuest';
            $json = json_encode(['guest_id' => $_GET['guest_id']]);
        } else {
            $operation = 'getAllGuests';
        }
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$guest = new Guest();
switch ($operation) {
    case "getAllGuests":
        $guest->getAllGuests();
        break;
    case "insertGuest":
        $guest->insertGuest($json);
        break;
    case "getGuest":
        $guest->getGuest($json);
        break;
    case "updateGuest":
        $guest->updateGuest($json);
        break;
    case "deleteGuest":
        $guest->deleteGuest($json);
        break;
    case "getGuestWithLatestReservation":
        $guest->getGuestWithLatestReservation($json);
        break;
}
