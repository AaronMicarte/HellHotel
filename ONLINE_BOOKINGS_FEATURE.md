# Online Bookings Management Feature

## Overview
A dedicated admin interface for managing online reservations where front desk staff can view guest bookings and assign specific room numbers to room types requested by guests.

## Features Added

### 1. **New Admin Page: Online Bookings**
- **Location**: `/html/admin/online-bookings.html`
- **Purpose**: Dedicated interface for managing online reservations
- **Design**: Consistent with existing admin pages
- **Navigation**: Added to Reservations dropdown in sidebar

### 2. **Core Functionality**

#### **View Online Bookings**
- Filter by status (pending, confirmed, etc.)
- Filter by booking type (online only)
- Search by guest name or reservation ID
- Date range filtering for check-in dates

#### **Room Assignment**
- View requested room types from guest bookings
- Assign specific room numbers to room types
- See companions per room
- Batch assignment for multiple rooms in one reservation

#### **Booking Management**
- View detailed booking information
- Confirm pending bookings
- Cancel bookings if needed
- Access to billing and payment details

### 3. **Visual Interface**

#### **Main Table Columns**
- Booking ID & Type
- Guest Name & ID
- Check-in/Check-out dates
- Requested Room Types
- Assigned Rooms (status indicator)
- Reservation Status
- Booking Date
- Action buttons

#### **Room Assignment Modal**
- Booking details summary
- Room-by-room assignment interface
- Companion information display
- Available room selection dropdowns

#### **Booking Details Modal**
- Complete guest information
- Room details and assignments
- Add-on items (if any)
- Billing summary
- Payment status

### 4. **File Structure**

```
html/admin/
├── online-bookings.html          # Main interface
├── sidebar.html                  # Updated with new menu item

assets/js/admin/
├── online-bookings.js            # Main functionality

assets/css/
├── admin-dashboard.css           # Updated with online booking styles

api/admin/reservations/
├── reservations.php              # Enhanced with type filtering
├── reserved_rooms.php            # Added room assignment functions
```

### 5. **API Enhancements**

#### **New Operations Added**
- `getReservedRoomsByReservation` - Get all reserved rooms for a booking
- Enhanced filtering in `getAllReservations` for booking type
- Room assignment updates via `updateReservedRoom`

#### **Request Examples**
```javascript
// Get online bookings only
GET /api/admin/reservations/reservations.php?operation=getAllReservations&type=online&status=pending

// Get rooms for assignment
GET /api/admin/reservations/reserved_rooms.php?operation=getReservedRoomsByReservation&reservation_id=123

// Assign room
POST /api/admin/reservations/reserved_rooms.php
{
  "operation": "updateReservedRoom",
  "reserved_room_id": 456,
  "room_id": 789
}
```

### 6. **Business Logic**

#### **Online Booking Flow**
1. **Guest creates booking** → Room types selected, no specific rooms
2. **Booking appears in Online Bookings** → Status: Pending, Room Assignment: Not Assigned
3. **Front desk assigns rooms** → Specific room numbers assigned to room types
4. **Booking can be confirmed** → Status changes to Confirmed
5. **Room status updates** → Assigned rooms marked as Reserved

#### **Room Assignment Rules**
- Only available rooms of the correct type can be assigned
- Companions are preserved per room during assignment
- Multiple rooms can be assigned to one reservation
- Room status updates automatically when booking is confirmed

### 7. **User Experience**

#### **Front Desk Workflow**
1. Open "Reservations" → "Online Bookings"
2. View pending online bookings
3. Click "Assign" on bookings needing room assignment
4. Select specific room numbers for each requested room type
5. Save assignments
6. Confirm booking when ready
7. Guest receives room numbers and can check in

#### **Status Indicators**
- 🟡 **Pending Assignment**: Room types requested but no specific rooms assigned
- 🟢 **Assigned**: Specific room numbers assigned and ready for confirmation
- 🔵 **Confirmed**: Booking confirmed, rooms reserved
- 🔴 **Cancelled**: Booking cancelled

### 8. **Benefits**

#### **For Front Desk Staff**
- Clear separation of online vs walk-in bookings
- Easy room assignment workflow
- Complete booking information in one place
- Batch operations for efficiency

#### **For Hotel Management**
- Better control over room assignments
- Clear visibility of online booking pipeline
- Improved guest experience with proper room allocation
- Consistent booking management process

#### **For Guests**
- Room types guaranteed as requested
- Specific room assignments before arrival
- Smooth check-in process
- Clear booking confirmation

### 9. **Integration Points**

#### **Existing Systems**
- ✅ **Billing System**: Displays assigned rooms correctly
- ✅ **Payment System**: Works with single reservation structure
- ✅ **Room Management**: Updates room status on confirmation
- ✅ **Guest Management**: Links to guest information

#### **Data Consistency**
- Single reservation with multiple reserved rooms
- Companion data preserved per room
- Billing calculations include all rooms
- Payment tracking per reservation

### 10. **Testing Checklist**

#### **Basic Functions**
- [ ] Online bookings display correctly
- [ ] Filters work (status, type, date, search)
- [ ] Room assignment modal opens with correct data
- [ ] Room dropdowns show only available rooms of correct type
- [ ] Room assignments save successfully
- [ ] Booking confirmation works
- [ ] Booking cancellation works

#### **Edge Cases**
- [ ] No available rooms of requested type
- [ ] Multiple rooms of same type in one booking
- [ ] Bookings with companions
- [ ] Date filtering across different time zones
- [ ] Large number of bookings (performance)

#### **Integration Tests**
- [ ] Assigned rooms appear in billing
- [ ] Room status updates on confirmation
- [ ] Guest information loads correctly
- [ ] Add-on items display if present
- [ ] Payment information syncs properly

## Usage Instructions

### **For Administrators**
1. Navigate to **Reservations** → **Online Bookings**
2. Use filters to find specific bookings
3. Assign rooms to pending bookings
4. Confirm bookings when ready
5. Monitor booking status and guest information

### **Setup Requirements**
- Ensure room types have available rooms
- Verify reservation statuses are configured
- Test API endpoints for proper responses
- Check that front desk staff have appropriate permissions

This feature provides a complete solution for managing online bookings while maintaining consistency with the existing hotel management system design and functionality.
