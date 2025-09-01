-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 21, 2025 at 02:21 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hotel_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `addon`
--

CREATE TABLE `addon` (
  `addon_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addon`
--

INSERT INTO `addon` (`addon_id`, `category_id`, `name`, `is_available`, `price`, `image_url`, `created_at`, `updated_at`, `is_deleted`) VALUES
(4, 1, 'Tae', 1, 31.00, NULL, '2025-08-05 20:59:31', '2025-08-05 21:04:21', 1),
(5, NULL, NULL, 1, NULL, NULL, '2025-08-05 20:59:50', '2025-08-07 13:00:30', 1),
(12, 3, 'Redhorse', 1, 135.10, 'addon_68a337ca709418.36736380.png', '2025-08-05 22:46:47', '2025-08-20 21:07:13', 0),
(13, 3, 'Tanduay Junior', 1, 65.00, 'addon_68a33a108980f3.96420172.gif', '2025-08-05 22:47:52', '2025-08-18 22:34:56', 0),
(14, 2, 'Towel', 1, 55.00, 'addon_68a33a24a05200.05830617.png', '2025-08-05 22:49:41', '2025-08-18 22:35:16', 0),
(15, 2, 'Sabon', 1, 20.00, 'addon_68a33a2d00afe0.98892389.png', '2025-08-05 22:50:19', '2025-08-18 22:35:25', 0),
(16, NULL, NULL, 1, NULL, NULL, '2025-08-05 22:51:43', '2025-08-07 13:50:18', 1),
(17, NULL, NULL, 0, NULL, NULL, '2025-08-05 22:53:29', '2025-08-07 13:50:22', 1),
(18, NULL, NULL, 1, NULL, NULL, '2025-08-05 22:55:57', '2025-08-07 14:45:37', 1),
(19, NULL, NULL, 1, NULL, NULL, '2025-08-07 14:38:23', '2025-08-07 14:45:41', 1),
(20, 4, 'Rebisco', 1, 10.00, 'addon_68a33a3482bb07.23035261.png', '2025-08-10 12:56:01', '2025-08-18 22:35:32', 0),
(21, 1, 'Humba', 1, 69.69, 'addon_68a498a13b2bd0.36514573.jpg', '2025-08-19 23:30:41', '2025-08-19 23:30:41', 0),
(22, 3, 'tet', 1, 123.00, 'addon_68a5c9df57b9e9.39025260.jpg', '2025-08-20 21:13:03', '2025-08-20 21:13:03', 0);

-- --------------------------------------------------------

--
-- Table structure for table `addoncategory`
--

CREATE TABLE `addoncategory` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addoncategory`
--

INSERT INTO `addoncategory` (`category_id`, `category_name`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 'Food', '2025-08-05 20:45:18', '2025-08-05 20:45:18', 0),
(2, 'Toiletries', '2025-08-05 20:45:18', '2025-08-05 20:45:18', 0),
(3, 'Beverage', '2025-08-05 21:56:42', '2025-08-10 12:47:21', 0),
(4, 'Snacks', '2025-08-07 14:37:51', '2025-08-07 14:37:51', 0),
(5, 'hh', '2025-08-10 12:47:29', '2025-08-10 12:47:46', 1),
(6, 'ee', '2025-08-10 12:47:40', '2025-08-10 12:47:43', 1),
(7, 'e', '2025-08-10 12:47:52', '2025-08-10 12:47:55', 1),
(8, 'te', '2025-08-10 12:56:52', '2025-08-14 23:10:12', 1),
(9, 'tae', '2025-08-12 23:51:41', '2025-08-14 23:10:10', 1);

-- --------------------------------------------------------

--
-- Table structure for table `addonorder`
--

CREATE TABLE `addonorder` (
  `addon_order_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `order_status_id` int(11) DEFAULT NULL,
  `order_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `addonorderitem`
--

CREATE TABLE `addonorderitem` (
  `order_item_id` int(11) NOT NULL,
  `addon_order_id` int(11) DEFAULT NULL,
  `addon_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `addonorderstatus`
--

CREATE TABLE `addonorderstatus` (
  `order_status_id` int(11) NOT NULL,
  `order_status_name` enum('pending','processing','delivered','cancelled') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billing`
--

CREATE TABLE `billing` (
  `billing_id` int(11) NOT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `billing_status_id` int(11) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `billing_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `billing`
--

INSERT INTO `billing` (`billing_id`, `reservation_id`, `billing_status_id`, `total_amount`, `billing_date`, `created_at`, `updated_at`, `is_deleted`) VALUES
(10, 34, 1, 199.00, '2025-08-21', '2025-08-19 00:16:47', '2025-08-19 00:16:47', 0),
(11, 35, 3, 199.00, '2025-08-21', '2025-08-19 14:01:01', '2025-08-21 15:50:39', 0),
(12, 36, 2, 199.00, '2025-08-20', '2025-08-19 22:44:40', '2025-08-20 23:26:14', 0);

-- --------------------------------------------------------

--
-- Table structure for table `billingaddon`
--

CREATE TABLE `billingaddon` (
  `billing_addon_id` int(11) NOT NULL,
  `addon_id` int(11) DEFAULT NULL,
  `billing_id` int(11) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billingstatus`
--

CREATE TABLE `billingstatus` (
  `billing_status_id` int(11) NOT NULL,
  `billing_status` enum('unpaid','paid','partial','overdue') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `billingstatus`
--

INSERT INTO `billingstatus` (`billing_status_id`, `billing_status`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 'unpaid', '2025-08-14 15:12:09', '2025-08-14 15:12:09', 0),
(2, 'paid', '2025-08-14 15:12:10', '2025-08-14 15:12:10', 0),
(3, 'partial', '2025-08-14 15:12:10', '2025-08-14 15:12:10', 0),
(4, 'overdue', '2025-08-14 15:12:10', '2025-08-14 15:12:10', 0);

-- --------------------------------------------------------

--
-- Table structure for table `feature`
--

CREATE TABLE `feature` (
  `feature_id` int(11) NOT NULL,
  `feature_name` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `feature`
--

INSERT INTO `feature` (`feature_id`, `feature_name`, `created_at`, `updated_at`, `is_deleted`) VALUES
(11, 'NETFLIX', '2025-08-18 01:17:50', '2025-08-18 11:28:59', 1),
(12, 'Wifi', '2025-08-18 11:29:28', '2025-08-18 11:43:19', 1),
(13, 'Netflix', '2025-08-18 11:43:02', '2025-08-18 11:44:25', 1),
(14, 'Netflix', '2025-08-18 11:49:46', '2025-08-18 12:24:44', 1),
(15, 'Netflix', '2025-08-18 13:02:50', '2025-08-18 13:02:50', 0),
(16, 'Wifi', '2025-08-18 23:21:08', '2025-08-18 23:55:22', 1),
(17, 'Popcorn', '2025-08-18 23:21:33', '2025-08-18 23:21:33', 0),
(18, 'Junkfood', '2025-08-18 23:21:43', '2025-08-18 23:21:43', 0);

-- --------------------------------------------------------

--
-- Table structure for table `guest`
--

CREATE TABLE `guest` (
  `guest_id` int(11) NOT NULL,
  `guest_idtype_id` int(11) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `id_number` varchar(100) DEFAULT NULL,
  `id_picture` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `guest`
--

INSERT INTO `guest` (`guest_id`, `guest_idtype_id`, `last_name`, `first_name`, `middle_name`, `suffix`, `date_of_birth`, `email`, `phone_number`, `id_number`, `id_picture`, `created_at`, `updated_at`, `is_deleted`) VALUES
(13, 12, 'Micarte', 'Aaron', 'Yano', '', '2005-04-08', 'micarte2005@gmail.com', '09925077173', '02-2122-034040', '/assets/images/uploads/id-pictures/idpic_689d5f20280996.10444889.png', '2025-08-14 00:28:26', '2025-08-14 11:59:28', 0),
(14, 12, 'Micarte', 'Tyron Buang Hahaa', 'Yano', '', '2010-01-04', 'ronelomicarte@gmail.com', '09551280440', '127676100140', '/assets/images/uploads/id-pictures/idpic_689d5f28241ee5.84414180.jpg', '2025-08-14 11:57:44', '2025-08-14 12:07:29', 1),
(15, 12, 'Micarte', 'Tyron', 'Yano', '', '2010-01-04', 'ronelomicarte@gmail.com', '09551280440', '127676100140', '/assets/images/uploads/id-pictures/idpic_689d614a4b1a63.32717134.jpeg', '2025-08-14 12:08:42', '2025-08-14 12:13:38', 1),
(16, 12, 'Micarte', 'Tyron', 'Yano', '', '2010-01-04', 'ronelomicarte@gmail.com', '09551280440', '127676100140', '/assets/images/uploads/id-pictures/idpic_689d615424d6d0.46139162.jpeg', '2025-08-14 12:08:52', '2025-08-14 12:08:52', 0),
(17, 12, 'Micarte', 'Cyron', 'Yano', '', '2010-01-04', 'ronelomicarte@gmail.com', '09551280440', '127676100140', '/assets/images/uploads/id-pictures/idpic_689d615e1aeaa7.92634763.jpeg', '2025-08-14 12:09:02', '2025-08-14 12:13:36', 1),
(18, 12, 'Jangao', 'Warren John', 'Pogi', '', '2004-07-27', 'waab.jangao.coc@phinmaed.com', '09551280440', '02-2324-021262', '/assets/images/uploads/id-pictures/idpic_689d62e37a42f0.39769839.png', '2025-08-14 12:15:31', '2025-08-14 12:16:58', 0),
(19, 12, 'qq', 'qq', 'qq', '', '2025-08-12', 'qq', '09925077173', '123456789', '/assets/images/uploads/id-pictures/idpic_68a180a764eb20.22487282.png', '2025-08-17 15:11:35', '2025-08-17 15:11:35', 0);

-- --------------------------------------------------------

--
-- Table structure for table `guestidtype`
--

CREATE TABLE `guestidtype` (
  `guest_idtype_id` int(11) NOT NULL,
  `id_type` enum('Passport','Driver''s License','SSS ID','GSIS ID','PRC ID','Voter''s ID','Postal ID','PhilHealth ID','TIN ID','UMID','Barangay ID','Student ID') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `guestidtype`
--

INSERT INTO `guestidtype` (`guest_idtype_id`, `id_type`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 'Passport', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(2, 'Driver\'s License', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(3, 'SSS ID', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(4, 'GSIS ID', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(5, 'PRC ID', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(6, 'Voter\'s ID', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(7, 'Postal ID', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(8, 'PhilHealth ID', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(9, 'TIN ID', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(10, 'UMID', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(11, 'Barangay ID', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0),
(12, 'Student ID', '2025-08-13 22:27:42', '2025-08-13 22:27:42', 0);

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `payment_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `billing_id` int(11) DEFAULT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `sub_method_id` int(11) DEFAULT NULL,
  `amount_paid` decimal(10,2) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`payment_id`, `user_id`, `billing_id`, `reservation_id`, `sub_method_id`, `amount_paid`, `payment_date`, `notes`, `created_at`, `updated_at`, `is_deleted`) VALUES
(16, 2, 12, 36, 6, 99.00, '2025-08-20', 'pp', '2025-08-20 23:12:26', '2025-08-20 23:12:26', 0),
(17, 7, 12, 36, 6, 100.00, '2025-08-20', 'done', '2025-08-20 23:26:03', '2025-08-20 23:26:03', 0),
(18, 2, 11, 35, 6, 99.00, '2025-08-21', 'PP', '2025-08-21 15:50:38', '2025-08-21 15:50:38', 0);

-- --------------------------------------------------------

--
-- Table structure for table `paymentsubmethod`
--

CREATE TABLE `paymentsubmethod` (
  `sub_method_id` int(11) NOT NULL,
  `payment_category_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `paymentsubmethod`
--

INSERT INTO `paymentsubmethod` (`sub_method_id`, `payment_category_id`, `name`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 1, 'GCash', '2025-08-14 16:35:36', '2025-08-14 16:35:36', 0),
(2, 1, 'PayMaya', '2025-08-14 16:35:36', '2025-08-14 16:35:36', 0),
(3, 2, 'BPI', '2025-08-14 16:35:36', '2025-08-14 16:35:36', 0),
(4, 2, 'BDO', '2025-08-14 16:35:36', '2025-08-14 16:35:36', 0),
(5, 3, 'Visa', '2025-08-14 16:35:36', '2025-08-14 16:35:36', 0),
(6, 4, 'Cash', '2025-08-14 16:35:36', '2025-08-14 16:35:36', 0);

-- --------------------------------------------------------

--
-- Table structure for table `paymentsubmethodcategory`
--

CREATE TABLE `paymentsubmethodcategory` (
  `payment_category_id` int(11) NOT NULL,
  `name` enum('e-wallet','bank','credit card','cash') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `paymentsubmethodcategory`
--

INSERT INTO `paymentsubmethodcategory` (`payment_category_id`, `name`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 'e-wallet', '2025-08-14 16:35:36', '2025-08-14 16:35:36', 0),
(2, 'bank', '2025-08-14 16:35:36', '2025-08-14 16:35:36', 0),
(3, 'credit card', '2025-08-14 16:35:36', '2025-08-14 16:35:36', 0),
(4, 'cash', '2025-08-14 16:35:36', '2025-08-14 16:36:50', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reservation`
--

CREATE TABLE `reservation` (
  `reservation_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `reservation_status_id` int(11) DEFAULT NULL,
  `guest_id` int(11) DEFAULT NULL,
  `check_in_date` date DEFAULT NULL,
  `check_in_time` time DEFAULT NULL,
  `check_out_date` date DEFAULT NULL,
  `check_out_time` time DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservation`
--

INSERT INTO `reservation` (`reservation_id`, `user_id`, `reservation_status_id`, `guest_id`, `check_in_date`, `check_in_time`, `check_out_date`, `check_out_time`, `created_at`, `updated_at`, `is_deleted`) VALUES
(34, NULL, 1, 18, '2025-08-20', '14:00:00', '2025-08-21', '14:00:00', '2025-08-19 00:16:46', '2025-08-19 14:43:32', 0),
(35, NULL, 3, 13, '2025-08-20', '14:00:00', '2025-08-21', '14:00:00', '2025-08-19 14:00:57', '2025-08-19 14:00:57', 0),
(36, NULL, 3, 16, '2025-08-19', '22:44:00', '2025-08-20', '22:44:00', '2025-08-19 22:44:39', '2025-08-20 00:41:18', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reservationstatus`
--

CREATE TABLE `reservationstatus` (
  `reservation_status_id` int(11) NOT NULL,
  `reservation_status` enum('pending','confirmed','checked-in','checked-out','cancelled') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservationstatus`
--

INSERT INTO `reservationstatus` (`reservation_status_id`, `reservation_status`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 'pending', '2025-08-13 00:01:31', '2025-08-13 00:01:31', 0),
(2, 'confirmed', '2025-08-13 00:01:31', '2025-08-13 00:01:31', 0),
(3, 'checked-in', '2025-08-13 00:01:31', '2025-08-13 00:01:31', 0),
(4, 'checked-out', '2025-08-13 00:01:31', '2025-08-13 00:01:31', 0),
(5, 'cancelled', '2025-08-13 00:01:31', '2025-08-13 00:01:31', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reservedroom`
--

CREATE TABLE `reservedroom` (
  `reserved_room_id` int(11) NOT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservedroom`
--

INSERT INTO `reservedroom` (`reserved_room_id`, `reservation_id`, `room_id`, `created_at`, `updated_at`, `is_deleted`) VALUES
(34, 34, 20, '2025-08-19 00:16:46', '2025-08-19 00:16:46', 0),
(35, 35, 21, '2025-08-19 14:01:00', '2025-08-19 14:01:00', 0),
(36, 36, 20, '2025-08-19 22:44:39', '2025-08-19 22:44:39', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reservedroomcompanion`
--

CREATE TABLE `reservedroomcompanion` (
  `companion_id` int(11) NOT NULL,
  `reserved_room_id` int(11) DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room`
--

CREATE TABLE `room` (
  `room_id` int(11) NOT NULL,
  `room_status_id` int(11) DEFAULT NULL,
  `room_type_id` int(11) DEFAULT NULL,
  `room_number` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room`
--

INSERT INTO `room` (`room_id`, `room_status_id`, `room_type_id`, `room_number`, `created_at`, `updated_at`, `is_deleted`) VALUES
(20, 2, 24, '101', '2025-08-18 22:53:34', '2025-08-21 18:11:26', 0),
(21, 2, 24, '102', '2025-08-18 23:52:29', '2025-08-21 18:11:30', 0),
(22, 1, 25, '201', '2025-08-18 23:53:00', '2025-08-18 23:53:00', 0),
(23, 1, 24, '103', '2025-08-20 23:38:42', '2025-08-20 23:38:42', 0);

-- --------------------------------------------------------

--
-- Table structure for table `roomimage`
--

CREATE TABLE `roomimage` (
  `room_image_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roomstatus`
--

CREATE TABLE `roomstatus` (
  `room_status_id` int(11) NOT NULL,
  `room_status` enum('available','occupied','maintenance','reserved') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roomstatus`
--

INSERT INTO `roomstatus` (`room_status_id`, `room_status`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 'available', '2025-08-05 00:33:22', '2025-08-05 00:33:22', 0),
(2, 'occupied', '2025-08-05 00:33:22', '2025-08-05 00:33:22', 0),
(3, 'maintenance', '2025-08-05 00:33:22', '2025-08-05 00:33:22', 0),
(4, 'reserved', '2025-08-05 00:33:22', '2025-08-05 00:33:22', 0);

-- --------------------------------------------------------

--
-- Table structure for table `roomtype`
--

CREATE TABLE `roomtype` (
  `room_type_id` int(11) NOT NULL,
  `type_name` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `room_size_sqm` decimal(5,2) DEFAULT NULL,
  `max_capacity` int(11) DEFAULT NULL,
  `price_per_stay` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roomtype`
--

INSERT INTO `roomtype` (`room_type_id`, `type_name`, `description`, `room_size_sqm`, `max_capacity`, `price_per_stay`, `image_url`, `created_at`, `updated_at`, `is_deleted`) VALUES
(24, 'Regular', 'A comfortable and well-appointed guest room featuring essential amenities, modern furnishings, and a relaxing ambiance—ideal for both business and leisure travelers seeking quality and value.', 35.00, 2, 199.00, 'roomtype_68a6e43c423202.80121254.jpg', '2025-08-18 11:42:50', '2025-08-21 17:32:36', 0),
(25, 'Executive', 'An upgraded, spacious accommodation offering premium amenities, enhanced comfort, and exclusive privileges—perfect for guests who desire a higher level of luxury, convenience, and personalized service.', 77.00, 12, 299.00, 'roomtype_68a6e474f3d340.55789272.jpg', '2025-08-18 11:44:18', '2025-08-21 17:32:49', 0);

-- --------------------------------------------------------

--
-- Table structure for table `roomtypefeature`
--

CREATE TABLE `roomtypefeature` (
  `room_type_id` int(11) NOT NULL,
  `feature_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roomtypefeature`
--

INSERT INTO `roomtypefeature` (`room_type_id`, `feature_id`) VALUES
(24, 15),
(24, 17),
(25, 15),
(25, 18);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `user_roles_id` int(11) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `new_password` varchar(255) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `user_roles_id`, `username`, `password`, `new_password`, `email`, `created_at`, `updated_at`, `is_deleted`) VALUES
(2, 1, 'qq', '$2y$10$VpvjztThNS1sFqHHtroAiuN9bq/WYdturFlMQ0DkMHlBmdCff.ji6', '', 'admin@xmail.com', '2025-08-06 21:23:14', '2025-08-06 22:33:07', 0),
(7, 2, 'hh', '$2y$10$iOm1WHwno8wcHSyshpvkdua3HxfHhFOk/muveFGP4ybhr89jE7dMO', '', 'hh@hehe.com', '2025-08-20 00:27:21', '2025-08-20 22:42:04', 0);

-- --------------------------------------------------------

--
-- Table structure for table `userroles`
--

CREATE TABLE `userroles` (
  `user_roles_id` int(11) NOT NULL,
  `role_type` enum('admin','front desk') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `userroles`
--

INSERT INTO `userroles` (`user_roles_id`, `role_type`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 'admin', '2025-08-04 23:40:40', '2025-08-04 23:40:40', 0),
(2, 'front desk', '2025-08-04 23:40:52', '2025-08-04 23:40:52', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addon`
--
ALTER TABLE `addon`
  ADD PRIMARY KEY (`addon_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `addoncategory`
--
ALTER TABLE `addoncategory`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `addonorder`
--
ALTER TABLE `addonorder`
  ADD PRIMARY KEY (`addon_order_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `order_status_id` (`order_status_id`);

--
-- Indexes for table `addonorderitem`
--
ALTER TABLE `addonorderitem`
  ADD PRIMARY KEY (`order_item_id`),
  ADD KEY `addon_order_id` (`addon_order_id`),
  ADD KEY `addon_id` (`addon_id`);

--
-- Indexes for table `addonorderstatus`
--
ALTER TABLE `addonorderstatus`
  ADD PRIMARY KEY (`order_status_id`);

--
-- Indexes for table `billing`
--
ALTER TABLE `billing`
  ADD PRIMARY KEY (`billing_id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `billing_status_id` (`billing_status_id`);

--
-- Indexes for table `billingaddon`
--
ALTER TABLE `billingaddon`
  ADD PRIMARY KEY (`billing_addon_id`),
  ADD KEY `addon_id` (`addon_id`),
  ADD KEY `billing_id` (`billing_id`);

--
-- Indexes for table `billingstatus`
--
ALTER TABLE `billingstatus`
  ADD PRIMARY KEY (`billing_status_id`);

--
-- Indexes for table `feature`
--
ALTER TABLE `feature`
  ADD PRIMARY KEY (`feature_id`);

--
-- Indexes for table `guest`
--
ALTER TABLE `guest`
  ADD PRIMARY KEY (`guest_id`),
  ADD KEY `guest_idtype_id` (`guest_idtype_id`);

--
-- Indexes for table `guestidtype`
--
ALTER TABLE `guestidtype`
  ADD PRIMARY KEY (`guest_idtype_id`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `billing_id` (`billing_id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `sub_method_id` (`sub_method_id`);

--
-- Indexes for table `paymentsubmethod`
--
ALTER TABLE `paymentsubmethod`
  ADD PRIMARY KEY (`sub_method_id`),
  ADD KEY `payment_category_id` (`payment_category_id`);

--
-- Indexes for table `paymentsubmethodcategory`
--
ALTER TABLE `paymentsubmethodcategory`
  ADD PRIMARY KEY (`payment_category_id`);

--
-- Indexes for table `reservation`
--
ALTER TABLE `reservation`
  ADD PRIMARY KEY (`reservation_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reservation_status_id` (`reservation_status_id`),
  ADD KEY `guest_id` (`guest_id`);

--
-- Indexes for table `reservationstatus`
--
ALTER TABLE `reservationstatus`
  ADD PRIMARY KEY (`reservation_status_id`);

--
-- Indexes for table `reservedroom`
--
ALTER TABLE `reservedroom`
  ADD PRIMARY KEY (`reserved_room_id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `reservedroomcompanion`
--
ALTER TABLE `reservedroomcompanion`
  ADD PRIMARY KEY (`companion_id`),
  ADD KEY `reserved_room_id` (`reserved_room_id`);

--
-- Indexes for table `room`
--
ALTER TABLE `room`
  ADD PRIMARY KEY (`room_id`),
  ADD KEY `room_status_id` (`room_status_id`),
  ADD KEY `room_type_id` (`room_type_id`);

--
-- Indexes for table `roomimage`
--
ALTER TABLE `roomimage`
  ADD PRIMARY KEY (`room_image_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `roomstatus`
--
ALTER TABLE `roomstatus`
  ADD PRIMARY KEY (`room_status_id`);

--
-- Indexes for table `roomtype`
--
ALTER TABLE `roomtype`
  ADD PRIMARY KEY (`room_type_id`);

--
-- Indexes for table `roomtypefeature`
--
ALTER TABLE `roomtypefeature`
  ADD PRIMARY KEY (`room_type_id`,`feature_id`),
  ADD KEY `feature_id` (`feature_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `userroles`
--
ALTER TABLE `userroles`
  ADD PRIMARY KEY (`user_roles_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addon`
--
ALTER TABLE `addon`
  MODIFY `addon_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `addoncategory`
--
ALTER TABLE `addoncategory`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `addonorder`
--
ALTER TABLE `addonorder`
  MODIFY `addon_order_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `addonorderitem`
--
ALTER TABLE `addonorderitem`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `addonorderstatus`
--
ALTER TABLE `addonorderstatus`
  MODIFY `order_status_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `billing`
--
ALTER TABLE `billing`
  MODIFY `billing_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `billingaddon`
--
ALTER TABLE `billingaddon`
  MODIFY `billing_addon_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `billingstatus`
--
ALTER TABLE `billingstatus`
  MODIFY `billing_status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `feature`
--
ALTER TABLE `feature`
  MODIFY `feature_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `guest`
--
ALTER TABLE `guest`
  MODIFY `guest_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `guestidtype`
--
ALTER TABLE `guestidtype`
  MODIFY `guest_idtype_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `paymentsubmethod`
--
ALTER TABLE `paymentsubmethod`
  MODIFY `sub_method_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `paymentsubmethodcategory`
--
ALTER TABLE `paymentsubmethodcategory`
  MODIFY `payment_category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reservation`
--
ALTER TABLE `reservation`
  MODIFY `reservation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `reservationstatus`
--
ALTER TABLE `reservationstatus`
  MODIFY `reservation_status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `reservedroom`
--
ALTER TABLE `reservedroom`
  MODIFY `reserved_room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `reservedroomcompanion`
--
ALTER TABLE `reservedroomcompanion`
  MODIFY `companion_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `room`
--
ALTER TABLE `room`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `roomimage`
--
ALTER TABLE `roomimage`
  MODIFY `room_image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `roomstatus`
--
ALTER TABLE `roomstatus`
  MODIFY `room_status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `roomtype`
--
ALTER TABLE `roomtype`
  MODIFY `room_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `userroles`
--
ALTER TABLE `userroles`
  MODIFY `user_roles_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `addon`
--
ALTER TABLE `addon`
  ADD CONSTRAINT `addon_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `addoncategory` (`category_id`);

--
-- Constraints for table `addonorder`
--
ALTER TABLE `addonorder`
  ADD CONSTRAINT `addonorder_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `addonorder_ibfk_2` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`reservation_id`),
  ADD CONSTRAINT `addonorder_ibfk_3` FOREIGN KEY (`order_status_id`) REFERENCES `addonorderstatus` (`order_status_id`);

--
-- Constraints for table `addonorderitem`
--
ALTER TABLE `addonorderitem`
  ADD CONSTRAINT `addonorderitem_ibfk_1` FOREIGN KEY (`addon_order_id`) REFERENCES `addonorder` (`addon_order_id`),
  ADD CONSTRAINT `addonorderitem_ibfk_2` FOREIGN KEY (`addon_id`) REFERENCES `addon` (`addon_id`);

--
-- Constraints for table `billing`
--
ALTER TABLE `billing`
  ADD CONSTRAINT `billing_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`reservation_id`),
  ADD CONSTRAINT `billing_ibfk_2` FOREIGN KEY (`billing_status_id`) REFERENCES `billingstatus` (`billing_status_id`);

--
-- Constraints for table `billingaddon`
--
ALTER TABLE `billingaddon`
  ADD CONSTRAINT `billingaddon_ibfk_1` FOREIGN KEY (`addon_id`) REFERENCES `addon` (`addon_id`),
  ADD CONSTRAINT `billingaddon_ibfk_2` FOREIGN KEY (`billing_id`) REFERENCES `billing` (`billing_id`);

--
-- Constraints for table `guest`
--
ALTER TABLE `guest`
  ADD CONSTRAINT `guest_ibfk_1` FOREIGN KEY (`guest_idtype_id`) REFERENCES `guestidtype` (`guest_idtype_id`);

--
-- Constraints for table `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `payment_ibfk_2` FOREIGN KEY (`billing_id`) REFERENCES `billing` (`billing_id`),
  ADD CONSTRAINT `payment_ibfk_3` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`reservation_id`),
  ADD CONSTRAINT `payment_ibfk_4` FOREIGN KEY (`sub_method_id`) REFERENCES `paymentsubmethod` (`sub_method_id`);

--
-- Constraints for table `paymentsubmethod`
--
ALTER TABLE `paymentsubmethod`
  ADD CONSTRAINT `paymentsubmethod_ibfk_1` FOREIGN KEY (`payment_category_id`) REFERENCES `paymentsubmethodcategory` (`payment_category_id`);

--
-- Constraints for table `reservation`
--
ALTER TABLE `reservation`
  ADD CONSTRAINT `reservation_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `reservation_ibfk_2` FOREIGN KEY (`reservation_status_id`) REFERENCES `reservationstatus` (`reservation_status_id`),
  ADD CONSTRAINT `reservation_ibfk_3` FOREIGN KEY (`guest_id`) REFERENCES `guest` (`guest_id`);

--
-- Constraints for table `reservedroom`
--
ALTER TABLE `reservedroom`
  ADD CONSTRAINT `reservedroom_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`reservation_id`),
  ADD CONSTRAINT `reservedroom_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`);

--
-- Constraints for table `reservedroomcompanion`
--
ALTER TABLE `reservedroomcompanion`
  ADD CONSTRAINT `reservedroomcompanion_ibfk_1` FOREIGN KEY (`reserved_room_id`) REFERENCES `reservedroom` (`reserved_room_id`);

--
-- Constraints for table `room`
--
ALTER TABLE `room`
  ADD CONSTRAINT `room_ibfk_1` FOREIGN KEY (`room_status_id`) REFERENCES `roomstatus` (`room_status_id`),
  ADD CONSTRAINT `room_ibfk_2` FOREIGN KEY (`room_type_id`) REFERENCES `roomtype` (`room_type_id`);

--
-- Constraints for table `roomimage`
--
ALTER TABLE `roomimage`
  ADD CONSTRAINT `roomimage_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`);

--
-- Constraints for table `roomtypefeature`
--
ALTER TABLE `roomtypefeature`
  ADD CONSTRAINT `roomtypefeature_ibfk_1` FOREIGN KEY (`room_type_id`) REFERENCES `roomtype` (`room_type_id`),
  ADD CONSTRAINT `roomtypefeature_ibfk_2` FOREIGN KEY (`feature_id`) REFERENCES `feature` (`feature_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
