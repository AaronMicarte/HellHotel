/**
 * Online Bookings Management System
 * Handles online reservation management and room assignments
 * Based on reservations.js structure for consistency
 */

// Constants
const BASE_URL = "/Hotel-Reservation-Billing-System/api/admin";
let currentBookings = [];
let availableRooms = [];
let currentReservationId = null;
let cachedStatuses = [];

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    loadOnlineBookings();
    loadAvailableRooms();
    loadStatuses();
    initializeFilters();
    initializeEventHandlers();
});

/**
 * Initialize event handlers (similar to reservations.js)
 */
function initializeEventHandlers() {
    // Search functionality
    const searchInput = document.getElementById('searchOnlineBooking');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
            }
        });
    }

    // Filter form
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            // Clear filters
            const searchInput = document.getElementById('searchOnlineBooking');
            const statusFilter = document.getElementById('statusFilter');
            const dateFromFilter = document.getElementById('dateFromFilter');
            const dateToFilter = document.getElementById('dateToFilter');

            if (searchInput) searchInput.value = '';
            if (statusFilter) statusFilter.value = '';
            if (dateFromFilter) dateFromFilter.value = '';
            if (dateToFilter) dateToFilter.value = '';

            loadOnlineBookings();
        });
    }
}

/**
 * Load reservation statuses
 */
async function loadStatuses() {
    try {
        const response = await axios.get(`${BASE_URL}/reservations/reservation_status.php`);
        if (response.data && Array.isArray(response.data)) {
            cachedStatuses = response.data;
        }
    } catch (error) {
        console.error("Error loading reservation statuses:", error);
        cachedStatuses = [];
    }
}

/**
 * Load online bookings with filters
 */
async function loadOnlineBookings() {
    showLoading(true);

    try {
        const filters = getFilters();
        const response = await axios.get(`${BASE_URL}/reservations/reservations.php`, {
            params: {
                operation: 'getAllReservations',
                type: 'online',  // Only online bookings
                ...filters
            }
        });

        if (Array.isArray(response.data)) {
            currentBookings = response.data || [];
            renderOnlineBookingsTable(currentBookings);
            updateCounters();
        } else {
            throw new Error('Invalid data format received');
        }
    } catch (error) {
        console.error('Error loading online bookings:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load online bookings. Please try again.'
        });
        showNoData(true);
    } finally {
        showLoading(false);
    }
}

/**
 * Load available rooms for assignment
 */
async function loadAvailableRooms() {
    try {
        const response = await axios.get(`${BASE_URL}/rooms/rooms.php`, {
            params: { operation: 'getAllRooms' }
        });

        if (Array.isArray(response.data)) {
            availableRooms = response.data || [];
        }
    } catch (error) {
        console.error('Error loading available rooms:', error);
        availableRooms = [];
    }
}

/**
 * Get available rooms for specific dates and room type
 * This checks actual availability during the guest's stay period
 */
async function getAvailableRoomsForDates(roomTypeId, checkInDate, checkOutDate, excludeReservationId = null) {
    try {
        console.log('Checking availability for:', { roomTypeId, checkInDate, checkOutDate, excludeReservationId });

        const params = {
            operation: 'getAvailableRooms',
            room_type_id: roomTypeId,
            check_in_date: checkInDate,
            check_out_date: checkOutDate
        };
        if (excludeReservationId) {
            params.exclude_reservation_id = excludeReservationId;
        }
        const response = await axios.get(`${BASE_URL}/rooms/rooms.php`, { params });
        let availableRooms = [];
        if (Array.isArray(response.data)) {
            availableRooms = response.data;
        } else if (response.data && typeof response.data === 'object') {
            availableRooms = Object.values(response.data);
        }
        console.log('Available rooms found:', availableRooms.length);
        return availableRooms;
    } catch (error) {
        console.error('Error getting available rooms for dates:', error);
        return [];
    }
}

/**
 * Get current filter values
 */
function getFilters() {
    const searchInput = document.getElementById('searchOnlineBooking');
    return {
        status: document.getElementById('statusFilter')?.value || '',
        date_from: document.getElementById('dateFromFilter')?.value || '',
        date_to: document.getElementById('dateToFilter')?.value || '',
        search: searchInput?.value || ''
    };
}

/**
 * Render online bookings table (similar to reservations.js structure)
 */
