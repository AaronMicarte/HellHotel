-- -------------------------------------------
--  HOTEL MANAGEMENT SYSTEM - FULL SQL SCHEMA
--  Normalized to 3NF, with FK/PK, ENUMS, Audit Fields
-- -------------------------------------------

CREATE DATABASE IF NOT EXISTS hotel_db;
USE hotel_db;

-- USER & ROLES
CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_roles_id INT,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    new_password VARCHAR(255), -- Add this line
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE UserRoles (
    user_roles_id INT AUTO_INCREMENT PRIMARY KEY,
    role_type ENUM('admin', 'front desk') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- GUESTS
CREATE TABLE GuestIDType (
    guest_idtype_id INT AUTO_INCREMENT PRIMARY KEY,
    id_type ENUM('Passport', 'Driver\'s License', 'SSS ID', 'GSIS ID', 'PRC ID', 'Voter\'s ID', 'Postal ID', 'PhilHealth ID', 'TIN ID', 'UMID', 'Barangay ID', 'Student ID') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE Guest (
    guest_id INT AUTO_INCREMENT PRIMARY KEY,
    guest_idtype_id INT,
    last_name VARCHAR(100),
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    suffix VARCHAR(10),
    date_of_birth DATE,
    email VARCHAR(150),
    phone_number VARCHAR(20),
    id_number VARCHAR(100),
    id_picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (guest_idtype_id) REFERENCES GuestIDType(guest_idtype_id)
);

-- RESERVATION & STATUS
CREATE TABLE ReservationStatus (
    reservation_status_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_status ENUM('pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE Reservation (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    reservation_status_id INT,
    guest_id INT,
    reservation_type ENUM('online', 'walk-in') NOT NULL DEFAULT 'online',
    check_in_date DATE,
    check_out_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (reservation_status_id) REFERENCES ReservationStatus(reservation_status_id),
    FOREIGN KEY (guest_id) REFERENCES Guest(guest_id)
);

-- ROOM & ROOM ATTRIBUTES
CREATE TABLE RoomStatus (
    room_status_id INT AUTO_INCREMENT PRIMARY KEY,
    room_status ENUM('available', 'occupied', 'maintenance', 'reserved') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE ReservationStatusHistory (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT,
    status_id INT,
    changed_by_user_id INT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES Reservation(reservation_id),
    FOREIGN KEY (status_id) REFERENCES ReservationStatus(reservation_status_id),
    FOREIGN KEY (changed_by_user_id) REFERENCES User(user_id)
);

CREATE TABLE RoomType (
    room_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100),
    description TEXT,
    room_size_sqm DECIMAL(5,2),
    max_capacity INT,
    price_per_stay DECIMAL(10,2),
    image_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE Room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_status_id INT,
    room_type_id INT,
    room_number VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_status_id) REFERENCES RoomStatus(room_status_id),
    FOREIGN KEY (room_type_id) REFERENCES RoomType(room_type_id)
);

CREATE TABLE ReservedRoom (
    reserved_room_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT,
    room_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (reservation_id) REFERENCES Reservation(reservation_id),
    FOREIGN KEY (room_id) REFERENCES Room(room_id)
);

CREATE TABLE RoomImage (
    room_image_id INT AUTO_INCREMENT PRIMARY KEY,
    room_type_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_type_id) REFERENCES RoomType(room_type_id)
);
    
-- BILLING & ADDONS
CREATE TABLE BillingStatus (
    billing_status_id INT AUTO_INCREMENT PRIMARY KEY,
    billing_status ENUM('unpaid', 'paid', 'partial', 'overdue') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- ADDON ORDER STATUS HISTORY
CREATE TABLE AddonOrderStatusHistory (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    addon_order_id INT,
    status_id INT,
    changed_by_user_id INT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    remarks VARCHAR(255) NULL,
    FOREIGN KEY (addon_order_id) REFERENCES AddonOrder(addon_order_id),
    FOREIGN KEY (status_id) REFERENCES AddonOrderStatus(order_status_id),
    FOREIGN KEY (changed_by_user_id) REFERENCES User(user_id)
);

-- Table: ReservedRoomCompanion
CREATE TABLE ReservedRoomCompanion (
    companion_id INT AUTO_INCREMENT PRIMARY KEY,
    reserved_room_id INT,
    full_name VARCHAR(150) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (reserved_room_id) REFERENCES ReservedRoom(reserved_room_id)
);


CREATE TABLE Billing (
    billing_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT,
    billing_status_id INT,
    total_amount DECIMAL(10,2),
    billing_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (reservation_id) REFERENCES Reservation(reservation_id),
    FOREIGN KEY (billing_status_id) REFERENCES BillingStatus(billing_status_id)
);

CREATE TABLE AddonCategory (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE Addon (
    addon_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    name VARCHAR(100),
    is_available BOOLEAN,
    price DECIMAL(10,2),
    image_url VARCHAR(255) AFTER price, -- Add this line to store image filename or URL
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (category_id) REFERENCES AddonCategory(category_id)
);

CREATE TABLE BillingAddon (
    billing_addon_id INT AUTO_INCREMENT PRIMARY KEY,
    addon_id INT,
    billing_id INT,
    unit_price DECIMAL(10,2),
    quantity INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (addon_id) REFERENCES Addon(addon_id),
    FOREIGN KEY (billing_id) REFERENCES Billing(billing_id)
);

-- ADDON ORDER FLOW
CREATE TABLE AddonOrderStatus (
    order_status_id INT AUTO_INCREMENT PRIMARY KEY,
    order_status_name ENUM('pending', 'processing', 'delivered', 'cancelled') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE AddonOrder (
    addon_order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    reservation_id INT,
    order_status_id INT,
    order_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (reservation_id) REFERENCES Reservation(reservation_id),
    FOREIGN KEY (order_status_id) REFERENCES AddonOrderStatus(order_status_id)
);

CREATE TABLE AddonOrderItem (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    addon_order_id INT,
    addon_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (addon_order_id) REFERENCES AddonOrder(addon_order_id),
    FOREIGN KEY (addon_id) REFERENCES Addon(addon_id)
);

-- PAYMENTS
CREATE TABLE PaymentSubMethodCategory (
    payment_category_id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('e-wallet', 'bank', 'credit card') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE PaymentSubMethod (
    sub_method_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_category_id INT,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (payment_category_id) REFERENCES PaymentSubMethodCategory(payment_category_id)
);

CREATE TABLE Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    billing_id INT,
    reservation_id INT,
    sub_method_id INT,
    amount_paid DECIMAL(10,2),
    payment_date DATE,
    notes TEXT, -- Add this line if not present
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (billing_id) REFERENCES Billing(billing_id),
    FOREIGN KEY (reservation_id) REFERENCES Reservation(reservation_id),
    FOREIGN KEY (sub_method_id) REFERENCES PaymentSubMethod(sub_method_id)
);

ALTER TABLE Payment ADD COLUMN notes TEXT NULL AFTER payment_date;

-- Insert default billing statuses if not present
INSERT INTO BillingStatus (billing_status_id, billing_status)
    VALUES (1, 'unpaid')
    ON DUPLICATE KEY UPDATE billing_status=billing_status;
INSERT INTO BillingStatus (billing_status_id, billing_status)
    VALUES (2, 'paid')
    ON DUPLICATE KEY UPDATE billing_status=billing_status;
INSERT INTO BillingStatus (billing_status_id, billing_status)
    VALUES (3, 'partial')
    ON DUPLICATE KEY UPDATE billing_status=billing_status;
INSERT INTO BillingStatus (billing_status_id, billing_status)
    VALUES (4, 'overdue')
    ON DUPLICATE KEY UPDATE billing_status=billing_status;

-- Check if payment methods exist
SELECT * FROM PaymentSubMethodCategory;
SELECT * FROM PaymentSubMethod;

-- If empty, insert default payment categories and methods:
INSERT INTO PaymentSubMethodCategory (payment_category_id, name)
    VALUES (1, 'e-wallet'), (2, 'bank'), (3, 'credit card')
    ON DUPLICATE KEY UPDATE name=name;

INSERT INTO PaymentSubMethod (sub_method_id, payment_category_id, name)
    VALUES (1, 1, 'GCash'),
           (2, 1, 'PayMaya'),
           (3, 2, 'BPI'),
           (4, 3, 'Visa')
    ON DUPLICATE KEY UPDATE name=name;

CREATE TABLE Feature (
    feature_id INT AUTO_INCREMENT PRIMARY KEY,
    feature_name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE RoomTypeFeature (
    room_type_id INT NOT NULL,
    feature_id INT NOT NULL,
    PRIMARY KEY (room_type_id, feature_id),
    FOREIGN KEY (room_type_id) REFERENCES RoomType(room_type_id),
    FOREIGN KEY (feature_id) REFERENCES Feature(feature_id)
);

ALTER TABLE RoomType DROP COLUMN key_features;
