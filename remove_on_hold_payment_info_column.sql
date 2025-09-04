-- Remove on_hold_payment_info column from Reservation table
-- This field is no longer needed as payment info is now stored directly in the Payment table

USE hotel_db;

-- Remove the on_hold_payment_info column from Reservation table
ALTER TABLE Reservation DROP COLUMN on_hold_payment_info;

-- Verify the change
DESCRIBE Reservation;
