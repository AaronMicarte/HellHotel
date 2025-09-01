<?php
class Database
{
    // Database credentials
    private $host = "localhost";
    private $db_name = "hotel_db"; // Make sure this matches your SQL schema
    private $username = "root";
    private $password = ""; // Default XAMPP password is empty
    public $conn;

    // Get the database connection
    public function getConnection()
    {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch (PDOException $e) {
            echo "Connection error: " . $e->getMessage();
        }

        return $this->conn;
    }
}