function renderOnlineBookingsTable(bookings) {
    const tbody = document.getElementById('onlineBookingsTableBody');

    if (!tbody) {
        console.error('onlineBookingsTableBody element not found!');
        return;
    }

    if (!bookings || bookings.length === 0) {
        showNoData(true);
        tbody.innerHTML = '';
        return;
    }

    showNoData(false);

    // Filter out deleted reservations
    const filteredBookings = bookings.filter(booking =>
        !booking.is_deleted ||
        booking.is_deleted === 0 ||
        booking.is_deleted === "0" ||
        booking.is_deleted === false ||
        booking.is_deleted === "FALSE" ||
        booking.is_deleted === "false"
    );

    tbody.innerHTML = filteredBookings.map(booking => {
        const statusBadge = getStatusBadge(booking.reservation_status);
        const roomTypesRequested = booking.requested_room_type || booking.rooms_summary || 'Multiple Types';
        const assignedRooms = booking.rooms_summary || 'Not Assigned';
        const isAssigned = booking.all_room_numbers && booking.all_room_numbers.trim() !== '';

        return `
            <tr data-reservation-id="${booking.reservation_id}">
                <td>
                    <strong>#${booking.reservation_id}</strong>
                    <br>
                    <small class="text-muted">Online</small>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div>
                            <strong>${booking.guest_name || booking.first_name + ' ' + booking.last_name || 'Unknown Guest'}</strong>
                            <br>
                            <small class="text-muted">ID: ${booking.guest_id || 'N/A'}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <strong>${formatDate(booking.check_in_date)}</strong>
                    <br>
                    <small class="text-muted">${getDaysFromNow(booking.check_in_date)}</small>
                </td>
                <td>
                    <strong>${formatDate(booking.check_out_date)}</strong>
                    <br>
                    <small class="text-muted">${calculateNights(booking.check_in_date, booking.check_out_date)} night(s)</small>
                </td>
                <td>
                    <div class="room-types-requested">
                        ${roomTypesRequested}
                    </div>
                </td>
                <td>
                    <div class="assigned-rooms">
                        ${isAssigned ?
                `<span class="text-success"><i class="fas fa-check-circle me-1"></i>${assignedRooms}</span>` :
                `<span class="text-warning"><i class="fas fa-clock me-1"></i>Pending Assignment</span>`
            }
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td>
                    <strong>${formatDate(booking.created_at)}</strong>
                    <br>
                    <small class="text-muted">${formatTime(booking.created_at)}</small>
                </td>
                <td>
                    ${!isAssigned && booking.reservation_status === 'pending' ?
                `<i class="fas fa-bed action-icon text-primary" style="cursor:pointer; margin-right:10px" onclick="openRoomAssignment(${booking.reservation_id})" title="Assign Rooms"></i>` : ''
            }
                    ${isAssigned && booking.reservation_status === 'pending' ?
                `<i class="fas fa-bed action-icon text-success" style="cursor:pointer; margin-right:10px" onclick="viewAssignedRooms(${booking.reservation_id})" title="View Assigned Rooms (${assignedRooms})"></i>` : ''
            }
                    <i class="fas fa-eye action-icon text-info" onclick="viewBookingDetails(${booking.reservation_id})" title="View Details" style="cursor:pointer; margin-right:10px"></i>
                    ${isAssigned && booking.reservation_status !== 'cancelled' ?
                `<i class="fas fa-history action-icon text-secondary" onclick="viewReservationHistory(${booking.reservation_id})" title="View Reservation History" style="cursor:pointer; margin-right:10px"></i>` :
                `<i class="fas fa-history action-icon text-muted" title="History available after room assignment" style="cursor:not-allowed; margin-right:10px; opacity:0.5"></i>`
            }
                    ${booking.reservation_status === 'pending' && isAssigned ?
                `<i class="fas fa-check action-icon text-success" onclick="confirmBooking(${booking.reservation_id})" title="Confirm Booking" style="cursor:pointer; margin-right:10px"></i>` : ''
            }
                    ${booking.reservation_status === 'pending' ?
                `<i class="fas fa-times action-icon text-danger" onclick="cancelBooking(${booking.reservation_id})" title="Cancel Booking" style="cursor:pointer;"></i>` : ''
            }
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * View assigned rooms for a booking
 */
async function viewAssignedRooms(reservationId) {
    try {
        // Get reserved rooms for this reservation
        const response = await axios.get(`${BASE_URL}/reservations/reserved_rooms.php`, {
            params: {
                operation: 'getReservedRoomsByReservation',
                reservation_id: reservationId
            }
        });

        let reservedRooms = [];
        if (response.data.status === 'success') {
            reservedRooms = response.data.data || [];
        } else {
            // Fallback: get all and filter
            const allResponse = await axios.get(`${BASE_URL}/reservations/reserved_rooms.php`, {
                params: { operation: 'getAllReservedRooms' }
            });
            if (Array.isArray(allResponse.data)) {
                reservedRooms = allResponse.data.filter(r =>
                    String(r.reservation_id) === String(reservationId) && r.is_deleted == 0
                );
            }
        }

        if (reservedRooms.length === 0) {
            Swal.fire('Info', 'No rooms assigned yet for this booking.', 'info');
            return;
        }

        // Build the display HTML
        const roomsHtml = reservedRooms.map(room => {
            const roomInfo = room.room_number ? `Room ${room.room_number}` : 'Room TBD';
            const roomType = room.type_name || 'Unknown Type';

            return `
                <div class="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
                    <div class="flex-grow-1">
                        <div class="fw-bold text-primary">
                            <i class="fas fa-bed me-2"></i>
                            ${roomInfo} - ${roomType}
                        </div>
                        <div class="small text-muted">
                            Reserved Room ID: ${room.reserved_room_id}
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-success">
                            <i class="fas fa-check me-1"></i>Assigned
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        Swal.fire({
            title: `Assigned Rooms - Booking #${reservationId}`,
            html: `
                <div class="text-start">
                    <div class="mb-3">
                        <strong>${reservedRooms.length}</strong> room(s) assigned to this booking:
                    </div>
                    ${roomsHtml}
                    <div class="mt-3 p-2 bg-light rounded">
                        <small class="text-muted">
                            <i class="fas fa-info-circle me-1"></i>
                            Rooms are ready for booking confirmation.
                        </small>
                    </div>
                </div>
            `,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'assigned-rooms-modal'
            }
        });

    } catch (error) {
        console.error('Error loading assigned rooms:', error);
        Swal.fire('Error', 'Failed to load assigned rooms', 'error');
    }
}

/**
 * Open room assignment modal
 */
