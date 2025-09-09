<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

class FrontdeskReports
{
    function getDailyArrivalsDepartures()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $date = $_GET['date'] ?? date('Y-m-d');

        // Enhanced arrivals query with room types and revenue (fixed table names and joins)
        $arrivalsSql = "SELECT r.reservation_id, g.first_name, g.last_name, r.check_in_date, r.check_out_date, 
                       rs.reservation_status, rt.type_name as room_type_name, rm.room_number, b.total_amount,
                       DATEDIFF(r.check_out_date, r.check_in_date) as nights_stayed
                       FROM reservation r 
                       LEFT JOIN guest g ON r.guest_id = g.guest_id 
                       LEFT JOIN reservationstatus rs ON r.reservation_status_id = rs.reservation_status_id
                       LEFT JOIN reservedroom rr ON r.reservation_id = rr.reservation_id
                       LEFT JOIN room rm ON rr.room_id = rm.room_id
                       LEFT JOIN roomtype rt ON rm.room_type_id = rt.room_type_id
                       LEFT JOIN billing b ON r.reservation_id = b.reservation_id
                       WHERE r.check_in_date = :date AND r.is_deleted = 0";

        // Enhanced departures query (fixed table names and joins)
        $departuresSql = "SELECT r.reservation_id, g.first_name, g.last_name, r.check_in_date, r.check_out_date, 
                         rs.reservation_status, rt.type_name as room_type_name, rm.room_number, b.total_amount,
                         DATEDIFF(r.check_out_date, r.check_in_date) as nights_stayed
                         FROM reservation r 
                         LEFT JOIN guest g ON r.guest_id = g.guest_id 
                         LEFT JOIN reservationstatus rs ON r.reservation_status_id = rs.reservation_status_id
                         LEFT JOIN reservedroom rr ON r.reservation_id = rr.reservation_id
                         LEFT JOIN room rm ON rr.room_id = rm.room_id
                         LEFT JOIN roomtype rt ON rm.room_type_id = rt.room_type_id
                         LEFT JOIN billing b ON r.reservation_id = b.reservation_id
                         WHERE r.check_out_date = :date AND r.is_deleted = 0";

        $arrivalsStmt = $db->prepare($arrivalsSql);
        $arrivalsStmt->bindParam(':date', $date);
        $arrivalsStmt->execute();
        $arrivals = $arrivalsStmt->fetchAll(PDO::FETCH_ASSOC);

        $departuresStmt = $db->prepare($departuresSql);
        $departuresStmt->bindParam(':date', $date);
        $departuresStmt->execute();
        $departures = $departuresStmt->fetchAll(PDO::FETCH_ASSOC);

        // Analytics calculations
        $totalArrivals = count($arrivals);
        $totalDepartures = count($departures);
        $netOccupancyChange = $totalArrivals - $totalDepartures;
        $expectedRevenue = array_sum(array_column($arrivals, 'total_amount'));
        $realizedRevenue = array_sum(array_column($departures, 'total_amount'));

