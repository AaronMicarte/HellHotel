-- Add 'overdue' status to the reservation status enum
-- This script will modify the existing enum to include 'overdue'

USE hotel_db;

-- First, let's add the overdue status to the enum
ALTER TABLE `reservationstatus` MODIFY COLUMN `reservation_status` 
ENUM('pending','confirmed','checked-in','checked-out','cancelled','overdue') NOT NULL;

-- Insert the overdue status record
INSERT INTO `reservationstatus` (`reservation_status_id`, `reservation_status`, `created_at`, `updated_at`, `is_deleted`) 
VALUES (6, 'overdue', NOW(), NOW(), 0);

-- Optional: Update any existing reservations that are overdue
-- (past checkout date and not checked out or cancelled)
UPDATE `reservation` r
JOIN `reservationstatus` rs ON r.reservation_status_id = rs.reservation_status_id
SET r.reservation_status_id = 6
WHERE r.check_out_date < CURDATE() 
  AND rs.reservation_status IN ('pending', 'confirmed', 'checked-in')
  AND r.is_deleted = 0;

-- Show the updated status table
SELECT * FROM `reservationstatus` ORDER BY `reservation_status_id`;
