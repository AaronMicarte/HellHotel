-- Setup script for online booking system
-- Run this to ensure all required data exists

-- Ensure we have all required data for online booking to work

-- Check if we have room types (should already exist)
SELECT 'Room Types:' as info, COUNT(*) as count FROM roomtype WHERE is_deleted = 0;

-- Check if we have rooms (should already exist)  
SELECT 'Rooms:' as info, COUNT(*) as count FROM room WHERE is_deleted = 0;

-- Check if we have payment methods (should already exist)
SELECT 'Payment Methods:' as info, COUNT(*) as count FROM paymentsubmethod WHERE is_deleted = 0;

-- Check if we have ID types (should already exist)
SELECT 'ID Types:' as info, COUNT(*) as count FROM guestidtype WHERE is_deleted = 0;

-- Check if we have reservation statuses (should already exist)
SELECT 'Reservation Statuses:' as info, COUNT(*) as count FROM reservationstatus WHERE is_deleted = 0;

-- Check if we have billing statuses (should already exist)
SELECT 'Billing Statuses:' as info, COUNT(*) as count FROM billingstatus WHERE is_deleted = 0;

-- Test query to verify the booking flow will work
SELECT 
    'Online Booking Test Query' as test,
    rt.room_type_id,
    rt.type_name,
    rt.price_per_stay,
    rt.max_capacity,
    git.guest_idtype_id,
    git.id_type,
    psm.sub_method_id,
    psm.name as payment_method,
    rs.reservation_status_id,
    rs.reservation_status,
    bs.billing_status_id,
    bs.billing_status
FROM roomtype rt
CROSS JOIN guestidtype git
CROSS JOIN paymentsubmethod psm
CROSS JOIN reservationstatus rs  
CROSS JOIN billingstatus bs
WHERE rt.is_deleted = 0 
    AND git.is_deleted = 0 
    AND psm.is_deleted = 0 
    AND rs.is_deleted = 0 
    AND bs.is_deleted = 0
    AND rt.room_type_id = (SELECT MIN(room_type_id) FROM roomtype WHERE is_deleted = 0)
    AND git.guest_idtype_id = (SELECT MIN(guest_idtype_id) FROM guestidtype WHERE is_deleted = 0)  
    AND psm.sub_method_id = (SELECT MIN(sub_method_id) FROM paymentsubmethod WHERE is_deleted = 0)
    AND rs.reservation_status_id = 1 -- pending
    AND bs.billing_status_id = 3 -- partial
LIMIT 1;

-- Show available room types for booking
SELECT 
    room_type_id,
    type_name,
    description,
    max_capacity,
    price_per_stay,
    CONCAT('₱', FORMAT(price_per_stay, 2)) as formatted_price
FROM roomtype 
WHERE is_deleted = 0 
ORDER BY price_per_stay;

-- Show available ID types
SELECT 
    guest_idtype_id,
    id_type
FROM guestidtype 
WHERE is_deleted = 0 
ORDER BY id_type;

-- Show available payment methods  
SELECT 
    psm.sub_method_id,
    psm.name,
    psmsc.name as category
FROM paymentsubmethod psm
LEFT JOIN paymentsubmethodcategory psmsc ON psm.payment_category_id = psmsc.payment_category_id
WHERE psm.is_deleted = 0 
ORDER BY psmsc.name, psm.name;
