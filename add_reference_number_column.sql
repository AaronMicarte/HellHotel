-- Add reference_number column to payment table for GCash/PayMaya payments
ALTER TABLE `payment` ADD COLUMN `reference_number` VARCHAR(100) NULL AFTER `notes`;

-- Update the column comment for clarity
ALTER TABLE `payment` MODIFY COLUMN `reference_number` VARCHAR(100) NULL COMMENT 'Reference number for electronic payments (GCash, PayMaya, etc.)';
