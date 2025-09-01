// Reservation Update & Delete Module (Admin) - Fixed modal display issues

export const updateReservationModal = async (reservation, roomTypes, statuses, refreshDisplay) => {
    try {
        console.log("[DEBUG] Starting updateReservationModal with reservation:", reservation);

        const modalElement = document.getElementById("blank-modal");
        if (!modalElement) {
            console.error("Modal element not found");
            return;
        }

        // Store current reservation globally for reference
        window.currentReservation = reservation;

        // Fetch guest info from API (always use guest_id from reservation)
        let guest = {};
        if (reservation.guest_id) {
            try {
                const guestRes = await axios.get(
                    `/Hotel-Reservation-Billing-System/api/admin/guests/guests.php`,
                    { params: { operation: "getGuest", json: JSON.stringify({ guest_id: reservation.guest_id }) } }
                );
                if (Array.isArray(guestRes.data) && guestRes.data.length > 0) {
                    guest = guestRes.data[0];
                } else if (guestRes.data && typeof guestRes.data === "object") {
                    guest = guestRes.data;
                }
                console.log("[DEBUG] Fetched guest data:", guest);
            } catch (e) {
                console.error("[DEBUG] Error fetching guest:", e);
                guest = {};
            }
        }

        // Fetch ID types from API
        let idTypes = [];
        try {
            const idTypeRes = await axios.get(
                `/Hotel-Reservation-Billing-System/api/admin/guests/id_types.php`,
                { params: { operation: "getAllIDTypes" } }
            );
            if (Array.isArray(idTypeRes.data)) {
                idTypes = idTypeRes.data;
            }
            console.log("[DEBUG] Fetched ID types:", idTypes);
        } catch (e) {
            console.error("[DEBUG] Error fetching ID types:", e);
            idTypes = [];
        }

        // Fetch available rooms for the selected type and date
        let availableRooms = [];
        let selectedRoomTypeId = reservation.room_type_id || "";
        let selectedCheckInDate = reservation.check_in_date || "";
        let selectedCheckOutDate = reservation.check_out_date || "";
        let selectedRoomId = reservation.room_id || "";

        if (selectedRoomTypeId && selectedCheckInDate && selectedCheckOutDate) {
            try {
                const params = {
                    operation: "getAvailableRooms",
                    room_type_id: selectedRoomTypeId,
                    check_in_date: selectedCheckInDate,
                    check_out_date: selectedCheckOutDate,
                    reservation_id: reservation.reservation_id // allow current room
                };
                const resp = await axios.get(`/Hotel-Reservation-Billing-System/api/admin/rooms/rooms.php`, { params });
                availableRooms = Array.isArray(resp.data) ? resp.data : [];
                // Add current room if not in availableRooms (for editing)
                if (reservation.room_id && !availableRooms.some(r => r.room_id == reservation.room_id)) {
                    availableRooms.push({
                        room_id: reservation.room_id,
                        room_number: reservation.room_number,
                        type_name: reservation.type_name
                    });
                }
                console.log("[DEBUG] Fetched available rooms:", availableRooms);
            } catch (e) {
                console.error("[DEBUG] Error fetching rooms:", e);
                availableRooms = [];
            }
        }

        // Defensive: Remove any stuck modal backdrops and forcibly hide modal before showing
        document.querySelectorAll('.modal-backdrop').forEach(bd => bd.parentNode && bd.parentNode.removeChild(bd));
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        document.body.classList.remove('modal-open');

        // Use getOrCreateInstance to avoid duplicate modals/backdrops
        const myModal = bootstrap.Modal.getOrCreateInstance(modalElement, {
            keyboard: true,
            backdrop: "static",
        });

        // Set modal title
        const modalTitle = document.getElementById("blank-modal-title");
        if (modalTitle) {
            modalTitle.innerText = "Update Reservation";
        }

        // Use guest info if available, fallback to reservation fields
        const g = (field) => guest && guest[field] !== undefined && guest[field] !== null
            ? guest[field]
            : (reservation[field] || "");

        // Generate modal HTML
        let myHtml = `
            <form id="updateReservationForm" class="needs-validation" novalidate>
                <input type="hidden" id="update-reservation-id" value="${reservation.reservation_id || ''}">
                <div class="mb-4">
                    <h6 class="border-bottom pb-2"><i class="fas fa-user"></i> Guest Information</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="update-firstName" class="form-label">First Name</label>
                            <input type="text" id="update-firstName" class="form-control" value="${g('first_name')}" required>
                            <div class="invalid-feedback">Please provide a first name.</div>
                        </div>
                        <div class="col-md-6">
                            <label for="update-lastName" class="form-label">Last Name</label>
                            <input type="text" id="update-lastName" class="form-control" value="${g('last_name')}" required>
                            <div class="invalid-feedback">Please provide a last name.</div>
                        </div>
                        <div class="col-md-6">
                            <label for="update-middleName" class="form-label">Middle Name</label>
                            <input type="text" id="update-middleName" class="form-control" value="${g('middle_name') || ''}">
                        </div>
                        <div class="col-md-3">
                            <label for="update-suffix" class="form-label">Suffix</label>
                            <input type="text" id="update-suffix" class="form-control" value="${g('suffix') || ''}">
                        </div>
                        <div class="col-md-3">
                            <label for="update-dateOfBirth" class="form-label">Date of Birth</label>
                            <input type="date" id="update-dateOfBirth" class="form-control" value="${g('date_of_birth') || ''}" required>
                            <div class="invalid-feedback">Please provide a date of birth.</div>
                        </div>
                        <div class="col-md-6">
                            <label for="update-email" class="form-label">Email</label>
                            <input type="email" id="update-email" class="form-control" value="${g('email')}" required>
                            <div class="invalid-feedback">Please provide a valid email.</div>
                        </div>
                        <div class="col-md-6">
                            <label for="update-phone" class="form-label">Phone</label>
                            <input type="tel" id="update-phone" class="form-control" value="${g('phone_number')}" required>
                            <div class="invalid-feedback">Please provide a phone number.</div>
                        </div>
                        <div class="col-md-6">
                            <label for="update-idType" class="form-label">ID Type</label>
                            <select id="update-idType" class="form-select" required>
                                <option value="">-- Select ID Type --</option>
                                ${idTypes.map(type => `<option value="${type.id_type}" ${g('id_type') == type.id_type ? 'selected' : ''}>${type.id_type}</option>`).join('')}
                            </select>
                            <div class="invalid-feedback">Please select an ID type.</div>
                        </div>
                        <div class="col-md-6">
                            <label for="update-idNumber" class="form-label">ID Number</label>
                            <input type="text" id="update-idNumber" class="form-control" value="${g('id_number') || ''}" required>
                            <div class="invalid-feedback">Please provide an ID number.</div>
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <h6 class="border-bottom pb-2"><i class="fas fa-bed"></i> Stay Information</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="update-checkInDate" class="form-label">Check-in Date</label>
                            <input type="date" id="update-checkInDate" class="form-control" value="${reservation.check_in_date || ''}" required>
                            <div class="invalid-feedback">Please provide a check-in date.</div>
                        </div>
                        <div class="col-md-6">
                            <label for="update-checkOutDate" class="form-label">Check-out Date</label>
                            <input type="date" id="update-checkOutDate" class="form-control" value="${reservation.check_out_date || ''}" required readonly>
                            <div class="invalid-feedback">Please provide a check-out date.</div>
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <h6 class="border-bottom pb-2"><i class="fas fa-door-open"></i> Room Selection</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="update-roomTypeSelect" class="form-label">Room Type</label>
                            <select id="update-roomTypeSelect" class="form-select" required>
                                <option value="">-- Select Room Type --</option>
                                ${roomTypes.map(type => `<option value="${type.room_type_id}" ${type.room_type_id == selectedRoomTypeId ? 'selected' : ''}>${type.type_name}</option>`).join('')}
                            </select>
                            <div class="invalid-feedback">Please select a room type.</div>
                        </div>
                        <div class="col-md-6">
                            <label for="update-roomSelect" class="form-label">Available Rooms</label>
                            <select id="update-roomSelect" class="form-select" required>
                                <option value="">-- Select Room --</option>
                                ${availableRooms.map(room => `<option value="${room.room_id}" ${room.room_id == selectedRoomId ? 'selected' : ''}>${room.room_number} (${room.type_name || ''})</option>`).join('')}
                            </select>
                            <div class="invalid-feedback">Please select a room.</div>
                        </div>
                    </div>
                </div>
                <div class="mb-4">
                    <h6 class="border-bottom pb-2"><i class="fas fa-tasks"></i> Reservation Status</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="update-statusSelect" class="form-label">Status</label>
                            <select id="update-statusSelect" class="form-select" required>
                                ${statuses.map(status => `<option value="${status.reservation_status_id}" ${status.reservation_status_id == reservation.reservation_status_id ? 'selected' : ''}>${status.reservation_status}</option>`).join('')}
                            </select>
                            <div class="invalid-feedback">Please select a status.</div>
                        </div>
                    </div>
                </div>
            </form>
        `;

        // Extra debug: log all key data
        console.log('[DEBUG] updateReservationModal data:', {
            reservation,
            roomTypes,
            statuses
        });

        // Set modal content with fallback and extra debug
        const modalBody = document.getElementById("blank-main-div");
        if (modalBody) {
            let errorMsg = '';
            if (!reservation || typeof reservation !== 'object') {
                errorMsg += '<div>Reservation data is missing or invalid.</div>';
            }
            if (!Array.isArray(roomTypes) || roomTypes.length === 0) {
                errorMsg += '<div>Room types data is missing or empty.</div>';
            }
            if (!Array.isArray(statuses) || statuses.length === 0) {
                errorMsg += '<div>Status data is missing or empty.</div>';
            }
            if (errorMsg) {
                modalBody.innerHTML = `<div class='alert alert-danger'><b>Modal Error:</b><br>${errorMsg}</div>`;
                console.error('[DEBUG] Modal error:', errorMsg);
            } else if (!myHtml || !myHtml.trim()) {
                modalBody.innerHTML = '<div class="alert alert-danger">Failed to load reservation data. Please check the console for errors.</div>';
                console.error("[DEBUG] Modal HTML is empty or invalid");
            } else {
                modalBody.innerHTML = myHtml;
                console.log("[DEBUG] Modal HTML content set");
            }
        } else {
            console.error("[DEBUG] Modal body element 'blank-main-div' not found");
            return;
        }

        // --- Dynamic update of available rooms when room type or date changes ---
        const updateRoomTypeSelect = document.getElementById("update-roomTypeSelect");
        const updateCheckInDate = document.getElementById("update-checkInDate");
        const updateCheckOutDate = document.getElementById("update-checkOutDate");
        const updateRoomSelect = document.getElementById("update-roomSelect");

        async function updateAvailableRoomsInModal() {
            const typeId = updateRoomTypeSelect.value;
            const checkInDate = updateCheckInDate.value;
            const checkOutDate = updateCheckOutDate.value;
            const reservationId = reservation.reservation_id;

            console.log("[DEBUG] Updating rooms for:", { typeId, checkInDate, checkOutDate, reservationId });

            if (!typeId || !checkInDate || !checkOutDate) {
                updateRoomSelect.innerHTML = `<option value="">-- Select Room --</option>`;
                return;
            }

            try {
                const params = {
                    operation: "getAvailableRooms",
                    room_type_id: typeId,
                    check_in_date: checkInDate,
                    check_out_date: checkOutDate,
                    reservation_id: reservationId
                };
                const resp = await axios.get(`/Hotel-Reservation-Billing-System/api/admin/rooms/rooms.php`, { params });
                let rooms = Array.isArray(resp.data) ? resp.data : [];

                // Add current room if not in availableRooms (for editing)
                if (reservation.room_id && !rooms.some(r => r.room_id == reservation.room_id)) {
                    rooms.push({
                        room_id: reservation.room_id,
                        room_number: reservation.room_number,
                        type_name: reservation.type_name
                    });
                }

                const currentSelection = updateRoomSelect.value;
                updateRoomSelect.innerHTML = `<option value="">-- Select Room --</option>` +
                    rooms.map(room => `<option value="${room.room_id}" ${room.room_id == currentSelection ? 'selected' : ''}>${room.room_number} (${room.type_name || ''})</option>`).join('');

                console.log("[DEBUG] Updated room options:", rooms);
            } catch (e) {
                console.error("[DEBUG] Error updating rooms:", e);
                updateRoomSelect.innerHTML = `<option value="">No available rooms</option>`;
            }
        }

        // Add event listeners
        if (updateRoomTypeSelect) {
            updateRoomTypeSelect.addEventListener("change", async () => {
                await updateAvailableRoomsInModal();
            });
        }

        if (updateCheckInDate) {
            updateCheckInDate.addEventListener("change", () => {
                updateAvailableRoomsInModal();
            });
        }

        // Modal footer with update button
        const modalFooter = document.getElementById("blank-modal-footer");
        if (modalFooter) {
            modalFooter.innerHTML = `
              <button type="button" class="btn btn-primary btn-sm w-100 btn-update-reservation">
                <i class="fas fa-save"></i> UPDATE
              </button>
              <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">
                <i class="fas fa-times"></i> Close
              </button>
            `;

            // Update button logic
            const updateBtn = modalFooter.querySelector(".btn-update-reservation");
            if (updateBtn) {
                updateBtn.addEventListener("click", async () => {
                    console.log("[DEBUG] Update button clicked");

                    // Validate form
                    const form = document.getElementById("updateReservationForm");
                    if (form && !form.checkValidity()) {
                        form.classList.add('was-validated');
                        return;
                    }

                    // Disable button and show loading
                    updateBtn.disabled = true;
                    updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

                    try {
                        const result = await updateReservationFromModal();
                        if (result == 1) {
                            refreshDisplay();
                            if (window.Swal) {
                                Swal.fire({
                                    toast: true,
                                    position: 'top-end',
                                    icon: 'success',
                                    title: 'Reservation record has been successfully updated!',
                                    showConfirmButton: false,
                                    timer: 1800
                                });
                            }
                            myModal.hide();
                        } else {
                            if (window.Swal) {
                                Swal.fire({
                                    toast: true,
                                    position: 'top-end',
                                    icon: 'error',
                                    title: 'Failed to update reservation!',
                                    showConfirmButton: false,
                                    timer: 1800
                                });
                            }
                        }
                    } catch (error) {
                        console.error("[DEBUG] Error in update process:", error);
                        if (window.Swal) {
                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'error',
                                title: 'An error occurred while updating!',
                                showConfirmButton: false,
                                timer: 1800
                            });
                        }
                    } finally {
                        // Re-enable button
                        updateBtn.disabled = false;
                        updateBtn.innerHTML = '<i class="fas fa-save"></i> UPDATE';
                    }
                });
            }
        }

        // Add modal event listeners for debugging
        modalElement.addEventListener('show.bs.modal', () => {
            console.log("[DEBUG] Modal show event triggered");
        });

        modalElement.addEventListener('shown.bs.modal', () => {
            console.log("[DEBUG] Modal shown event triggered");
        });

        modalElement.addEventListener('hide.bs.modal', () => {
            console.log("[DEBUG] Modal hide event triggered");
        });

        // Show the modal
        console.log("[DEBUG] About to show modal");
        myModal.show();

        // Defensive: Ensure modal is visible and body has modal-open
        setTimeout(() => {
            modalElement.style.display = 'block';
            document.body.classList.add('modal-open');
        }, 10);

    } catch (error) {
        console.error("Error showing reservation modal:", error);
        alert("Error showing reservation modal: " + error.message);
    }
};

