// Edit Reservation Module Based on Add Reservation Structure

export async function showEditReservationModal(reservation) {
    console.log('Opening edit modal for reservation:', reservation);

    try {
        // Fetch comprehensive reservation data including room assignments and companions
        const reservationData = await fetchReservationDetails(reservation.reservation_id);
        const companions = await fetchCompanions(reservation.reservation_id);
        const roomTypes = await fetchRoomTypes();
        const idTypes = await fetchIDTypes();

        console.log('Fetched data:', { reservationData, companions, roomTypes });

        // Create and show the edit modal using the same structure as add reservation
        createEditReservationModal(reservationData, companions, roomTypes, idTypes);

    } catch (error) {
        console.error('Error loading edit reservation modal:', error);
        showErrorToast('Failed to load reservation data. Please try again.');
    }
}

// Fetch reservation details with all related data
async function fetchReservationDetails(reservationId) {
    try {
        const response = await axios.get(`../../api/admin/reservations/reservations.php?reservation_id=${reservationId}`);
        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        console.log('Reservation details:', data);
        return data;
    } catch (error) {
        console.error('Error fetching reservation details:', error);
        throw error;
    }
}

// Fetch companions for the reservation
async function fetchCompanions(reservationId) {
    try {
        const response = await axios.get(`../../api/admin/reservations/companions_for_reservation.php?reservation_id=${reservationId}`);
        return response.data || [];
    } catch (error) {
        console.warn('Failed to fetch companions:', error);
        return [];
    }
}

// Fetch room types
async function fetchRoomTypes() {
    try {
        const response = await axios.get('../../api/admin/rooms/room-type.php');
        return response.data || [];
    } catch (error) {
        console.warn('Failed to fetch room types:', error);
        return [];
    }
}

// Fetch ID types
async function fetchIDTypes() {
    try {
        const response = await axios.get('../../api/admin/guests/id_types.php?operation=getAllIDTypes');
        return response.data || [];
    } catch (error) {
        console.warn('Failed to fetch ID types:', error);
        return [];
    }
}