async function openRoomAssignment(reservationId) {
    currentReservationId = reservationId;
    const booking = currentBookings.find(b => b.reservation_id === reservationId);

    if (!booking) {
        Swal.fire('Error', 'Booking not found', 'error');
        return;
    }

    // Populate modal with booking details
    document.getElementById('modalGuestName').textContent = booking.guest_name || booking.first_name + ' ' + booking.last_name || 'Unknown';
    document.getElementById('modalCheckIn').textContent = formatDate(booking.check_in_date);
    document.getElementById('modalCheckOut').textContent = formatDate(booking.check_out_date);
    document.getElementById('modalBookingId').textContent = `#${booking.reservation_id}`;
    document.getElementById('modalStatus').textContent = booking.reservation_status;
    document.getElementById('modalBookingDate').textContent = formatDate(booking.created_at);

    // Load reserved rooms for this booking
    try {
        const response = await axios.get(`${BASE_URL}/reservations/reserved_rooms.php`, {
            params: {
                operation: 'getReservedRoomsByReservation',
                reservation_id: reservationId
            }
        });

        if (response.data.status === 'success') {
            window.reservedRooms = response.data.data || [];
            renderRoomAssignmentForms(window.reservedRooms, booking.check_in_date, booking.check_out_date);
        } else {
            // If no specific API response, fetch all reserved rooms and filter
            const allReservedResponse = await axios.get(`${BASE_URL}/reservations/reserved_rooms.php`, {
                params: { operation: 'getAllReservedRooms' }
            });

            if (Array.isArray(allReservedResponse.data)) {
                window.reservedRooms = allReservedResponse.data.filter(r =>
                    String(r.reservation_id) === String(reservationId) && r.is_deleted == 0
                );
                renderRoomAssignmentForms(window.reservedRooms, booking.check_in_date, booking.check_out_date);
            }
        }
    } catch (error) {
        console.error('Error loading reserved rooms:', error);
        Swal.fire('Error', 'Failed to load room details', 'error');
        return;
    }

    // Show modal
    new bootstrap.Modal(document.getElementById('roomAssignmentModal')).show();
}

/**
 * Render room assignment forms
 */