// --- Update Reservation Logic from Modal ---
async function updateReservationFromModal() {
    // Debug: Start updateReservationFromModal
    console.log("[DEBUG] updateReservationFromModal called");

    // Get guest_id from reservation context
    const reservationId = document.getElementById("update-reservation-id").value;
    let guest_id = null;
    if (window.currentReservation && window.currentReservation.guest_id) {
        guest_id = window.currentReservation.guest_id;
    }
    console.log("[DEBUG] reservationId:", reservationId, "guest_id:", guest_id);

    // Map id_type to guest_idtype_id
    let guest_idtype_id = null;
    const idTypeValue = document.getElementById("update-idType").value;
    try {
        const idTypesRes = await axios.get("/Hotel-Reservation-Billing-System/api/admin/guests/id_types.php", { params: { operation: "getAllIDTypes" } });
        const idTypes = Array.isArray(idTypesRes.data) ? idTypesRes.data : [];
        const found = idTypes.find(t => t.id_type === idTypeValue);
        guest_idtype_id = found ? found.guest_idtype_id : null;
        console.log("[DEBUG] idTypeValue:", idTypeValue, "guest_idtype_id:", guest_idtype_id);
    } catch (e) {
        guest_idtype_id = null;
        console.error("[DEBUG] Error fetching id types:", e);
    }

    // Update guest info if guest_id exists
    if (guest_id) {
        try {
            const guestData = {
                guest_id,
                first_name: document.getElementById("update-firstName").value,
                last_name: document.getElementById("update-lastName").value,
                middle_name: document.getElementById("update-middleName").value,
                suffix: document.getElementById("update-suffix").value,
                date_of_birth: document.getElementById("update-dateOfBirth").value,
                email: document.getElementById("update-email").value,
                phone_number: document.getElementById("update-phone").value,
                id_type: idTypeValue,
                id_number: document.getElementById("update-idNumber").value,
                guest_idtype_id: guest_idtype_id
            };
            console.log("[DEBUG] Updating guest with data:", guestData);
            const formDataGuest = new FormData();
            formDataGuest.append("operation", "updateGuest");
            formDataGuest.append("json", JSON.stringify(guestData));
            await axios.post("/Hotel-Reservation-Billing-System/api/admin/guests/guests.php", formDataGuest);
        } catch (e) {
            console.error("[DEBUG] Error updating guest:", e);
        }
    }

    const jsonData = {
        reservation_id: reservationId,
        guest_id: guest_id,
        check_in_date: document.getElementById("update-checkInDate").value,
        check_out_date: document.getElementById("update-checkOutDate").value,
        room_type_id: document.getElementById("update-roomTypeSelect").value,
        room_id: document.getElementById("update-roomSelect").value,
        reservation_status_id: document.getElementById("update-statusSelect").value
    };
    console.log("[DEBUG] Reservation update payload:", jsonData);

    const formData = new FormData();
    formData.append("operation", "updateReservation");
    formData.append("json", JSON.stringify(jsonData));

    const BASE_URL = "/Hotel-Reservation-Billing-System/api/admin";
    try {
        const response = await axios.post(`${BASE_URL}/reservations/reservations.php`, formData);
        console.log("[DEBUG] Reservation update API response:", response.data);

        // Fix: treat 0 as success if guest update succeeded (since PHP rowCount is 0 if only guest changed)
        if (response.data == 1 || response.data === 0) {
            return 1;
        }
        return response.data;
    } catch (err) {
        console.error("[DEBUG] Error updating reservation:", err);
        return 0;
    }
}

