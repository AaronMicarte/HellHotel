-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 10, 2025 at 07:12 AM
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
(12, 3, 'Redhorse Dako', 1, 135.10, 'addon_68b3f36745fce2.60022514.jpg', '2025-08-05 22:46:47', '2025-08-31 15:01:59', 0),
(13, 3, 'Tanduay Junior', 1, 65.00, 'addon_68b3f36e6295f3.74993940.jpg', '2025-08-05 22:47:52', '2025-08-31 15:02:06', 0),
(14, 2, 'Towel', 1, 55.00, 'addon_68b3f374bf94b3.22410176.jpg', '2025-08-05 22:49:41', '2025-08-31 15:02:12', 0),
(15, 2, 'Dove Soap', 1, 20.00, 'addon_68b3f37bc9de38.24475208.jpg', '2025-08-05 22:50:19', '2025-08-31 15:02:19', 0),
(16, NULL, NULL, 1, NULL, NULL, '2025-08-05 22:51:43', '2025-08-07 13:50:18', 1),
(17, NULL, NULL, 0, NULL, NULL, '2025-08-05 22:53:29', '2025-08-07 13:50:22', 1),
(18, NULL, NULL, 1, NULL, NULL, '2025-08-05 22:55:57', '2025-08-07 14:45:37', 1),
(19, NULL, NULL, 1, NULL, NULL, '2025-08-07 14:38:23', '2025-08-07 14:45:41', 1),
(20, 4, 'Rebisco Sandwich Choco', 1, 10.00, 'addon_68b3f3824a22d8.70894207.jpg', '2025-08-10 12:56:01', '2025-08-31 15:02:26', 0),
(21, 1, 'Humba', 1, 69.69, 'addon_68b3f3888fc732.23636493.jpg', '2025-08-19 23:30:41', '2025-08-31 15:02:32', 0),
(22, 1, 'Pater', 1, 123.00, 'addon_68b3f395e9dd57.92941998.jpg', '2025-08-20 21:13:03', '2025-08-31 15:03:07', 0);

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
  `order_date` datetime DEFAULT current_timestamp(),
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addonorder`
--

INSERT INTO `addonorder` (`addon_order_id`, `user_id`, `reservation_id`, `order_status_id`, `order_date`, `created_at`, `updated_at`, `is_deleted`) VALUES
(19, 8, 153, 3, '2025-09-08 23:22:16', '2025-09-08 23:22:16', '2025-09-08 23:22:36', 0),
(20, 8, 153, 2, '2025-09-08 23:30:46', '2025-09-08 23:30:46', '2025-09-08 23:34:15', 0),
(21, 7, 159, 2, '2025-09-09 22:59:21', '2025-09-09 22:59:21', '2025-09-09 22:59:28', 0),
(22, 8, 157, 3, '2025-09-10 08:26:55', '2025-09-10 08:26:55', '2025-09-10 08:27:28', 0);

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

--
-- Dumping data for table `addonorderitem`
--

INSERT INTO `addonorderitem` (`order_item_id`, `addon_order_id`, `addon_id`, `created_at`, `updated_at`, `is_deleted`) VALUES
(72, 19, 14, '2025-09-08 23:22:16', '2025-09-08 23:22:16', 0),
(73, 19, 15, '2025-09-08 23:22:16', '2025-09-08 23:22:16', 0),
(74, 20, 20, '2025-09-08 23:30:46', '2025-09-08 23:30:46', 0),
(75, 20, 20, '2025-09-08 23:30:47', '2025-09-08 23:30:47', 0),
(76, 21, 13, '2025-09-09 22:59:22', '2025-09-09 22:59:22', 0),
(77, 21, 13, '2025-09-09 22:59:22', '2025-09-09 22:59:22', 0),
(78, 22, 14, '2025-09-10 08:26:55', '2025-09-10 08:26:55', 0),
(79, 22, 15, '2025-09-10 08:26:55', '2025-09-10 08:26:55', 0),
(80, 22, 20, '2025-09-10 08:26:55', '2025-09-10 08:26:55', 0),
(81, 22, 21, '2025-09-10 08:26:55', '2025-09-10 08:26:55', 0);

-- --------------------------------------------------------

--
-- Table structure for table `addonorderstatus`
--

CREATE TABLE `addonorderstatus` (
  `order_status_id` int(11) NOT NULL,
  `order_status_name` enum('pending','confirmed','ready','delivered','completed','cancelled') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addonorderstatus`