async function renderRoomAssignmentForms(reservedRooms, checkIn, checkOut) {
    const container = document.getElementById('roomAssignmentList');

    if (reservedRooms.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                No reserved rooms found for this booking. Please contact support.
            </div>
        `;
        return;
    }

    // Show loading while fetching available rooms for each type
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading available rooms...</span>
            </div>
            <p class="mt-2 text-muted">Checking room availability for ${formatDate(checkIn)} to ${formatDate(checkOut)}...</p>
        </div>
    `;

    try {
        let anyUnavailable = false;
        const roomAssignmentHTML = await Promise.all(reservedRooms.map(async (reservedRoom, index) => {
            // Get available rooms for this specific room type and date range
            let availableRoomsForType = await getAvailableRoomsForDates(
                reservedRoom.room_type_id,
                checkIn,
                checkOut,
                currentReservationId // Exclude current reservation from conflicts
            );

            // Initial filter - remove rooms selected in other dropdowns from initial data
            const otherSelectedRoomIds = reservedRooms
                .map((r, idx) => idx !== index ? r.room_id : null)
                .filter(id => !!id)
                .map(String);

            availableRoomsForType = availableRoomsForType.filter(room => !otherSelectedRoomIds.includes(String(room.room_id)));

            if (availableRoomsForType.length === 0) anyUnavailable = true;

            return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="card-title">
                                    <i class="fas fa-bed me-2"></i>
                                    ${reservedRoom.type_name || 'Room Type'}
                                </h6>
                                <p class="text-muted mb-2">
                                    Reserved Room ID: ${reservedRoom.reserved_room_id}
                                </p>
                                <p class="text-info mb-2">
                                    <i class="fas fa-calendar-alt me-1"></i>
                                    ${formatDate(checkIn)} to ${formatDate(checkOut)}
                                </p>
                                ${reservedRoom.companions && reservedRoom.companions.length > 0 ?
                    `<div class="companions mb-3">
                                        <small class="text-muted">Companions:</small>
                                        <div class="badge bg-light text-dark ms-1">
                                            ${reservedRoom.companions.join(', ')}
                                        </div>
                                    </div>` : ''
                }
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Assign Room Number</label>
                                <select class="form-select room-assignment" 
                                        data-reserved-room-id="${reservedRoom.reserved_room_id}"
                                        data-room-type-id="${reservedRoom.room_type_id}"
                                        data-index="${index}"
                                        ${availableRoomsForType.length === 0 ? 'disabled' : ''}>
                                    <option value="">${availableRoomsForType.length === 0 ? 'No rooms available' : 'Select Room'}</option>
                                    ${availableRoomsForType.map(room => `
                                        <option value="${room.room_id}" 
                                                ${reservedRoom.room_id == room.room_id ? 'selected' : ''}>
                                            Room ${room.room_number} - ${room.type_name}
                                        </option>
                                    `).join('')}
                                </select>
                                ${availableRoomsForType.length === 0 ?
                    `<small class="text-warning">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        No rooms of this type available for the selected dates
                                    </small>` :
                    `<small class="text-success">
                                        <i class="fas fa-check-circle"></i>
                                        ${availableRoomsForType.length} room(s) available for these dates
                                    </small>`
                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }));

        container.innerHTML = roomAssignmentHTML.join('');

        // Add event listeners for dynamic room filtering (prevent duplicate selections)
        const roomSelects = document.querySelectorAll('.room-assignment');
        roomSelects.forEach((select, selectIndex) => {
            select.addEventListener('change', async function () {
                // Re-populate all other selects to exclude newly selected rooms
                await updateAllRoomSelects(reservedRooms, checkIn, checkOut);
            });
        });

        // If any unavailable, show a warning at the top
        if (anyUnavailable) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'alert alert-warning';
            warningDiv.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Some room types have no available rooms for the selected dates. You cannot assign rooms until all are available.';
            container.prepend(warningDiv);
        }

    } catch (error) {
        console.error('Error loading available rooms for dates:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error loading available rooms. Please try again.
            </div>
        `;
    }
}

/**
 * Update all room selects to exclude already selected rooms (dynamic filtering)
 */
async function updateAllRoomSelects(reservedRooms, checkIn, checkOut) {
    const roomSelects = document.querySelectorAll('.room-assignment');

    // Get currently selected room IDs from all dropdowns
    const getAllSelectedRoomIds = () => {
        const selectedIds = [];
        roomSelects.forEach(select => {
            if (select.value) {
                selectedIds.push(String(select.value));
            }
        });
        return selectedIds;
    };

    const allSelectedRoomIds = getAllSelectedRoomIds();

    // Update each select to filter out rooms selected in OTHER selects
    for (let i = 0; i < roomSelects.length; i++) {
        const select = roomSelects[i];
        const reservedRoom = reservedRooms[i];
        const currentValue = select.value; // Preserve current selection

        if (!reservedRoom) continue;

        try {
            // Get available rooms for this room type and date range
            let availableRoomsForType = await getAvailableRoomsForDates(
                reservedRoom.room_type_id,
                checkIn,
                checkOut,
                currentReservationId
            );

            // Filter out rooms selected in OTHER selects (not this one)
            const otherSelectedRoomIds = [];
            roomSelects.forEach((otherSelect, idx) => {
                if (idx !== i && otherSelect.value) {
                    otherSelectedRoomIds.push(String(otherSelect.value));
                }
            });

            availableRoomsForType = availableRoomsForType.filter(room =>
                !otherSelectedRoomIds.includes(String(room.room_id))
            );

            // Rebuild options
            select.innerHTML = `<option value="">${availableRoomsForType.length === 0 ? 'No rooms available' : 'Select Room'}</option>`;

            availableRoomsForType.forEach(room => {
                const option = document.createElement('option');
                option.value = room.room_id;
                option.textContent = `Room ${room.room_number} - ${room.type_name}`;
                option.selected = (room.room_id == currentValue);
                select.appendChild(option);
            });

            // Disable if no rooms available
            select.disabled = availableRoomsForType.length === 0;

            // Update the status message below each select
            const card = select.closest('.card');
            const statusSmall = card?.querySelector('small');
            if (statusSmall) {
                if (availableRoomsForType.length === 0) {
                    statusSmall.className = 'text-warning';
                    statusSmall.innerHTML = '<i class="fas fa-exclamation-triangle"></i> No rooms available (conflicts with other selections)';
                } else {
                    statusSmall.className = 'text-success';
                    statusSmall.innerHTML = `<i class="fas fa-check-circle"></i> ${availableRoomsForType.length} room(s) available`;
                }
            }

        } catch (error) {
            console.error(`Error updating room select ${i}:`, error);
        }
    }
}

/**
 * Save room assignments
 */
async function saveRoomAssignments() {
    const assignments = [];
    const selects = document.querySelectorAll('.room-assignment');
    let hasUnavailable = false;

    for (let select of selects) {
        if (select.disabled) {
            hasUnavailable = true;
            continue;
        }
        const reservedRoomId = select.dataset.reservedRoomId;
        const roomId = select.value;
        if (roomId) {
            assignments.push({
                reserved_room_id: reservedRoomId,
                room_id: roomId,
                reservation_id: currentReservationId // ADD MISSING RESERVATION_ID
            });
        }
    }

    // If any select is disabled (no available rooms), block saving
    if (hasUnavailable) {
        Swal.fire('Error', 'Some room types have no available rooms for the selected dates. Please resolve conflicts before saving.', 'error');
        return;
    }

    // Validate: all reserved rooms must have room_id assigned
    const reservedRooms = window.reservedRooms || [];
    const unassigned = reservedRooms.filter(r => !assignments.find(a => a.reserved_room_id == r.reserved_room_id && a.room_id));
    if (unassigned.length > 0) {
        Swal.fire('Error', 'All reserved rooms must be assigned before saving.', 'error');
        return;
    }
    if (assignments.length === 0) {
        Swal.fire('Warning', 'Please assign at least one room', 'warning');
        return;
    }

    try {
        // Get current user info for audit trail
        let currentUserId = null;
        let currentUserName = 'Unknown Admin';

        try {
            // Get user info from auth system
            if (window.adminAuth && typeof window.adminAuth.getUser === 'function') {
                const userInfo = window.adminAuth.getUser();
                currentUserId = userInfo?.user_id || null;
                currentUserName = userInfo?.username || userInfo?.full_name || 'Admin';
            }
        } catch (authError) {
            console.warn('Could not get current user info:', authError);
        }

        // Save room assignments
        console.log('Saving assignments:', assignments); // DEBUG
        for (let assignment of assignments) {
            const assignmentData = {
                reserved_room_id: assignment.reserved_room_id,
                room_id: assignment.room_id,
                reservation_id: assignment.reservation_id,
                assigned_by_user_id: currentUserId,
                assigned_by_user: currentUserName,
                assigned_at: new Date().toISOString()
            };

            const formData = new FormData();
            formData.append('operation', 'updateReservedRoom');
            formData.append('json', JSON.stringify(assignmentData));

            const response = await axios.post(`${BASE_URL}/reservations/reserved_rooms.php`, formData);
            console.log('Assignment response:', response.data); // DEBUG
        }

        // Save companions for each reserved room
        await saveCompanionsForAssignments(reservedRooms);

        // Also log the assignment action to reservation history
        if (currentReservationId) {
            try {
                const historyData = {
                    reservation_id: currentReservationId,
                    action: 'room_assignment',
                    details: `${assignments.length} room(s) assigned by ${currentUserName}`
                };

                await axios.post(`${BASE_URL}/reservations/reservation_history.php`, historyData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } catch (historyError) {
                console.warn('Could not save to reservation history:', historyError);
                // Don't fail the whole operation if history logging fails
            }
        }

        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Room assignments saved successfully!',
            footer: `Assigned by: ${currentUserName}`
        });

        // Close modal and refresh data
        bootstrap.Modal.getInstance(document.getElementById('roomAssignmentModal')).hide();
        loadOnlineBookings(); // This will refresh the UI and show updated assignment status

    } catch (error) {
        console.error('Error saving room assignments:', error);
        Swal.fire('Error', 'Failed to save room assignments: ' + error.message, 'error');
    }
}

/**
 * Save companions for assigned rooms
 */
async function saveCompanionsForAssignments(reservedRooms) {
    if (!reservedRooms || reservedRooms.length === 0) return;

    try {
        for (const reservedRoom of reservedRooms) {
            if (reservedRoom.companions && reservedRoom.companions.length > 0) {
                // Save companions for this reserved room
                for (const companionName of reservedRoom.companions) {
                    if (companionName && companionName.trim() !== '') {
                        const companionData = {
                            reserved_room_id: reservedRoom.reserved_room_id,
                            full_name: companionName.trim()
                        };

                        const formData = new FormData();
                        formData.append('operation', 'insertCompanion');
                        formData.append('json', JSON.stringify(companionData));

                        await axios.post(`${BASE_URL}/reservations/companions.php`, formData);
                    }
                }
            }
        }
        console.log('Companions saved successfully');
    } catch (error) {
        console.error('Error saving companions:', error);
        // Don't fail the whole assignment operation
    }
}

/**
 * View booking details
 */
async function viewBookingDetails(reservationId) {
    try {
        console.log('Loading booking details for reservation ID:', reservationId);

        // First, get the booking from our current bookings list
        const booking = currentBookings.find(b => b.reservation_id === reservationId);
        let dataToRender = booking;

        if (!booking) {
            console.warn('Booking not found in current list, trying API...');
            // Fallback: try to get from reservations API
            try {
                const reservationResponse = await axios.get(`${BASE_URL}/reservations/reservations.php`, {
                    params: {
                        operation: 'getReservation',
                        json: JSON.stringify({ reservation_id: reservationId })
                    }
                });

                if (reservationResponse.data) {
                    dataToRender = reservationResponse.data;
                    console.log('Got booking from reservations API:', dataToRender);
                }
            } catch (reservationError) {
                console.error('Failed to get reservation from API:', reservationError);
                throw new Error('Booking not found');
            }
        }

        // Try to get billing details, but don't fail if not found
        try {
            const billingResponse = await axios.get(`${BASE_URL}/billing/billing.php`, {
                params: {
                    operation: 'getBillingByReservation',
                    reservation_id: reservationId
                }
            });

            if (billingResponse.data && typeof billingResponse.data === 'object' && billingResponse.data.billing_id) {
                console.log('Billing data found:', billingResponse.data);
                // Merge billing data with reservation data
                dataToRender = { ...dataToRender, ...billingResponse.data };
            } else {
                console.log('No billing record found for this reservation yet - this is normal for pending bookings');
            }
        } catch (billingError) {
            console.warn('Could not load billing details (this is normal for pending bookings):', billingError.message);
            // Continue without billing data - this is expected for pending reservations
        }

        if (!dataToRender) {
            throw new Error('Booking data not available');
        }

        await renderBookingDetails(dataToRender);
        new bootstrap.Modal(document.getElementById('bookingDetailsModal')).show();

    } catch (error) {
        console.error('Error loading booking details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error Loading Booking Details',
            text: `Failed to load booking details: ${error.message}`,
            footer: 'Please try refreshing the page or contact support if the problem persists.'
        });
    }
}

/**
 * Render booking details in modal
 */
async function renderBookingDetails(data) {
    const content = document.getElementById('bookingDetailsContent');

    console.log('Rendering booking details for reservation:', data.reservation_id);
    console.log('Original data received:', data);

    // Try to get complete reservation details first
    let fullReservationData = data;
    try {
        const reservationResponse = await axios.get(`${BASE_URL}/reservations/reservations.php`, {
            params: {
                operation: 'getReservation',
                json: JSON.stringify({ reservation_id: data.reservation_id })
            }
        });

        if (reservationResponse.data && typeof reservationResponse.data === 'object') {
            console.log('Full reservation data:', reservationResponse.data);
            fullReservationData = { ...data, ...reservationResponse.data };
        }
    } catch (error) {
        console.warn('Could not fetch full reservation details:', error);
    }

    // Extract guest name with better fallback logic
    let guestName = 'Unknown Guest';
    if (fullReservationData.guest_name && fullReservationData.guest_name !== 'null null') {
        guestName = fullReservationData.guest_name;
    } else if (fullReservationData.first_name || fullReservationData.last_name) {
        const firstName = fullReservationData.first_name || '';
        const lastName = fullReservationData.last_name || '';
        guestName = `${firstName} ${lastName}`.trim();
        if (guestName === '') guestName = 'Unknown Guest';
    }

    // Extract other details with fallbacks
    const reservationId = fullReservationData.reservation_id || 'N/A';
    const reservationStatus = fullReservationData.reservation_status || 'Unknown';
    const checkInDate = fullReservationData.check_in_date || null;
    const checkOutDate = fullReservationData.check_out_date || null;
    const roomsSummary = fullReservationData.rooms_summary || fullReservationData.all_room_numbers || 'Not Assigned';
    const bookingDate = fullReservationData.created_at || fullReservationData.booking_date || null;
    const guestId = fullReservationData.guest_id || 'N/A';

    console.log('Processed data:', {
        guestName,
        reservationId,
        reservationStatus,
        checkInDate,
        checkOutDate,
        roomsSummary,
        bookingDate,
        guestId
    });

    // Show payment info for confirmed bookings, or show on-hold payment info for pending online bookings
    let paymentInfo = '';
    if (reservationStatus !== 'pending') {
        try {
            const paymentResponse = await axios.get(`${BASE_URL}/payments/payments.php`, {
                params: {
                    operation: 'getPaymentsByReservation',
                    reservation_id: reservationId
                }
            });
            if (paymentResponse.data && Array.isArray(paymentResponse.data) && paymentResponse.data.length > 0) {
                const payments = paymentResponse.data;
                paymentInfo = `
                    <div class="col-12 mt-4">
                        <h6>Payment Information</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Method</th>
                                        <th>Amount</th>
                                        <th>Reference</th>
                                        <th>Proof</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${payments.map(payment => `
                                        <tr>
                                            <td>${formatDate(payment.payment_date)}</td>
                                            <td>${payment.sub_method_name || payment.method_name || 'N/A'}</td>
                                            <td>₱${Number(payment.amount_paid || 0).toLocaleString()}</td>
                                            <td>${payment.reference_number || 'N/A'}</td>
                                            <td>
                                                ${payment.proof_of_payment_url ?
                        `<button class="btn btn-sm btn-outline-primary" onclick="viewProofOfPayment('../../assets/images/payment/${payment.proof_of_payment_url}')">
                                                        <i class="fas fa-image me-1"></i>View
                                                    </button>` :
                        '<span class="text-muted">None</span>'
                    }
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            } else {
                paymentInfo = `
                    <div class="col-12 mt-4">
                        <h6>Payment Information</h6>
                        <p class="text-muted">No payment records found for this reservation.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading payment info:', error);
            paymentInfo = `
                <div class="col-12 mt-4">
                    <h6>Payment Information</h6>
                    <p class="text-danger">Error loading payment information: ${error.message}</p>
                </div>
            `;
        }
    } else {
        // Show on-hold payment info if available
        let onHold = null;
        try {
            if (fullReservationData.on_hold_payment_info) {
                onHold = typeof fullReservationData.on_hold_payment_info === 'string'
                    ? JSON.parse(fullReservationData.on_hold_payment_info)
                    : fullReservationData.on_hold_payment_info;
            }
        } catch (e) { onHold = null; }
        if (onHold) {
            paymentInfo = `
                <div class="col-12 mt-4">
                    <h6>On-Hold Payment Information</h6>
                    <table class="table table-sm">
                        <tr><td><strong>Method:</strong></td><td>${onHold.method_name || 'N/A'}</td></tr>
                        <tr><td><strong>Amount:</strong></td><td>₱${Number(onHold.amount || 0).toLocaleString()}</td></tr>
                        <tr><td><strong>Reference #:</strong></td><td>${onHold.reference_number || 'N/A'}</td></tr>
                        <tr><td><strong>Notes:</strong></td><td>${onHold.notes || ''}</td></tr>
                        <tr><td><strong>Proof:</strong></td><td>${onHold.proof_of_payment_url ? `<button class='btn btn-sm btn-outline-primary' onclick=\"viewProofOfPayment('../../assets/images/payment/${onHold.proof_of_payment_url}')\"><i class='fas fa-image me-1'></i>View</button>` : '<span class="text-muted">None</span>'}</td></tr>
                    </table>
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-success" id="confirmAndCreateBillingBtn"><i class="fas fa-check me-1"></i>Confirm & Create Billing</button>
                    </div>
                </div>
            `;
        } else {
            paymentInfo = `
                <div class="col-12 mt-4">
                    <h6>Payment Information</h6>
                    <p class="text-muted">No payment info submitted yet.</p>
                </div>
            `;
        }
    }

    // Get reserved rooms and companions information
    let roomsInfo = '';
    try {
        const roomsResponse = await axios.get(`${BASE_URL}/reservations/reserved_rooms.php`, {
            params: {
                operation: 'getReservedRoomsByReservation',
                reservation_id: reservationId
            }
        });

        if (roomsResponse.data && roomsResponse.data.status === 'success' && roomsResponse.data.data) {
            const reservedRooms = roomsResponse.data.data;
            if (reservedRooms.length > 0) {
                roomsInfo = `
                    <div class="col-12 mt-4">
                        <h6>Room Details</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Room Type</th>
                                        <th>Room Number</th>
                                        <th>Companions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${reservedRooms.map(room => `
                                        <tr>
                                            <td>${room.type_name || 'N/A'}</td>
                                            <td>${room.room_number || 'Not Assigned'}</td>
                                            <td>${room.companions && room.companions.length > 0 ? room.companions.join(', ') : 'None'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.warn('Could not load room details:', error);
    }

    content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Guest Information</h6>
                <table class="table table-sm">
                    <tr><td><strong>Name:</strong></td><td>${guestName}</td></tr>
                    <tr><td><strong>Guest ID:</strong></td><td>#${guestId}</td></tr>
                    <tr><td><strong>Reservation ID:</strong></td><td>#${reservationId}</td></tr>
                    <tr><td><strong>Status:</strong></td><td>${getStatusBadge(reservationStatus)}</td></tr>
                    <tr><td><strong>Type:</strong></td><td><span class="badge bg-primary">Online</span></td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Booking Details</h6>
                <table class="table table-sm">
                    <tr><td><strong>Check-in:</strong></td><td>${formatDate(checkInDate)}</td></tr>
                    <tr><td><strong>Check-out:</strong></td><td>${formatDate(checkOutDate)}</td></tr>
                    <tr><td><strong>Rooms Summary:</strong></td><td>${roomsSummary}</td></tr>
                    <tr><td><strong>Booking Date:</strong></td><td>${formatDate(bookingDate)}</td></tr>
                </table>
            </div>
            ${roomsInfo}
            ${paymentInfo}
        </div>
    `;

    // Attach handler for confirm & create billing if button exists
    if (reservationStatus === 'pending' && document.getElementById('confirmAndCreateBillingBtn')) {
        document.getElementById('confirmAndCreateBillingBtn').onclick = async function () {
            await confirmAndCreateBilling(reservationId);
        };
    }
}

// New: Confirm and create billing for pending online booking
async function confirmAndCreateBilling(reservationId) {
    const result = await Swal.fire({
        title: 'Confirm Booking & Create Billing',
        text: 'Are you sure you want to confirm this booking and move payment info to billing?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, confirm & create billing!'
    });
    if (!result.isConfirmed) return;
    try {
        // Call backend to confirm and move payment info
        const formData = new FormData();
        formData.append('operation', 'confirmAndCreateBilling');
        formData.append('reservation_id', reservationId);
        const response = await axios.post(`${BASE_URL}/reservations/reservations.php`, formData);
        if (response.data && response.data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Booking confirmed and billing/payment created!'
            });
            loadOnlineBookings();
            // Optionally close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('bookingDetailsModal'));
            if (modal) modal.hide();
        } else {
            throw new Error(response.data.message || 'Failed to confirm and create billing');
        }
    } catch (error) {
        Swal.fire('Error', error.message || 'Failed to confirm and create billing', 'error');
    }
}


/**
 * Confirm booking
 */
async function confirmBooking(reservationId) {
    const result = await Swal.fire({
        title: 'Confirm Booking',
        text: 'Are you sure you want to confirm this booking?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, confirm it!'
    });

    if (result.isConfirmed) {
        try {
            // Find confirmed status ID
            const confirmedStatus = cachedStatuses.find(s => s.reservation_status.toLowerCase() === 'confirmed');
            if (!confirmedStatus) {
                throw new Error('Confirmed status not found');
            }

            // Get current user info for audit trail
            let currentUserId = null;
            let currentUserName = 'Unknown Admin';

            try {
                if (window.adminAuth && typeof window.adminAuth.getUser === 'function') {
                    const userInfo = window.adminAuth.getUser();
                    currentUserId = userInfo?.user_id || null;
                    currentUserName = userInfo?.username || userInfo?.full_name || 'Admin';
                }
            } catch (authError) {
                console.warn('Could not get current user info:', authError);
            }

            const formData = new FormData();
            formData.append('operation', 'changeReservationStatus');
            formData.append('json', JSON.stringify({
                reservation_id: reservationId,
                new_status_id: confirmedStatus.reservation_status_id,
                changed_by_user_id: currentUserId,
                changed_by_user: currentUserName
            }));

            const response = await axios.post(`${BASE_URL}/reservations/reservation_status.php`, formData);

            if (response.data && response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Booking confirmed successfully!',
                    footer: `Confirmed by: ${currentUserName}`
                });
                loadOnlineBookings();
            } else {
                throw new Error(response.data.message || 'Failed to confirm booking');
            }
        } catch (error) {
            console.error('Error confirming booking:', error);
            Swal.fire('Error', 'Failed to confirm booking', 'error');
        }
    }
}

/**
 * Cancel booking
 */
async function cancelBooking(reservationId) {
    const result = await Swal.fire({
        title: 'Cancel Booking',
        text: 'Are you sure you want to cancel this booking?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, cancel it!'
    });

    if (result.isConfirmed) {
        try {
            // Find cancelled status ID
            const cancelledStatus = cachedStatuses.find(s => s.reservation_status.toLowerCase() === 'cancelled');
            if (!cancelledStatus) {
                throw new Error('Cancelled status not found');
            }

            // Get current user info for audit trail
            let currentUserId = null;
            let currentUserName = 'Unknown Admin';

            try {
                if (window.adminAuth && typeof window.adminAuth.getUser === 'function') {
                    const userInfo = window.adminAuth.getUser();
                    currentUserId = userInfo?.user_id || null;
                    currentUserName = userInfo?.username || userInfo?.full_name || 'Admin';
                }
            } catch (authError) {
                console.warn('Could not get current user info:', authError);
            }

            const formData = new FormData();
            formData.append('operation', 'changeReservationStatus');
            formData.append('json', JSON.stringify({
                reservation_id: reservationId,
                new_status_id: cancelledStatus.reservation_status_id,
                changed_by_user_id: currentUserId,
                changed_by_user: currentUserName
            }));

            const response = await axios.post(`${BASE_URL}/reservations/reservation_status.php`, formData);

            if (response.data && response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Booking cancelled successfully!',
                    footer: `Cancelled by: ${currentUserName}`
                });
                loadOnlineBookings();
            } else {
                throw new Error(response.data.message || 'Failed to cancel booking');
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            Swal.fire('Error', 'Failed to cancel booking', 'error');
        }
    }
}

/**
 * Initialize filters
 */
function initializeFilters() {
    // Set default date filters (today to one week from now)
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    const dateFromFilter = document.getElementById('dateFromFilter');
    const dateToFilter = document.getElementById('dateToFilter');

    if (dateFromFilter) dateFromFilter.value = today.toISOString().split('T')[0];
    if (dateToFilter) dateToFilter.value = oneWeekFromNow.toISOString().split('T')[0];
}

/**
 * Apply filters
 */
function applyFilters() {
    loadOnlineBookings();
}

/**
 * Update counters (similar to reservations.js)
 */
function updateCounters() {
    const pendingAssignment = currentBookings.filter(b =>
        b.reservation_status === 'pending' && (!b.all_room_numbers || b.all_room_numbers.trim() === '')
    ).length;

    const roomsAssigned = currentBookings.filter(b =>
        b.all_room_numbers && b.all_room_numbers.trim() !== ''
    ).length;

    const confirmed = currentBookings.filter(b => b.reservation_status === 'confirmed').length;
    const checkedIn = currentBookings.filter(b => b.reservation_status === 'checked-in').length;
    const checkedOut = currentBookings.filter(b => b.reservation_status === 'checked-out').length;
    const cancelled = currentBookings.filter(b => b.reservation_status === 'cancelled').length;

    // Update stat cards
    const elements = [
        'statPendingAssignment', 'statRoomsAssigned', 'statConfirmed',
        'statCheckedIn', 'statCheckedOut', 'statCancelled'
    ];
    const values = [pendingAssignment, roomsAssigned, confirmed, checkedIn, checkedOut, cancelled];

    elements.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) element.textContent = values[index];
    });

    // Update header badges
    const pendingCountEl = document.getElementById('pendingCount');
    const confirmedCountEl = document.getElementById('confirmedCount');

    if (pendingCountEl) pendingCountEl.textContent = `${pendingAssignment} Pending`;
    if (confirmedCountEl) confirmedCountEl.textContent = `${confirmed} Confirmed`;
}