        echo json_encode([
            'arrivals' => $arrivals,
            'departures' => $departures,
            'date' => $date,
            'analytics' => [
                'totalArrivals' => $totalArrivals,
                'totalDepartures' => $totalDepartures,
                'netOccupancyChange' => $netOccupancyChange,
                'expectedRevenue' => is_numeric($expectedRevenue) ? $expectedRevenue : 0,
                'realizedRevenue' => is_numeric($realizedRevenue) ? $realizedRevenue : 0
            ]
        ]);
    }

    function getOccupancyStats()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        // Get total rooms first
        $totalRoomsSql = "SELECT COUNT(*) as total_rooms FROM room WHERE is_deleted = 0";
        $totalRoomsStmt = $db->prepare($totalRoomsSql);
        $totalRoomsStmt->execute();
        $totalRoomsResult = $totalRoomsStmt->fetch(PDO::FETCH_ASSOC);
        $totalRooms = $totalRoomsResult['total_rooms'];

        // Get occupied rooms (currently checked-in)
        $occupiedRoomsSql = "SELECT COUNT(DISTINCT rm.room_id) as occupied_rooms
                            FROM room rm 
                            INNER JOIN reservedroom rr ON rm.room_id = rr.room_id 
                            INNER JOIN reservation r ON rr.reservation_id = r.reservation_id 
                            INNER JOIN reservationstatus rs ON r.reservation_status_id = rs.reservation_status_id
                            WHERE rm.is_deleted = 0 
                            AND r.is_deleted = 0 
                            AND rs.reservation_status = 'checked-in'";

        $occupiedRoomsStmt = $db->prepare($occupiedRoomsSql);
        $occupiedRoomsStmt->execute();
        $occupiedResult = $occupiedRoomsStmt->fetch(PDO::FETCH_ASSOC);
        $occupiedRooms = $occupiedResult['occupied_rooms'];

        // Get reserved rooms (confirmed but not checked-in yet)
        $reservedRoomsSql = "SELECT COUNT(DISTINCT rm.room_id) as reserved_rooms
                            FROM room rm 
                            INNER JOIN reservedroom rr ON rm.room_id = rr.room_id 
                            INNER JOIN reservation r ON rr.reservation_id = r.reservation_id 
                            INNER JOIN reservationstatus rs ON r.reservation_status_id = rs.reservation_status_id
                            WHERE rm.is_deleted = 0 
                            AND r.is_deleted = 0 
                            AND rs.reservation_status = 'confirmed'";

        $reservedRoomsStmt = $db->prepare($reservedRoomsSql);
        $reservedRoomsStmt->execute();
        $reservedResult = $reservedRoomsStmt->fetch(PDO::FETCH_ASSOC);
        $reservedRooms = $reservedResult['reserved_rooms'];

        // Get maintenance rooms
        $maintenanceRoomsSql = "SELECT COUNT(*) as maintenance_rooms
                               FROM room rm 
                               INNER JOIN roomstatus rs ON rm.room_status_id = rs.room_status_id
                               WHERE rm.is_deleted = 0 
                               AND rs.room_status = 'maintenance'";

        $maintenanceStmt = $db->prepare($maintenanceRoomsSql);
        $maintenanceStmt->execute();
        $maintenanceResult = $maintenanceStmt->fetch(PDO::FETCH_ASSOC);
        $maintenanceRooms = $maintenanceResult['maintenance_rooms'];

        // Room type breakdown
        $roomTypeStatsSql = "SELECT 
                                rt.type_name as room_type_name,
                                COUNT(rm.room_id) as total_rooms_by_type,
                                COUNT(CASE WHEN rs.reservation_status = 'checked-in' THEN rm.room_id END) as occupied_by_type,
                                COUNT(CASE WHEN rs.reservation_status = 'confirmed' THEN rm.room_id END) as reserved_by_type,
                                AVG(rt.price_per_stay) as avg_room_rate
                             FROM room rm 
                             LEFT JOIN roomtype rt ON rm.room_type_id = rt.room_type_id
                             LEFT JOIN reservedroom rr ON rm.room_id = rr.room_id 
                             LEFT JOIN reservation r ON rr.reservation_id = r.reservation_id AND r.is_deleted = 0
                             LEFT JOIN reservationstatus rs ON r.reservation_status_id = rs.reservation_status_id
                             WHERE rm.is_deleted = 0
                             GROUP BY rt.room_type_id, rt.type_name";

        $roomTypeStmt = $db->prepare($roomTypeStatsSql);
        $roomTypeStmt->execute();
        $roomTypeStats = $roomTypeStmt->fetchAll(PDO::FETCH_ASSOC);

        // Build overall stats
        $overall = [
            'total_rooms' => $totalRooms,
            'occupied_rooms' => $occupiedRooms,
            'reserved_rooms' => $reservedRooms,
            'maintenance_rooms' => $maintenanceRooms
        ];

        // Calculate occupancy metrics
        $occupancyRate = $totalRooms > 0 ? ($occupiedRooms / $totalRooms) * 100 : 0;
        $availableRooms = $totalRooms - $occupiedRooms - $reservedRooms - $maintenanceRooms;

        echo json_encode([
            'overall' => $overall,
            'roomTypeBreakdown' => $roomTypeStats,
            'analytics' => [
                'occupancyRate' => round($occupancyRate, 2),
                'availableRooms' => $availableRooms,
                'utilizationScore' => round((($occupiedRooms + $reservedRooms) / $totalRooms) * 100, 2)
            ]
        ]);
    }

    function getRevenueSummary()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');

        // Enhanced revenue query with additional analytics (fixed table names)
        $sql = "SELECT 
                    SUM(b.total_amount) as total_revenue,
                    COUNT(DISTINCT b.billing_id) as total_transactions,
                    AVG(b.total_amount) as avg_transaction_value,
                    SUM(CASE WHEN DATE(b.billing_date) = CURDATE() THEN b.total_amount ELSE 0 END) as today_revenue,
                    COUNT(DISTINCT CASE WHEN DATE(b.billing_date) = CURDATE() THEN b.billing_id END) as today_transactions
                FROM billing b 
                WHERE b.billing_date BETWEEN :from AND :to";

        $stmt = $db->prepare($sql);
        $stmt->bindParam(':from', $from);
        $stmt->bindParam(':to', $to);
        $stmt->execute();
        $revenue = $stmt->fetch(PDO::FETCH_ASSOC);

        // Daily revenue trend for the period (fixed table names)
        $trendSql = "SELECT DATE(billing_date) as date, SUM(total_amount) as daily_revenue
                     FROM billing 
                     WHERE billing_date BETWEEN :from AND :to
                     GROUP BY DATE(billing_date)
                     ORDER BY DATE(billing_date)";

        $trendStmt = $db->prepare($trendSql);
        $trendStmt->bindParam(':from', $from);
        $trendStmt->bindParam(':to', $to);
        $trendStmt->execute();
        $dailyTrend = $trendStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'from' => $from,
            'to' => $to,
            'total_revenue' => $revenue['total_revenue'] ?? 0,
            'analytics' => [
                'totalTransactions' => $revenue['total_transactions'] ?? 0,
                'avgTransactionValue' => round($revenue['avg_transaction_value'] ?? 0, 2),
                'todayRevenue' => $revenue['today_revenue'] ?? 0,
                'todayTransactions' => $revenue['today_transactions'] ?? 0
            ],
            'dailyTrend' => $dailyTrend
        ]);
    }

    function getAdvancedAnalytics()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        // Peak hours analysis (fixed table names)
        $peakHoursSql = "SELECT 
                            HOUR(r.created_at) as hour,
                            COUNT(*) as bookings_count,
                            AVG(DATEDIFF(r.check_out_date, r.check_in_date)) as avg_stay_length
                         FROM reservation r
                         WHERE r.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                         AND r.is_deleted = 0
                         GROUP BY HOUR(r.created_at)
                         ORDER BY bookings_count DESC";

        $peakHoursStmt = $db->prepare($peakHoursSql);
        $peakHoursStmt->execute();
        $peakHours = $peakHoursStmt->fetchAll(PDO::FETCH_ASSOC);

        // Room type performance (fixed table names)
        $roomTypeSql = "SELECT 
                           rt.type_name,
                           COUNT(DISTINCT rr.reservation_id) as bookings,
                           AVG(rt.price_per_stay) as avg_price,
                           COALESCE(SUM(b.total_amount), 0) as total_revenue
                        FROM roomtype rt
                        LEFT JOIN room r ON rt.room_type_id = r.room_type_id
                        LEFT JOIN reservedroom rr ON r.room_id = rr.room_id
                        LEFT JOIN reservation res ON rr.reservation_id = res.reservation_id
                        LEFT JOIN billing b ON res.reservation_id = b.reservation_id
                        WHERE res.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                        AND res.is_deleted = 0
                        GROUP BY rt.room_type_id, rt.type_name
                        HAVING total_revenue > 0";

        $roomTypeStmt = $db->prepare($roomTypeSql);
        $roomTypeStmt->execute();
        $roomTypePerformance = $roomTypeStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'peakHours' => $peakHours,
            'roomTypePerformance' => $roomTypePerformance,
            'generatedAt' => date('Y-m-d H:i:s')
        ]);
    }

    function getChartData()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $chartType = $_GET['chart_type'] ?? 'overview';

        switch ($chartType) {
            case 'weekly_occupancy':
                $sql = "SELECT 
                           DATE(created_at) as date,
                           COUNT(DISTINCT reservation_id) as bookings
                        FROM reservation 
                        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                        AND is_deleted = 0
                        GROUP BY DATE(created_at)
                        ORDER BY date";
                break;

            case 'monthly_revenue':
                $sql = "SELECT 
                           DATE(billing_date) as date,
                           SUM(total_amount) as revenue
                        FROM billing 
                        WHERE billing_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                        GROUP BY DATE(billing_date)
                        ORDER BY date";
                break;

            default:
                echo json_encode(['error' => 'Invalid chart type']);
                return;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'chart_type' => $chartType,
            'data' => $data,
            'generated_at' => date('Y-m-d H:i:s')
        ]);
    }

    function getAddonAnalytics()
    {
        include_once '../../config/database.php';
        $database = new Database();
        $db = $database->getConnection();

        $category_filter = $_GET['category'] ?? 'all';
        $from = $_GET['from'] ?? date('Y-m-01');
        $to = $_GET['to'] ?? date('Y-m-d');

        // Get addon categories
        $categorySql = "SELECT category_id, category_name 
                        FROM addoncategory 
                        WHERE is_deleted = 0 
                        ORDER BY category_name";
        $categoryStmt = $db->prepare($categorySql);
        $categoryStmt->execute();
        $categories = $categoryStmt->fetchAll(PDO::FETCH_ASSOC);

        // Build category filter condition
        $categoryCondition = "";
        $params = [':from' => $from, ':to' => $to];

        if ($category_filter !== 'all' && is_numeric($category_filter)) {
            $categoryCondition = " AND a.category_id = :category_id";
            $params[':category_id'] = $category_filter;
        }

        // Top selling addons with revenue
        $topAddonsSql = "SELECT 
                            a.name as addon_name,
                            ac.category_name,
                            COUNT(ba.billing_addon_id) as times_ordered,
                            SUM(ba.quantity) as total_quantity,
                            SUM(ba.unit_price * ba.quantity) as total_revenue,
                            AVG(ba.unit_price) as avg_price,
                            a.price as current_price
                         FROM billingaddon ba
                         INNER JOIN addon a ON ba.addon_id = a.addon_id
                         INNER JOIN addoncategory ac ON a.category_id = ac.category_id
                         INNER JOIN billing b ON ba.billing_id = b.billing_id
                         WHERE b.billing_date BETWEEN :from AND :to
                         AND ba.is_deleted = 0 
                         AND a.is_deleted = 0 
                         AND ac.is_deleted = 0" . $categoryCondition . "
                         GROUP BY a.addon_id, a.name, ac.category_name
                         ORDER BY total_revenue DESC
                         LIMIT 10";

        $topAddonsStmt = $db->prepare($topAddonsSql);
        $topAddonsStmt->execute($params);
        $topAddons = $topAddonsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Addon sales by category
        $categorySalesSql = "SELECT 
                                ac.category_name,
                                ac.category_id,
                                COUNT(DISTINCT a.addon_id) as unique_addons,
                                COUNT(ba.billing_addon_id) as total_orders,
                                SUM(ba.quantity) as total_quantity,
                                SUM(ba.unit_price * ba.quantity) as category_revenue,
                                AVG(ba.unit_price) as avg_price_per_item
                             FROM addoncategory ac
                             LEFT JOIN addon a ON ac.category_id = a.category_id AND a.is_deleted = 0
                             LEFT JOIN billingaddon ba ON a.addon_id = ba.addon_id AND ba.is_deleted = 0
                             LEFT JOIN billing b ON ba.billing_id = b.billing_id
                             WHERE ac.is_deleted = 0
                             AND (b.billing_date IS NULL OR b.billing_date BETWEEN :from AND :to)" .
            ($category_filter !== 'all' && is_numeric($category_filter) ? " AND ac.category_id = :category_id" : "") . "
                             GROUP BY ac.category_id, ac.category_name
                             ORDER BY category_revenue DESC";

        $categorySalesStmt = $db->prepare($categorySalesSql);
        $categorySalesStmt->execute($params);
        $categorySales = $categorySalesStmt->fetchAll(PDO::FETCH_ASSOC);

        // Daily addon sales trend
        $dailyTrendSql = "SELECT 
                             DATE(b.billing_date) as sale_date,
                             COUNT(ba.billing_addon_id) as daily_orders,
                             SUM(ba.quantity) as daily_quantity,
                             SUM(ba.unit_price * ba.quantity) as daily_revenue
                          FROM billing b
                          INNER JOIN billingaddon ba ON b.billing_id = ba.billing_id
                          INNER JOIN addon a ON ba.addon_id = a.addon_id
                          WHERE b.billing_date BETWEEN :from AND :to
                          AND ba.is_deleted = 0 
                          AND a.is_deleted = 0" . $categoryCondition . "
                          GROUP BY DATE(b.billing_date)
                          ORDER BY sale_date";

        $dailyTrendStmt = $db->prepare($dailyTrendSql);
        $dailyTrendStmt->execute($params);
        $dailyTrend = $dailyTrendStmt->fetchAll(PDO::FETCH_ASSOC);

        // Overall statistics
        $overallStatsSql = "SELECT 
                               COUNT(DISTINCT a.addon_id) as total_unique_addons,
                               COUNT(ba.billing_addon_id) as total_addon_orders,
                               SUM(ba.quantity) as total_items_sold,
                               SUM(ba.unit_price * ba.quantity) as total_addon_revenue,
                               AVG(ba.unit_price * ba.quantity) as avg_order_value
                            FROM billingaddon ba
                            INNER JOIN addon a ON ba.addon_id = a.addon_id
                            INNER JOIN billing b ON ba.billing_id = b.billing_id
                            WHERE b.billing_date BETWEEN :from AND :to
                            AND ba.is_deleted = 0 
                            AND a.is_deleted = 0" . $categoryCondition;

        $overallStatsStmt = $db->prepare($overallStatsSql);
        $overallStatsStmt->execute($params);
        $overallStats = $overallStatsStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'from' => $from,
            'to' => $to,
            'category_filter' => $category_filter,
            'categories' => $categories,
            'topAddons' => $topAddons,
            'categorySales' => $categorySales,
            'dailyTrend' => $dailyTrend,
            'overallStats' => [
                'totalUniqueAddons' => $overallStats['total_unique_addons'] ?? 0,
                'totalAddonOrders' => $overallStats['total_addon_orders'] ?? 0,
                'totalItemsSold' => $overallStats['total_items_sold'] ?? 0,
                'totalAddonRevenue' => $overallStats['total_addon_revenue'] ?? 0,
                'avgOrderValue' => round($overallStats['avg_order_value'] ?? 0, 2)
            ]
        ]);
    }
}

// Request handling
$operation = '';
$json = '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $operation = isset($_GET['operation']) ? $_GET['operation'] : '';
    $json = isset($_GET['json']) ? $_GET['json'] : '';
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $operation = isset($_POST['operation']) ? $_POST['operation'] : '';
    $json = isset($_POST['json']) ? $_POST['json'] : '';
}

$reports = new FrontdeskReports();
switch ($operation) {
    case "daily_arrivals_departures":
        $reports->getDailyArrivalsDepartures();
        break;
    case "occupancy_stats":
        $reports->getOccupancyStats();
        break;
    case "revenue_summary":
        $reports->getRevenueSummary();
        break;
    case "advanced_analytics":
        $reports->getAdvancedAnalytics();
        break;
    case "addon_analytics":
        $reports->getAddonAnalytics();
        break;
    case "chart_data":
        $reports->getChartData();
        break;
    default:
        echo json_encode(['error' => 'Invalid operation']);
        break;
}
