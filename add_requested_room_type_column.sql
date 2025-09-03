-- Add requested_room_type_id field to Reservation table
-- This stores the room type preference for online bookings
-- Front desk can use this to assign appropriate room later

ALTER TABLE Reservation 
ADD COLUMN requested_room_type_id INT NULL AFTER guest_id,
ADD CONSTRAINT fk_reservation_requested_room_type 
FOREIGN KEY (requested_room_type_id) REFERENCES RoomType(room_type_id);