/**
 * Show/hide loading spinner
 */
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const table = document.getElementById('onlineBookingsTable');

    if (spinner && table) {
        if (show) {
            spinner.classList.remove('d-none');
            table.style.display = 'none';
        } else {
            spinner.classList.add('d-none');
            table.style.display = 'table';
        }
    }
}

/**
 * Show/hide no data message
 */
function showNoData(show) {
    const noData = document.getElementById('noDataMessage');
    const table = document.getElementById('onlineBookingsTable');

    if (noData && table) {
        if (show) {
            noData.classList.remove('d-none');
            table.style.display = 'none';
        } else {
            noData.classList.add('d-none');
            table.style.display = 'table';
        }
    }
}

/**
 * Utility Functions
 */

function getStatusBadge(status) {
    const statusClasses = {
        'pending': 'bg-warning text-dark',
        'confirmed': 'bg-success',
        'checked-in': 'bg-primary',
        'checked-out': 'bg-secondary',
        'cancelled': 'bg-danger'
    };

    const className = statusClasses[status] || 'bg-secondary';
    return `<span class="badge ${className}">${status || 'Unknown'}</span>`;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getDaysFromNow(dateString) {
    if (!dateString) return 'N/A';
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays === -1) return 'Yesterday';
    return `${Math.abs(diffDays)} days ago`;
}

function calculateNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = checkOutDate - checkInDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * View proof of payment image in modal
 */
function viewProofOfPayment(imageUrl) {
    // Handle different image URL formats
    let fullImageUrl = imageUrl;

    // If imageUrl doesn't start with http or /, assume it's a filename
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        fullImageUrl = `../../assets/images/payment/${imageUrl}`;
    }

    // Create a test image to check if the file exists
    const testImg = new Image();
    testImg.onload = function () {
        // Image exists, show it
        Swal.fire({
            title: 'Proof of Payment',
            imageUrl: fullImageUrl,
            imageWidth: 'auto',
            imageHeight: 400,
            imageAlt: 'Proof of Payment',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                image: 'img-fluid'
            }
        });
    };
    testImg.onerror = function () {
        // Image doesn't exist, try alternative paths
        const alternativePaths = [
            `/Hotel-Reservation-Billing-System/assets/images/payment/${imageUrl}`,
            `../../assets/images/uploads/${imageUrl}`,
            `/Hotel-Reservation-Billing-System/assets/images/uploads/${imageUrl}`,
            imageUrl // Try the original URL as-is
        ];

        tryAlternativePaths(alternativePaths, 0);
    };
    testImg.src = fullImageUrl;
}

/**
 * Try alternative image paths if the main one fails
 */
