ALTER TABLE Reservation ADD COLUMN on_hold_payment_info JSON NULL AFTER reservation_type;
-- Run this SQL in your database to support on-hold payment info for online bookings.