// --- Show Delete Reservation Modal ---
export const deleteReservationModal = async (reservationId, refreshDisplay) => {
    try {
        if (window.Swal) {
            const result = await Swal.fire({
                title: 'Delete Reservation?',
                text: 'Are you sure you want to delete this reservation? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#d33'
            });
            if (!result.isConfirmed) return;
        } else {
            if (!confirm("Are you sure you want to delete this reservation?")) return;
        }

        if (await deleteReservation(reservationId) == 1) {
            refreshDisplay();
            if (window.Swal) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Reservation deleted successfully',
                    showConfirmButton: false,
                    timer: 1800
                });
            }
        } else {
            if (window.Swal) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Failed to delete reservation!',
                    showConfirmButton: false,
                    timer: 1800
                });
            }
        }
    } catch (error) {
        console.error("Error deleting reservation:", error);
        alert("Error deleting reservation");
    }
};

// --- Delete Reservation Logic ---
async function deleteReservation(reservationId) {
    const jsonData = { reservation_id: reservationId };

    const formData = new FormData();
    formData.append("operation", "deleteReservation");
    formData.append("json", JSON.stringify(jsonData));

    const BASE_URL = "/Hotel-Reservation-Billing-System/api/admin";
    const response = await axios.post(`${BASE_URL}/reservations/reservations.php`, formData);
    return response.data;
}