function tryAlternativePaths(paths, index) {
    if (index >= paths.length) {
        // All paths failed
        Swal.fire({
            icon: 'error',
            title: 'Image Not Found',
            text: 'The proof of payment image could not be loaded. The file may have been moved or deleted.',
            footer: 'Please contact support if this issue persists.'
        });
        return;
    }

    const testImg = new Image();
    testImg.onload = function () {
        // Found a working path
        Swal.fire({
            title: 'Proof of Payment',
            imageUrl: paths[index],
            imageWidth: 'auto',
            imageHeight: 400,
            imageAlt: 'Proof of Payment',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                image: 'img-fluid'
            }
        });
    };
    testImg.onerror = function () {
        // Try next path
        tryAlternativePaths(paths, index + 1);
    };
    testImg.src = paths[index];
}

/**
 * View reservation history for a specific reservation
 */
async function viewReservationHistory(reservationId) {
    try {
        const response = await axios.get(`${BASE_URL}/reservations/reservation_history.php`, {
            params: { reservation_id: reservationId }
        });

        if (response.data.status === 'success') {
            const history = response.data.data || [];
            displayReservationHistory(reservationId, history);
        } else {
            Swal.fire('Error', 'Failed to load reservation history', 'error');
        }
    } catch (error) {
        console.error('Error loading reservation history:', error);
        Swal.fire('Error', 'Failed to load reservation history', 'error');
    }
}