// Create the edit modal using the exact same structure as add reservation
function createEditReservationModal(reservation, companions, roomTypes, idTypes) {
    // Remove existing modal if any
    const existingModal = document.getElementById('editReservationModal');
    if (existingModal) existingModal.remove();

    // Use the same structure as add modal (multi-room, summary, payment)
    const modalHTML = `
        <div class="modal fade" id="editReservationModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h4 class="modal-title" id="editReservationModalLabel"><i class="fas fa-edit me-2"></i>Edit Reservation</h4>
                </div>
                <div class="modal-body p-4">
                    <div class="alert alert-info d-flex align-items-center mb-4" role="alert">
                        <i class="fas fa-info-circle fa-lg me-2"></i>
                        <div>
                            Fill in all required fields. Select an existing guest or add a new one. Room and status options will update automatically.
                        </div>
                    </div>
                    <form id="editReservationForm">
                        <input type="hidden" id="editReservationId" value="${reservation.reservation_id || ''}">
                        <input type="hidden" id="editGuestId" value="${reservation.guest_id || ''}">
                        <div class="row g-4">
                            <div class="col-lg-6">
                                <div class="card mb-4 shadow-sm border-0">
                                    <div class="card-header bg-light border-bottom-0">
                                        <h6 class="mb-0"><i class="fas fa-user me-2"></i>Guest Information</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-3">
                                            <div class="col-md-12">
                                                <label for="guestSearchInput" class="form-label">Search Existing Guest</label>
                                                <input type="text" id="guestSearchInput" class="form-control" placeholder="Type name or email..." value="${reservation.email || ''}">
                                                <div id="guestSearchDropdown" class="list-group position-absolute w-100" style="z-index: 10; display: none;"></div>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="editFirstName" class="form-label">First Name</label>
                                                <input type="text" id="editFirstName" class="form-control" required value="${reservation.first_name || ''}">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="editLastName" class="form-label">Last Name</label>
                                                <input type="text" id="editLastName" class="form-control" required value="${reservation.last_name || ''}">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="editMiddleName" class="form-label">Middle Name</label>
                                                <input type="text" id="editMiddleName" class="form-control" value="${reservation.middle_name || ''}">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="editDateOfBirth" class="form-label">Date of Birth</label>
                                                <input type="date" id="editDateOfBirth" class="form-control" required value="${reservation.date_of_birth ? reservation.date_of_birth.split('T')[0] : ''}">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="editSuffix" class="form-label">Suffix</label>
                                                <input type="text" id="editSuffix" class="form-control" value="${reservation.suffix || ''}">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="editEmail" class="form-label">Email</label>
                                                <input type="email" id="editEmail" class="form-control" required value="${reservation.email || ''}">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="editPhone" class="form-label">Phone</label>
                                                <input type="tel" id="editPhone" class="form-control" required value="${reservation.phone_number || ''}">
                                            </div>
                                            <div class="col-md-6">
                                                <label for="editIdType" class="form-label">ID Type</label>
                                                <select id="editIdType" class="form-select" required>
                                                    <option value="">-- Select ID Type --</option>
                                                    ${idTypes.map(type => `<option value="${type.id_type_id}" ${type.id_type_id == reservation.id_type ? 'selected' : ''}>${type.type_name}</option>`).join('')}
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <label for="editIdNumber" class="form-label">ID Number</label>
                                                <input type="text" id="editIdNumber" class="form-control" required value="${reservation.id_number || ''}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="card mb-4 shadow-sm border-0">
                                    <div class="card-header bg-light border-bottom-0">
                                        <h6 class="mb-0"><i class="fas fa-bed me-2"></i>Stay Information</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-3">
                                            <div class="col-6">
                                                <label for="editCheckInDate" class="form-label">Check-in Date</label>
                                                <input type="date" id="editCheckInDate" class="form-control" required value="${reservation.check_in_date ? reservation.check_in_date.split('T')[0] : ''}">
                                            </div>
                                            <div class="col-6">
                                                <label for="editCheckOutDate" class="form-label">Check-out Date</label>
                                                <input type="date" id="editCheckOutDate" class="form-control" required readonly value="${reservation.check_out_date ? reservation.check_out_date.split('T')[0] : ''}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="card mb-4 shadow-sm border-0">
                                    <div class="card-header bg-light border-bottom-0">
                                        <h6 class="mb-0"><i class="fas fa-tasks me-2"></i>Reservation Status</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-3">
                                            <div class="col-12">
                                                <label class="form-label">Status</label>
                                                <input type="text" class="form-control" value="${reservation.reservation_status || 'Confirmed'}" readonly disabled>
                                                <input type="hidden" id="editStatusSelect" value="${reservation.reservation_status_id || 1}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Multi-Room Booking Section -->
                        <div class="row g-0">
                            <div class="col-12">
                                <div class="card mb-4 border-0 shadow-lg animate__animated animate__fadeIn">
                                    <div class="card-header bg-gradient-primary border-bottom-0 d-flex align-items-center justify-content-between"
                                        style="background: linear-gradient(90deg, #3b0101 0%, #D20707 100%); color: #fff;">
                                        <div>
                                            <i class="fas fa-bed fa-lg me-2"></i>
                                            <h6 class="mb-0 d-inline">Rooms &amp; Companions</h6>
                                        </div>
                                        <button type="button" class="btn btn-light btn-sm fw-bold shadow-sm" id="editAddRoomBtn" title="Add Room"><i class="fas fa-plus"></i> Add Room</button>
                                    </div>
                                    <div class="card-body py-4" id="editMultiRoomContainer" style="background: #f8fafd;">
                                        <!-- Dynamic room sections will be injected here by JS -->
                                    </div>
                                    <div class="form-text text-muted mt-2 ms-3"><i class="fas fa-info-circle me-1"></i>Each companion must present a valid ID upon check-in. <span class="fw-semibold">The main guest is auto-assigned to the first room.</span></div>
                                </div>
                            </div>
                        </div>
                        <!-- Room Summary Section -->
                        <div class="row g-0">
                            <div class="col-12">
                                <div class="card mb-4 shadow-sm border-0">
                                    <div class="card-header bg-light border-bottom-0">
                                        <h6 class="mb-0"><i class="fas fa-list-ul me-2 text-primary"></i>Booking Summary</h6>
                                    </div>
                                    <div class="card-body" id="editMultiRoomSummary">
                                        <!-- Room summary and total bill will be shown here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Payment Method and Partial Payment in Booking Summary -->
                        <div class="row g-0">
                            <div class="col-12">
                                <div class="card mb-4 shadow-sm border-0">
                                    <div class="card-header bg-light border-bottom-0">
                                        <h6 class="mb-0"><i class="fas fa-credit-card me-2 text-info"></i>Payment Method & Partial Payment</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-3 align-items-center">
                                            <div class="col-md-6">
                                                <label for="editPaymentMethodSelect" class="form-label mb-1"><i class="fas fa-credit-card fa-sm text-info me-1"></i>Payment Method</label>
                                                <select id="editPaymentMethodSelect" class="form-select form-select-sm">
                                                    <option value="">Loading...</option>
                                                </select>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="fs-5 fw-bold text-warning">Partial Payment (50%): <span id="editPartialPayment">₱0.00</span></div>
                                                <div class="small text-muted">This is 50% of the total for all rooms booked.</div>
                                            </div>
                                        </div>
                                        <!-- Reference Number Field (for GCash/PayMaya) -->
                                        <div class="row g-3 mt-2" id="editReferenceNumberContainer" style="display: none;">
                                            <div class="col-md-6">
                                                <label for="editReferenceNumber" class="form-label mb-1"><i class="fas fa-receipt fa-sm text-success me-1"></i>Reference Number</label>
                                                <input type="text" id="editReferenceNumber" class="form-control form-control-sm" placeholder="Enter payment reference number">
                                                <div class="form-text">Required for GCash and PayMaya payments</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer bg-light">
                    <button type="button" id="editSaveReservationBtn" class="btn btn-primary btn-m"><i class="fas fa-save me-2"></i>Update Reservation</button>
                </div>
            </div>
        </div>
    `;

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize the modal functionality
    initializeEditModal(reservation, companions, roomTypes);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editReservationModal'));
    modal.show();
}// Initialize edit modal functionality
async function initializeEditModal(reservation, companions, roomTypes) {
    // Populate Rooms & Companions section
    const roomContainer = document.getElementById('editMultiRoomContainer');
    if (roomContainer) {
        // Room type select
        const roomTypeOptions = roomTypes.map(type =>
            `<option value="${type.room_type_id}" data-price="${type.price_per_stay}" ${type.room_type_id == reservation.room_type_id ? 'selected' : ''}>${type.type_name} - ₱${type.price_per_stay}</option>`
        ).join('');

        // Room select (only current room for now)
        const roomSelect = `<option value="${reservation.room_id}" selected>${reservation.room_number} (Current)</option>`;

        // Companions
        const companionInputs = (companions && companions.length > 0)
            ? companions.map(c => `
                <div class="companion-item input-group mb-2">
                    <span class="input-group-text"><i class="fas fa-user text-success"></i></span>
                    <input type="text" class="form-control companion-name" value="${c.full_name || c.name || ''}" placeholder="Companion Name" data-companion-id="${c.companion_id || c.guest_id || ''}">
                    <button type="button" class="btn btn-outline-danger remove-companion-btn"><i class="fas fa-times"></i></button>
                </div>
            `).join('')
            : '<p class="text-muted">No companions assigned to this room.</p>';

        roomContainer.innerHTML = `
            <div class="room-section border rounded p-4 mb-3 bg-white shadow-sm">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <h6 class="text-primary fw-bold mb-0"><i class="fas fa-bed me-2"></i>Room Assignment</h6>
                    <span class="badge bg-info">Room ${reservation.room_number || 'N/A'}</span>
                </div>
                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Room Type</label>
                        <select class="form-select room-type-select" required>${roomTypeOptions}</select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label fw-semibold">Room Number</label>
                        <select class="form-select room-select" required>${roomSelect}</select>
                    </div>
                </div>
                <div class="companions-section">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0 text-success"><i class="fas fa-users me-2"></i>Room Companions</h6>
                        <button type="button" class="btn btn-outline-success btn-sm add-companion-btn"><i class="fas fa-plus me-1"></i>Add Companion</button>
                    </div>
                    <div class="companions-list">${companionInputs}</div>
                </div>
            </div>
        `;
    }

    // Populate booking summary
    const summaryContainer = document.getElementById('editMultiRoomSummary');
    if (summaryContainer) {
        // Calculate nights
        const checkIn = new Date(reservation.check_in_date);
        const checkOut = new Date(reservation.check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const roomRate = parseFloat(reservation.price_per_stay) || 0;
        const totalAmount = roomRate * nights;
        const guestCount = 1 + (companions ? companions.length : 0);
        summaryContainer.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="border rounded p-3 h-100">
                        <h6 class="text-primary mb-3"><i class="fas fa-bed me-2"></i>Room Details</h6>
                        <div class="row g-2">
                            <div class="col-6"><small class="text-muted">Room Number:</small><div class="fw-bold">${reservation.room_number || 'N/A'}</div></div>
                            <div class="col-6"><small class="text-muted">Room Type:</small><div class="fw-bold">${reservation.type_name || 'N/A'}</div></div>
                            <div class="col-6"><small class="text-muted">Rate per Night:</small><div class="fw-bold">₱${roomRate.toFixed(2)}</div></div>
                            <div class="col-6"><small class="text-muted">Total Guests:</small><div class="fw-bold">${guestCount} ${guestCount === 1 ? 'guest' : 'guests'}</div></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="border rounded p-3 h-100">
                        <h6 class="text-success mb-3"><i class="fas fa-calendar-check me-2"></i>Stay Details</h6>
                        <div class="row g-2">
                            <div class="col-6"><small class="text-muted">Check-in:</small><div class="fw-bold">${formatDate(reservation.check_in_date)}</div></div>
                            <div class="col-6"><small class="text-muted">Check-out:</small><div class="fw-bold">${formatDate(reservation.check_out_date)}</div></div>
                            <div class="col-6"><small class="text-muted">Nights:</small><div class="fw-bold">${nights} ${nights === 1 ? 'night' : 'nights'}</div></div>
                            <div class="col-6"><small class="text-muted">Status:</small><div class="fw-bold"><span class="badge bg-${getStatusColor(reservation.reservation_status)}">${reservation.reservation_status || 'Confirmed'}</span></div></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-12">
                    <div class="border rounded p-3">
                        <h6 class="text-info mb-3"><i class="fas fa-users me-2"></i>Guest Information</h6>
                        <div class="row g-3">
                            <div class="col-md-6"><small class="text-muted">Main Guest:</small><div class="fw-bold">${reservation.first_name} ${reservation.middle_name || ''} ${reservation.last_name} ${reservation.suffix || ''}</div><small class="text-muted">${reservation.email} • ${reservation.phone_number}</small></div>
                            <div class="col-md-6"><small class="text-muted">Companions (${companions ? companions.length : 0}):</small><div class="companions-summary">${companions && companions.length > 0 ? companions.map(c => `<div class="fw-bold small">${c.full_name || c.name || 'Unnamed companion'}</div>`).join('') : '<div class="text-muted small">No companions</div>'}</div></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row g-3 mt-2">
                <div class="col-12">
                    <div class="bg-primary text-white rounded p-3 text-center">
                        <div class="row align-items-center">
                            <div class="col-md-8 text-start"><h5 class="mb-0">Total Amount</h5><small class="opacity-75">${reservation.type_name} • ${nights} ${nights === 1 ? 'night' : 'nights'} • ${guestCount} ${guestCount === 1 ? 'guest' : 'guests'}</small></div>
                            <div class="col-md-4 text-end"><div class="h3 mb-0">₱${totalAmount.toFixed(2)}</div></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Set up event listeners
    setupEditEventListeners(reservation);

    // Auto-calculate checkout date when check-in changes
    document.getElementById('editCheckInDate').addEventListener('change', function () {
        const checkInDate = new Date(this.value);
        if (checkInDate) {
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkInDate.getDate() + 1);
            document.getElementById('editCheckOutDate').value = checkOutDate.toISOString().split('T')[0];

            // Update booking summary when dates change
            updateEditBookingSummary();
        }
    });
}

// Populate room assignment section (matching add reservation style)


// Load available rooms when room type changes
async function loadAvailableRooms(roomTypeId, roomSelect, reservation) {
    if (!roomTypeId) {
        roomSelect.innerHTML = '<option value="">Select Room Number...</option>';
        return;
    }

    try {
        const checkIn = document.getElementById('editCheckInDate').value;
        const checkOut = document.getElementById('editCheckOutDate').value;

        const response = await axios.get('../../api/admin/rooms/rooms.php', {
            params: {
                available: 1,
                check_in_date: checkIn,
                check_out_date: checkOut,
                exclude_reservation_id: reservation.reservation_id
            }
        });

        const rooms = response.data?.rooms || [];
        const availableRooms = rooms.filter(room => room.room_type_id == roomTypeId);

        roomSelect.innerHTML = '<option value="">Select Room Number...</option>';

        // Add current room if it's the same type
        if (reservation.room_id && reservation.room_type_id == roomTypeId) {
            roomSelect.innerHTML += `<option value="${reservation.room_id}" selected>${reservation.room_number} (Current)</option>`;
        }

        // Add available rooms
        availableRooms.forEach(room => {
            if (room.room_id != reservation.room_id) {
                roomSelect.innerHTML += `<option value="${room.room_id}">${room.room_number}</option>`;
            }
        });

    } catch (error) {
        console.error('Error loading available rooms:', error);
        roomSelect.innerHTML = '<option value="">Error loading rooms</option>';
    }
}

// Setup companion add/remove handlers

// Setup event listeners for the edit form
function setupEditEventListeners(reservation) {
    const saveBtn = document.getElementById('editSaveReservationBtn');
    const form = document.getElementById('editReservationForm');

    saveBtn.addEventListener('click', async function () {
        // Validate form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        // Show loading state
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Updating...';

        try {
            await saveReservationChanges(reservation);

            // Show success message
            showSuccessToast('Reservation updated successfully!');

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editReservationModal'));
            modal.hide();

            // Refresh page or callback
            if (typeof window.displayReservations === 'function') {
                window.displayReservations();
            }

        } catch (error) {
            console.error('Error saving reservation:', error);
            showErrorToast('Failed to update reservation. Please try again.');
        } finally {
            // Restore button
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Update Reservation';
        }
    });
}

// Save reservation changes
async function saveReservationChanges(originalReservation) {
    const formData = new FormData();

    // Reservation data
    const reservationData = {
        reservation_id: document.getElementById('editReservationId').value,
        guest_id: document.getElementById('editGuestId').value,
        check_in_date: document.getElementById('editCheckInDate').value,
        check_out_date: document.getElementById('editCheckOutDate').value,
        room_type_id: document.querySelector('.room-type-select').value,
        room_id: document.querySelector('.room-select').value,
        reservation_status_id: document.getElementById('editStatusSelect').value,
        notes: document.getElementById('editNotes').value
    };

    // Guest data
    const guestData = {
        guest_id: document.getElementById('editGuestId').value,
        first_name: document.getElementById('editFirstName').value,
        last_name: document.getElementById('editLastName').value,
        middle_name: document.getElementById('editMiddleName').value,
        suffix: document.getElementById('editSuffix').value,
        date_of_birth: document.getElementById('editDateOfBirth').value,
        email: document.getElementById('editEmail').value,
        phone_number: document.getElementById('editPhone').value,
        id_type: document.getElementById('editIdType').value,
        id_number: document.getElementById('editIdNumber').value
    };

    // Companions data
    const companions = [];
    document.querySelectorAll('.companion-name').forEach(input => {
        if (input.value.trim()) {
            companions.push({
                name: input.value.trim(),
                companion_id: input.dataset.companionId || null
            });
        }
    });

    console.log('Saving data:', { reservationData, guestData, companions });

    // Update guest information
    if (guestData.guest_id) {
        const guestFormData = new FormData();
        guestFormData.append('operation', 'updateGuest');
        guestFormData.append('json', JSON.stringify(guestData));

        try {
            await axios.post('../../api/admin/guests/guests.php', guestFormData);
        } catch (error) {
            console.warn('Failed to update guest:', error);
        }
    }

    // Update reservation
    formData.append('operation', 'updateReservation');
    formData.append('reservation_id', reservationData.reservation_id);
    formData.append('check_in_date', reservationData.check_in_date);
    formData.append('check_out_date', reservationData.check_out_date);
    formData.append('room_type_id', reservationData.room_type_id);
    formData.append('room_id', reservationData.room_id);
    formData.append('reservation_status_id', reservationData.reservation_status_id);
    formData.append('notes', reservationData.notes);

    // Add companions
    companions.forEach((companion, index) => {
        formData.append(`companions[${index}]`, companion.name);
    });

    const response = await axios.post('../../api/admin/reservations/reservations.php', formData);

    if (response.data !== 1 && !response.data.success) {
        throw new Error('Failed to update reservation');
    }

    return response.data;
}

// Populate booking summary section using add modal structure


// Update booking summary when changes are made
function updateEditBookingSummary() {
    const roomTypeSelect = document.querySelector('.room-type-select');
    const roomSelect = document.querySelector('.room-select');
    const checkIn = document.getElementById('editCheckInDate').value;
    const checkOut = document.getElementById('editCheckOutDate').value;

    if (!checkIn || !checkOut || !roomTypeSelect.value) return;

    // Calculate new values
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    const selectedOption = roomTypeSelect.querySelector('option:checked');
    const roomRate = parseFloat(selectedOption?.dataset.price) || 0;
    const totalAmount = roomRate * nights;

    // Update the total amount display
    const totalElement = document.querySelector('#editMultiRoomSummary .h3');
    if (totalElement) {
        totalElement.textContent = `₱${totalAmount.toFixed(2)}`;
    }

    // Update nights display
    const nightsElements = document.querySelectorAll('#editMultiRoomSummary [data-nights]');
    nightsElements.forEach(el => {
        el.textContent = `${nights} ${nights === 1 ? 'night' : 'nights'}`;
    });
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'confirmed': return 'success';
        case 'pending': return 'warning';
        case 'cancelled': return 'danger';
        case 'checked-in': return 'info';
        case 'checked-out': return 'secondary';
        default: return 'primary';
    }
}

// Utility functions
function showSuccessToast(message) {
    if (window.Swal) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
}

function showErrorToast(message) {
    if (window.Swal) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: message,
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
        });
    }
}
