-- Insert default room statuses
INSERT IGNORE INTO RoomStatus (room_status_id, room_status) VALUES
(1, 'available'),
(2, 'occupied'),
(3, 'maintenance'),
(4, 'reserved');

-- Insert default user roles
INSERT IGNORE INTO UserRoles (user_roles_id, role_type) VALUES
(1, 'admin'),
(2, 'front desk');

-- Insert sample room types for testing
INSERT IGNORE INTO RoomType (room_type_id, type_name, description, max_capacity, price_per_stay, room_size_sqm) VALUES
(1, 'Standard', 'Basic room with essential amenities', 2, 1500.00, 25.00),
(2, 'Deluxe', 'Spacious room with premium amenities', 4, 2500.00, 35.00),
(3, 'Suite', 'Luxury suite with separate living area', 6, 4000.00, 50.00);

-- Insert reservation statuses
INSERT IGNORE INTO ReservationStatus (reservation_status_id, room_status) VALUES
(1, 'pending'),
(2, 'confirmed'),
(3, 'checked-in'),
(4, 'checked-out'),
(5, 'cancelled');

-- Insert guest ID types
INSERT IGNORE INTO GuestIDType (guest_idtype_id, id_type) VALUES
(1, 'Passport'),
(2, 'Driver\'s License'),
(3, 'SSS ID'),
(4, 'GSIS ID'),
(5, 'PRC ID'),
(6, 'Voter\'s ID'),
(7, 'Postal ID'),
(8, 'PhilHealth ID'),
(9, 'TIN ID'),
(10, 'UMID'),
(11, 'Barangay ID'),
(12, 'Student ID');

-- Insert billing statuses
INSERT IGNORE INTO BillingStatus (billing_status_id, billing_status) VALUES
(1, 'unpaid'),
(2, 'paid'),
(3, 'partial'),
(4, 'overdue');

-- Insert addon order statuses
INSERT IGNORE INTO AddonOrderStatus (order_status_id, order_status_name) VALUES
(1, 'pending'),
(2, 'processing'),
(3, 'delivered'),
(4, 'cancelled');

-- Insert payment categories
INSERT IGNORE INTO PaymentSubMethodCategory (payment_category_id, name) VALUES
(1, 'e-wallet'),
(2, 'bank'),
(3, 'credit card'),
(4, 'cash');

-- Insert sample payment methods
INSERT IGNORE INTO PaymentSubMethod (sub_method_id, payment_category_id, name) VALUES
(1, 1, 'GCash'),
(2, 1, 'PayMaya'),
(3, 2, 'BPI'),
(4, 2, 'BDO'),
(5, 3, 'Visa'),
(6, 4, 'Cash');

-- Insert sample admin user (password: admin123)
INSERT IGNORE INTO User (user_id, user_roles_id, username, password, email) VALUES
(1, 1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@hellhotel.com');
