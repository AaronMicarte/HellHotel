<?php
// Test addon analytics endpoint
include_once 'api/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "<h3>Testing Addon Analytics Data</h3>";

    // Check addon categories
    $categories = $db->query("SELECT category_id, category_name FROM addoncategory WHERE is_deleted = 0")->fetchAll(PDO::FETCH_ASSOC);
    echo "<h4>Categories (" . count($categories) . "):</h4>";
    foreach ($categories as $cat) {
        echo "- {$cat['category_name']} (ID: {$cat['category_id']})<br>";
    }

    // Check addons
    $addons = $db->query("SELECT a.name, ac.category_name FROM addon a JOIN addoncategory ac ON a.category_id = ac.category_id WHERE a.is_deleted = 0")->fetchAll(PDO::FETCH_ASSOC);
    echo "<h4>Addons (" . count($addons) . "):</h4>";
    foreach ($addons as $addon) {
        echo "- {$addon['name']} ({$addon['category_name']})<br>";
    }

    // Check billing addons (sales)
    $sales = $db->query("SELECT COUNT(*) as total_sales FROM billingaddon WHERE is_deleted = 0")->fetchColumn();
    echo "<h4>Total Addon Sales: {$sales}</h4>";

    // Test the actual endpoint
    echo "<h4>Testing API Endpoint:</h4>";
    echo "<a href='/Hotel-Reservation-Billing-System/api/admin/dashboard/frontdesk_reports.php?operation=addon_analytics&category=all&from=2025-01-01&to=2025-12-31' target='_blank'>Test Addon Analytics API</a>";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