--

INSERT INTO `addonorderstatus` (`order_status_id`, `order_status_name`, `created_at`, `updated_at`, `is_deleted`) VALUES
(1, 'pending', '2025-08-29 00:06:36', '2025-08-29 00:06:36', 0),
(2, 'confirmed', '2025-08-29 00:06:36', '2025-09-08 23:30:31', 0),
(3, 'ready', '2025-08-29 00:06:36', '2025-08-29 00:09:00', 0),
(4, 'delivered', '2025-08-29 00:06:36', '2025-08-29 00:06:36', 0),
(6, 'cancelled', '2025-08-29 00:06:36', '2025-08-29 00:06:36', 0);

-- --------------------------------------------------------

--
-- Table structure for table `addonorderstatushistory`
--

CREATE TABLE `addonorderstatushistory` (
  `history_id` int(11) NOT NULL,
  `addon_order_id` int(11) DEFAULT NULL,
  `status_id` int(11) DEFAULT NULL,
  `changed_by_user_id` int(11) DEFAULT NULL,
  `changed_at` datetime DEFAULT current_timestamp(),
  `remarks` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addonorderstatushistory`
--

INSERT INTO `addonorderstatushistory` (`history_id`, `addon_order_id`, `status_id`, `changed_by_user_id`, `changed_at`, `remarks`) VALUES
(29, 19, 1, 8, '2025-09-08 23:22:16', 'Order placed'),
(30, 19, 2, 8, '2025-09-08 23:22:23', ''),
(31, 19, 3, 8, '2025-09-08 23:22:36', ''),
(32, 20, 1, 8, '2025-09-08 23:30:46', 'Order placed'),
(33, 20, 2, 8, '2025-09-08 23:34:15', ''),
(34, 21, 1, 7, '2025-09-09 22:59:21', 'Order placed'),
(35, 21, 2, 7, '2025-09-09 22:59:28', ''),
(36, 22, 1, 8, '2025-09-10 08:26:55', 'Order placed'),
(37, 22, 2, 8, '2025-09-10 08:27:09', ''),
(38, 22, 3, 8, '2025-09-10 08:27:28', '');

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
(118, 153, 3, 199.00, '2025-09-08', '2025-09-08 23:19:29', '2025-09-08 23:19:29', 0),
(119, 154, 3, 199.00, '2025-09-08', '2025-09-08 23:46:11', '2025-09-08 23:46:11', 0),
(120, 155, 2, 199.00, '2025-09-09', '2025-09-09 21:34:20', '2025-09-10 08:01:44', 0),
(121, 156, 3, 199.00, '2025-09-09', '2025-09-09 21:37:48', '2025-09-09 21:37:48', 0),
(122, 157, 2, 199.00, '2025-09-09', '2025-09-09 21:55:02', '2025-09-10 07:58:54', 0),
(123, 158, 2, 199.00, '2025-09-09', '2025-09-09 22:22:48', '2025-09-10 07:49:17', 0),
(124, 159, 3, 199.00, '2025-09-09', '2025-09-09 22:56:59', '2025-09-09 22:56:59', 0),
(125, 160, 3, 299.00, '2025-09-09', '2025-09-09 23:13:44', '2025-09-09 23:13:44', 0);

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

--
-- Dumping data for table `billingaddon`
--

INSERT INTO `billingaddon` (`billing_addon_id`, `addon_id`, `billing_id`, `unit_price`, `quantity`, `created_at`, `updated_at`, `is_deleted`) VALUES
(28, 14, 118, 55.00, 1, '2025-09-08 23:22:24', '2025-09-08 23:22:24', 0),
(29, 15, 118, 20.00, 1, '2025-09-08 23:22:24', '2025-09-08 23:22:24', 0),
(30, 20, 118, 10.00, 2, '2025-09-08 23:34:15', '2025-09-08 23:34:15', 0),
(31, 13, 124, 65.00, 2, '2025-09-09 22:59:28', '2025-09-09 22:59:28', 0),
(32, 14, 122, 55.00, 1, '2025-09-10 08:27:09', '2025-09-10 08:27:09', 0),
(33, 15, 122, 20.00, 1, '2025-09-10 08:27:10', '2025-09-10 08:27:10', 0),
(34, 20, 122, 10.00, 1, '2025-09-10 08:27:10', '2025-09-10 08:27:10', 0),
(35, 21, 122, 69.69, 1, '2025-09-10 08:27:10', '2025-09-10 08:27:10', 0);

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
(4, 'overdue', '2025-08-14 15:12:10', '2025-08-14 15:12:10', 0),
(5, '', '2025-09-04 19:05:16', '2025-09-04 19:05:16', 0);

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
(18, 'Junkfood', '2025-08-18 23:21:43', '2025-08-18 23:21:43', 0),
(19, 'TV', '2025-08-21 21:04:08', '2025-08-21 21:04:08', 0),
(20, 'Wifi', '2025-08-21 21:04:14', '2025-08-21 21:04:14', 0),
(21, 'Aircon', '2025-08-27 18:14:02', '2025-08-27 18:14:02', 0);

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
(58, 11, 'Basset', 'Daphne', '', '', '2005-02-09', 'daphne@gmail.com', '09551280440', '321123', NULL, '2025-09-04 15:44:52', '2025-09-04 15:44:52', 0),
(59, 11, 'Micarte', 'Aaron', '', '', '2005-04-15', 'micarte2005@gmail.com', '+639551280440', '02-2122-034141', '/assets/images/uploads/id-pictures/idpic_68b944d4679c22.41595726.jpg', '2025-09-04 15:50:44', '2025-09-04 15:50:44', 0),
(60, 10, 'Micarte', 'Tyron', '', '', '2025-09-01', 'hh@hehe.com', '+639551280440', '321', '/assets/images/uploads/id-pictures/idpic_68b94aed1998d8.63002576.jpg', '2025-09-04 16:16:45', '2025-09-04 16:16:45', 0),
(61, 12, 'Salaysay', 'Jasmin', '', '', '2005-04-10', 'jasmin@gmail.com', '+639925077173', '02-2324-032412', '/assets/images/uploads/id-pictures/idpic_68b95e775695c5.90478850.jpg', '2025-09-04 17:40:07', '2025-09-04 17:40:07', 0),
(62, 12, 'Nabuntis', 'Justin', '', '', '2025-09-03', 'micarte2005@gmail.com', '+639551280440', '123321', '/assets/images/uploads/id-pictures/idpic_68b965374bc7e1.55206269.jpg', '2025-09-04 18:08:55', '2025-09-04 18:08:55', 0),
(63, 6, 'Raddan', 'Yatoro', '', '', '2025-09-02', 'daphne@gmail.com', '+639551280440', '123321', '/assets/images/uploads/id-pictures/idpic_68b96edac62761.41431930.jpg', '2025-09-04 18:50:02', '2025-09-04 18:50:02', 0),
(64, 9, 'lastname', 'firstname', '', '', '2025-09-02', 'micarte2005@gmail.com', '+639551280440', '123321', '/assets/images/uploads/id-pictures/idpic_68b972df952d06.40714847.jpg', '2025-09-04 19:07:11', '2025-09-04 19:07:11', 0),
(65, 12, 'Basset', 'Simon', NULL, NULL, '2003-05-02', 'simon@gmail.com', '09925077173', '02-2122-033030', NULL, '2025-09-04 20:13:10', '2025-09-04 20:13:10', 0),
(66, 9, 'Danbury', 'Lady', NULL, NULL, '2025-09-04', 'naruto@gmail.com', '09551280440', '02-2122-033030', NULL, '2025-09-04 21:38:39', '2025-09-04 21:38:39', 0),
(67, 10, 'kalo', 'kalo', NULL, NULL, '2005-04-04', 'naruto@gmail.com', '09551280440', '123', NULL, '2025-09-04 21:44:10', '2025-09-04 21:44:10', 0),
(68, 12, 'bibo', 'SECRET', '', '', '2025-09-01', 'micarte2005@gmail.com', '+639551280440', '123123123', '/assets/images/uploads/id-pictures/idpic_68b99933d09576.50369167.jpg', '2025-09-04 21:50:43', '2025-09-04 21:50:43', 0),
(69, 12, 'test', 'last', '', '', '2025-09-01', 'eloise@gmail.com', '+639551280449', '02-2122-0412312', '/assets/images/uploads/id-pictures/idpic_68b9bd2134be69.35776076.jpg', '2025-09-05 00:24:01', '2025-09-05 00:24:01', 0),
(70, 10, 'hehe', 'haha', '', '', '2025-09-01', 'hh@hehe.com', '+639552890440', '123321', '/assets/images/uploads/id-pictures/idpic_68b9bffee04052.22267588.jpg', '2025-09-05 00:36:14', '2025-09-05 00:36:14', 0),
(71, 10, 'Jangao', 'Daphne', '', '', '2025-09-01', 'hh@hehe.com', '+639551280440', '02-2122-0412312', '/assets/images/uploads/id-pictures/idpic_68b9c22d5eeb51.18856789.jpg', '2025-09-05 00:45:33', '2025-09-05 00:45:33', 0),
(72, 6, 'Ventic', 'Justine', '', '', '2025-09-01', 'micarte2005@gmail.com', '+639551280440', '123321', '/assets/images/uploads/id-pictures/idpic_68bd5a70e7a1b7.62557856.png', '2025-09-07 18:12:00', '2025-09-07 18:12:00', 0),
(73, 10, 'Bridgerton', 'Eloise', '', '', '2025-09-01', 'micarte2005@gmail.com', '+639551280440', '123123', '/assets/images/uploads/id-pictures/idpic_68bdacadafd228.28904941.jpg', '2025-09-08 00:02:53', '2025-09-08 00:02:53', 0);

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
  `money_given` decimal(10,2) DEFAULT NULL,
  `change_given` decimal(10,2) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL COMMENT 'Reference number for electronic payments (GCash, PayMaya, etc.)',
  `proof_of_payment_url` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`payment_id`, `user_id`, `billing_id`, `reservation_id`, `sub_method_id`, `amount_paid`, `money_given`, `change_given`, `payment_date`, `notes`, `reference_number`, `proof_of_payment_url`, `created_at`, `updated_at`, `is_deleted`) VALUES
(117, 8, 118, 153, 2, 99.50, NULL, NULL, '2025-09-08', 'Partial/Downpayment (auto)', '123321', NULL, '2025-09-08 23:19:29', '2025-09-08 23:19:29', 0),
(118, 8, 119, 154, 6, 99.50, NULL, NULL, '2025-09-08', 'Partial/Downpayment (auto)', NULL, NULL, '2025-09-08 23:46:11', '2025-09-08 23:46:11', 0),
(119, 7, 120, 155, 1, 99.50, NULL, NULL, '2025-09-09', 'Partial/Downpayment (auto)', '123321123321', NULL, '2025-09-09 21:34:21', '2025-09-09 21:34:21', 0),
(120, 7, 121, 156, 2, 99.50, NULL, NULL, '2025-09-09', 'Partial/Downpayment (auto)', '123123', NULL, '2025-09-09 21:37:48', '2025-09-09 21:37:48', 0),
(121, 7, 122, 157, 6, 99.50, NULL, NULL, '2025-09-09', 'Partial/Downpayment (auto)', NULL, NULL, '2025-09-09 21:55:02', '2025-09-09 21:55:02', 0),
(122, 7, 123, 158, 6, 99.50, NULL, NULL, '2025-09-09', 'Partial/Downpayment (auto)', NULL, NULL, '2025-09-09 22:22:48', '2025-09-09 22:22:48', 0),
(123, 7, 124, 159, 6, 99.50, NULL, NULL, '2025-09-09', 'Partial/Downpayment (auto)', NULL, NULL, '2025-09-09 22:56:59', '2025-09-09 22:56:59', 0),
(124, 7, 125, 160, 6, 149.50, 500.00, 201.00, '2025-09-09', 'Partial/Downpayment (auto)', NULL, NULL, '2025-09-09 23:13:44', '2025-09-09 23:13:44', 0),
(125, 7, 125, 160, 6, 149.50, 200.00, 50.50, '2025-09-09', 'idk', NULL, NULL, '2025-09-09 23:58:39', '2025-09-09 23:58:39', 0),
(126, 7, 124, 159, 6, 50.00, 100.00, 50.00, '2025-09-10', 'testing', NULL, NULL, '2025-09-10 01:13:11', '2025-09-10 01:13:11', 0),
(127, 7, 124, 159, 6, 50.00, 100.00, 50.00, '2025-09-10', 'testig again', NULL, NULL, '2025-09-10 01:17:40', '2025-09-10 01:17:40', 0),
(128, 7, 124, 159, 6, 25.00, 50.00, 25.00, '2025-09-10', 'yeye', NULL, NULL, '2025-09-10 01:31:54', '2025-09-10 01:31:54', 0),
(129, 8, 124, 159, 2, 104.50, 105.00, 0.50, '2025-09-10', 'Paid', '123123123', NULL, '2025-09-10 07:37:40', '2025-09-10 07:37:40', 0),
(130, 8, 123, 158, 6, 0.50, 5.00, 4.50, '2025-09-10', 'Basta', NULL, NULL, '2025-09-10 07:47:48', '2025-09-10 07:47:48', 0),
(131, 8, 123, 158, 6, 99.00, 99.00, 0.00, '2025-09-10', 'Paid', NULL, NULL, '2025-09-10 07:49:17', '2025-09-10 07:49:17', 0),
(132, 8, 122, 157, 6, 5.00, 0.00, 0.00, '2025-09-10', 'e', NULL, NULL, '2025-09-10 07:58:34', '2025-09-10 07:58:34', 0),
(133, 8, 122, 157, 6, 94.50, 100.00, 5.50, '2025-09-10', 'PAID', NULL, NULL, '2025-09-10 07:58:54', '2025-09-10 07:58:54', 0),
(134, 8, 120, 155, 6, 0.50, 5.00, 4.50, '2025-09-10', 'yrr', NULL, NULL, '2025-09-10 08:01:03', '2025-09-10 08:01:03', 0),
(135, 8, 120, 155, 6, 99.00, 100.00, 1.00, '2025-09-10', 'Fully Paid Na', NULL, NULL, '2025-09-10 08:01:44', '2025-09-10 08:01:44', 0);

-- --------------------------------------------------------

--
-- Table structure for table `paymenthistory`
--

CREATE TABLE `paymenthistory` (
  `history_id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `billing_id` int(11) NOT NULL,
  `reservation_id` int(11) NOT NULL,
  `changed_by_user_id` int(11) DEFAULT NULL,
  `changed_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `paymenthistory`
--

INSERT INTO `paymenthistory` (`history_id`, `payment_id`, `billing_id`, `reservation_id`, `changed_by_user_id`, `changed_at`) VALUES
(1, 128, 124, 159, 7, '2025-09-10 01:31:54'),
(2, 129, 124, 159, 8, '2025-09-10 07:37:41'),
(3, 130, 123, 158, 8, '2025-09-10 07:47:49'),
(4, 131, 123, 158, 8, '2025-09-10 07:49:17'),
(5, 132, 122, 157, 8, '2025-09-10 07:58:34'),
(6, 133, 122, 157, 8, '2025-09-10 07:58:54'),
(7, 134, 120, 155, 8, '2025-09-10 08:01:03'),
(8, 135, 120, 155, 8, '2025-09-10 08:01:44');

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
  `requested_room_type_id` int(11) DEFAULT NULL,
  `reservation_type` enum('online','walk-in') NOT NULL DEFAULT 'online',
  `check_in_date` date DEFAULT NULL,
  `check_out_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservation`
--

INSERT INTO `reservation` (`reservation_id`, `user_id`, `reservation_status_id`, `guest_id`, `requested_room_type_id`, `reservation_type`, `check_in_date`, `check_out_date`, `notes`, `created_at`, `updated_at`, `is_deleted`) VALUES
(153, 8, 4, 73, 24, 'walk-in', '2025-09-08', '2025-09-09', NULL, '2025-09-08 23:19:28', '2025-09-10 11:17:26', 0),
(154, 8, 5, 58, 24, 'walk-in', '2025-09-13', '2025-09-14', NULL, '2025-09-08 23:46:10', '2025-09-10 11:18:00', 0),
(155, 7, 3, 59, 24, 'walk-in', '2025-09-09', '2025-09-10', NULL, '2025-09-09 21:34:19', '2025-09-10 09:00:56', 0),
(156, 7, 2, 61, 24, 'walk-in', '2025-09-09', '2025-09-10', NULL, '2025-09-09 21:37:48', '2025-09-09 21:37:48', 0),
(157, 7, 2, 61, 24, 'walk-in', '2025-09-10', '2025-09-11', NULL, '2025-09-09 21:55:01', '2025-09-09 21:55:01', 0),
(158, 7, 2, 72, 24, 'walk-in', '2025-09-09', '2025-09-10', NULL, '2025-09-09 22:22:47', '2025-09-09 22:22:47', 0),
(159, 7, 2, 66, 24, 'walk-in', '2025-09-09', '2025-09-10', NULL, '2025-09-09 22:56:58', '2025-09-09 22:56:58', 0),
(160, 7, 2, 70, 25, 'walk-in', '2025-09-09', '2025-09-10', NULL, '2025-09-09 23:13:43', '2025-09-09 23:13:43', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reservationstatus`
--

CREATE TABLE `reservationstatus` (
  `reservation_status_id` int(11) NOT NULL,
  `reservation_status` enum('pending','confirmed','checked-in','checked-out','cancelled','overdue') NOT NULL,
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
(5, 'cancelled', '2025-08-13 00:01:31', '2025-08-13 00:01:31', 0),
(6, 'overdue', '2025-09-07 17:10:07', '2025-09-07 17:10:07', 0);

-- --------------------------------------------------------

--
-- Table structure for table `reservationstatushistory`
--

CREATE TABLE `reservationstatushistory` (
  `history_id` int(11) NOT NULL,
  `reservation_id` int(11) NOT NULL,
  `status_id` int(11) NOT NULL,
  `changed_by_user_id` int(11) DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservationstatushistory`
--

INSERT INTO `reservationstatushistory` (`history_id`, `reservation_id`, `status_id`, `changed_by_user_id`, `changed_at`) VALUES
(178, 153, 2, 8, '2025-09-08 23:19:29'),
(179, 154, 2, 8, '2025-09-08 23:46:11'),
(180, 153, 3, 8, '2025-09-09 00:10:23'),
(181, 154, 5, 2, '2025-09-09 21:00:51'),
(182, 155, 2, 7, '2025-09-09 21:34:21'),
(183, 156, 2, 7, '2025-09-09 21:37:48'),
(184, 157, 2, 7, '2025-09-09 21:55:02'),
(185, 158, 2, 7, '2025-09-09 22:22:48'),
(186, 159, 2, 7, '2025-09-09 22:56:59'),
(187, 160, 2, 7, '2025-09-09 23:13:44'),
(188, 155, 3, 8, '2025-09-10 09:00:56'),
(189, 153, 4, 7, '2025-09-10 11:17:26'),
(190, 154, 5, 7, '2025-09-10 11:18:00');

-- --------------------------------------------------------

--
-- Table structure for table `reservedroom`
--

CREATE TABLE `reservedroom` (
  `reserved_room_id` int(11) NOT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `room_type_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ;

--
-- Dumping data for table `reservedroom`
--

INSERT INTO `reservedroom` (`reserved_room_id`, `reservation_id`, `room_id`, `room_type_id`, `created_at`, `updated_at`, `is_deleted`) VALUES
(199, 153, 20, 24, '2025-09-08 23:19:28', '2025-09-08 23:19:28', 0),
(200, 154, 20, 24, '2025-09-08 23:46:10', '2025-09-08 23:46:10', 0),
(201, 155, 20, 24, '2025-09-09 21:34:20', '2025-09-09 21:34:20', 0),
(202, 156, 21, 24, '2025-09-09 21:37:48', '2025-09-09 21:37:48', 0),
(203, 157, 20, 24, '2025-09-09 21:55:02', '2025-09-09 21:55:02', 0),
(204, 158, 23, 24, '2025-09-09 22:22:47', '2025-09-09 22:22:47', 0),
(205, 159, 26, 24, '2025-09-09 22:56:59', '2025-09-09 22:56:59', 0),
(206, 160, 22, 25, '2025-09-09 23:13:43', '2025-09-09 23:13:43', 0);

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
(20, 1, 24, '101', '2025-08-18 22:53:34', '2025-09-10 11:17:26', 0),
(21, 4, 24, '102', '2025-08-18 23:52:29', '2025-09-04 15:59:14', 0),
(22, 4, 25, '201', '2025-08-18 23:53:00', '2025-09-09 23:13:43', 0),
(23, 4, 24, '103', '2025-08-20 23:38:42', '2025-09-04 19:10:36', 0),
(24, 2, 26, '301', '2025-08-21 21:04:32', '2025-09-04 22:19:24', 0),
(25, 2, 26, '302', '2025-08-21 21:04:38', '2025-09-04 22:19:24', 0),
(26, 4, 24, '105', '2025-09-04 23:19:12', '2025-09-09 22:56:59', 0);

-- --------------------------------------------------------

--
-- Table structure for table `roomimage`
--

CREATE TABLE `roomimage` (
  `room_image_id` int(11) NOT NULL,
  `room_type_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roomimage`
--

INSERT INTO `roomimage` (`room_image_id`, `room_type_id`, `image_url`, `created_at`, `is_deleted`) VALUES
(3, 24, 'roomtypeimg_68aed3e9da55a2.31668251.png', '2025-08-27 17:46:17', 0),
(4, 24, 'roomtypeimg_68aed662f42323.62183090.png', '2025-08-27 17:56:51', 0),
(5, 24, 'roomtypeimg_68aed6e38ca976.65680397.png', '2025-08-27 17:58:59', 0),
(6, 24, 'roomtypeimg_68aed6f14cdab7.49931616.png', '2025-08-27 17:59:13', 0),
(7, 24, 'roomtypeimg_68aed700719042.30933745.png', '2025-08-27 17:59:28', 0),
(8, 24, 'roomtypeimg_68aed7131dc720.73597180.png', '2025-08-27 17:59:47', 0),
(9, 24, 'roomtypeimg_68aed71a8efd63.40885534.png', '2025-08-27 17:59:54', 0);

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
(25, 'Executive', 'An upgraded, spacious accommodation offering premium amenities, enhanced comfort, and exclusive privileges—perfect for guests who desire a higher level of luxury, convenience, and personalized service.', 77.00, 4, 299.00, 'roomtype_68a6e474f3d340.55789272.jpg', '2025-08-18 11:44:18', '2025-08-21 21:07:22', 0),
(26, 'Family', 'Family great for bonding with kids, and stupid ass relatives, or even friends. Book now.', 58.00, 6, 499.00, 'roomtype_68a71935b18b58.20354369.webp', '2025-08-21 21:03:49', '2025-08-21 21:03:49', 0);

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
(24, 18),
(24, 19),
(24, 20),
(24, 21),
(25, 15),
(25, 18),
(26, 15),
(26, 19),
(26, 20);

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
(7, 2, 'hh', '$2y$10$iOm1WHwno8wcHSyshpvkdua3HxfHhFOk/muveFGP4ybhr89jE7dMO', '', 'hh@hehe.com', '2025-08-20 00:27:21', '2025-09-09 14:22:19', 0),
(8, 2, 'rr', '$2y$10$5lI2s6flIdvhDTCKlIPcaOxgHfpA0iw8GvAvUNEu6DgFP9YL/s4r2', '', 'rr@rr.com', '2025-09-07 22:58:21', '2025-09-07 22:59:44', 0);

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
-- Indexes for table `addonorderstatushistory`
--
ALTER TABLE `addonorderstatushistory`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `addon_order_id` (`addon_order_id`),
  ADD KEY `status_id` (`status_id`),
  ADD KEY `changed_by_user_id` (`changed_by_user_id`);

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
-- Indexes for table `paymenthistory`
--
ALTER TABLE `paymenthistory`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `billing_id` (`billing_id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `changed_by_user_id` (`changed_by_user_id`);

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
  ADD KEY `guest_id` (`guest_id`),
  ADD KEY `fk_reservation_requested_room_type` (`requested_room_type_id`);

--
-- Indexes for table `reservationstatus`
--
ALTER TABLE `reservationstatus`
  ADD PRIMARY KEY (`reservation_status_id`);

--
-- Indexes for table `reservationstatushistory`
--
ALTER TABLE `reservationstatushistory`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `status_id` (`status_id`),
  ADD KEY `changed_by_user_id` (`changed_by_user_id`);

--
-- Indexes for table `reservedroom`
--
ALTER TABLE `reservedroom`
  ADD PRIMARY KEY (`reserved_room_id`),
  ADD KEY `reservation_id` (`reservation_id`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `room_type_id` (`room_type_id`);

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
  ADD KEY `room_type_id` (`room_type_id`);

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
  MODIFY `addon_order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `addonorderitem`
--
ALTER TABLE `addonorderitem`
  MODIFY `order_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT for table `addonorderstatus`
--
ALTER TABLE `addonorderstatus`
  MODIFY `order_status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `addonorderstatushistory`
--
ALTER TABLE `addonorderstatushistory`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `billing`
--
ALTER TABLE `billing`
  MODIFY `billing_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=126;

--
-- AUTO_INCREMENT for table `billingaddon`
--
ALTER TABLE `billingaddon`
  MODIFY `billing_addon_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `billingstatus`
--
ALTER TABLE `billingstatus`
  MODIFY `billing_status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `feature`
--
ALTER TABLE `feature`
  MODIFY `feature_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `guest`
--
ALTER TABLE `guest`
  MODIFY `guest_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=74;

--
-- AUTO_INCREMENT for table `guestidtype`
--
ALTER TABLE `guestidtype`
  MODIFY `guest_idtype_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=136;

--
-- AUTO_INCREMENT for table `paymenthistory`
--
ALTER TABLE `paymenthistory`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
  MODIFY `reservation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=161;

--
-- AUTO_INCREMENT for table `reservationstatus`
--
ALTER TABLE `reservationstatus`
  MODIFY `reservation_status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `reservationstatushistory`
--
ALTER TABLE `reservationstatushistory`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=191;

--
-- AUTO_INCREMENT for table `reservedroom`
--
ALTER TABLE `reservedroom`
  MODIFY `reserved_room_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reservedroomcompanion`
--
ALTER TABLE `reservedroomcompanion`
  MODIFY `companion_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=153;

--
-- AUTO_INCREMENT for table `room`
--
ALTER TABLE `room`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `roomimage`
--
ALTER TABLE `roomimage`
  MODIFY `room_image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `roomstatus`
--
ALTER TABLE `roomstatus`
  MODIFY `room_status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `roomtype`
--
ALTER TABLE `roomtype`
  MODIFY `room_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
-- Constraints for table `addonorderstatushistory`
--
ALTER TABLE `addonorderstatushistory`
  ADD CONSTRAINT `addonorderstatushistory_ibfk_1` FOREIGN KEY (`addon_order_id`) REFERENCES `addonorder` (`addon_order_id`),
  ADD CONSTRAINT `addonorderstatushistory_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `addonorderstatus` (`order_status_id`),
  ADD CONSTRAINT `addonorderstatushistory_ibfk_3` FOREIGN KEY (`changed_by_user_id`) REFERENCES `user` (`user_id`);

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
-- Constraints for table `paymenthistory`
--
ALTER TABLE `paymenthistory`
  ADD CONSTRAINT `paymenthistory_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`payment_id`),
  ADD CONSTRAINT `paymenthistory_ibfk_2` FOREIGN KEY (`billing_id`) REFERENCES `billing` (`billing_id`),
  ADD CONSTRAINT `paymenthistory_ibfk_3` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`reservation_id`),
  ADD CONSTRAINT `paymenthistory_ibfk_4` FOREIGN KEY (`changed_by_user_id`) REFERENCES `user` (`user_id`);

--
-- Constraints for table `paymentsubmethod`
--
ALTER TABLE `paymentsubmethod`
  ADD CONSTRAINT `paymentsubmethod_ibfk_1` FOREIGN KEY (`payment_category_id`) REFERENCES `paymentsubmethodcategory` (`payment_category_id`);

--
-- Constraints for table `reservation`
--
ALTER TABLE `reservation`
  ADD CONSTRAINT `fk_reservation_requested_room_type` FOREIGN KEY (`requested_room_type_id`) REFERENCES `roomtype` (`room_type_id`),
  ADD CONSTRAINT `reservation_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `reservation_ibfk_2` FOREIGN KEY (`reservation_status_id`) REFERENCES `reservationstatus` (`reservation_status_id`),
  ADD CONSTRAINT `reservation_ibfk_3` FOREIGN KEY (`guest_id`) REFERENCES `guest` (`guest_id`);

--
-- Constraints for table `reservationstatushistory`
--
ALTER TABLE `reservationstatushistory`
  ADD CONSTRAINT `reservationstatushistory_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`reservation_id`),
  ADD CONSTRAINT `reservationstatushistory_ibfk_2` FOREIGN KEY (`status_id`) REFERENCES `reservationstatus` (`reservation_status_id`),
  ADD CONSTRAINT `reservationstatushistory_ibfk_3` FOREIGN KEY (`changed_by_user_id`) REFERENCES `user` (`user_id`);

--
-- Constraints for table `reservedroom`
--
ALTER TABLE `reservedroom`
  ADD CONSTRAINT `reservedroom_ibfk_1` FOREIGN KEY (`reservation_id`) REFERENCES `reservation` (`reservation_id`),
  ADD CONSTRAINT `reservedroom_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `room` (`room_id`),
  ADD CONSTRAINT `reservedroom_ibfk_3` FOREIGN KEY (`room_type_id`) REFERENCES `roomtype` (`room_type_id`);

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
  ADD CONSTRAINT `roomimage_ibfk_1` FOREIGN KEY (`room_type_id`) REFERENCES `roomtype` (`room_type_id`);

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