/**
 * Display reservation history in a modal
 */
function displayReservationHistory(reservationId, history) {
    const historyHtml = history.length > 0 ?
        history.map(entry => {
            const date = new Date(entry.changed_at);
            const formattedDate = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            let statusIcon = '<i class="fas fa-question-circle text-secondary"></i>';
            if (entry.reservation_status === 'confirmed') statusIcon = '<i class="fas fa-check-circle text-info"></i>';
            else if (entry.reservation_status === 'pending') statusIcon = '<i class="fas fa-hourglass-half text-warning"></i>';
            else if (entry.reservation_status === 'checked-in') statusIcon = '<i class="fas fa-door-open text-success"></i>';
            else if (entry.reservation_status === 'checked-out') statusIcon = '<i class="fas fa-sign-out-alt text-primary"></i>';
            else if (entry.reservation_status === 'cancelled') statusIcon = '<i class="fas fa-times-circle text-danger"></i>';

            let userIcon = '<i class="fas fa-robot me-1 text-muted"></i>';
            if (entry.changed_by_username) {
                if ((entry.changed_by_role || '').toLowerCase().includes('admin')) {
                    userIcon = '<i class="fas fa-user-shield me-1" style="color:#0d6efd"></i>';
                } else if ((entry.changed_by_role || '').toLowerCase().includes('front')) {
                    userIcon = '<i class="fas fa-user-tie me-1" style="color:#fd7e14"></i>';
                } else {
                    userIcon = '<i class="fas fa-user-circle me-1 text-primary"></i>';
                }
            }

            return `
                <div class="d-flex align-items-center mb-3 p-3 border rounded">
                    <div class="me-3">
                        ${statusIcon}
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-bold">${entry.reservation_status || 'Unknown Status'}</div>
                        <div class="small text-muted">
                            ${userIcon} Changed by: ${entry.changed_by_username || 'System'} (${entry.changed_by_role || 'Unknown'})
                        </div>
                        <div class="small text-muted">${formattedDate}</div>
                    </div>
                </div>
            `;
        }).join('')
        : '<div class="text-center text-muted py-4"><i class="fas fa-inbox fa-2x mb-2"></i><br>No history found</div>';

    Swal.fire({
        title: `Reservation History - #${reservationId}`,
        html: `
            <div class="text-start">
                ${historyHtml}
            </div>
        `,
        width: '600px',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            popup: 'reservation-history-modal'
        }
    });
}

// Auto-refresh every 5 minutes
setInterval(loadOnlineBookings, 5 * 60 * 1000);