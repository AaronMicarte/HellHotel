import { updateReservationModal, deleteReservationModal } from '../modules/admin/reservation-module.js';

// ==========================
// === DYNAMIC PAYMENT METHODS LOADER ===
async function loadPaymentMethodsDropdown() {
    const select = document.getElementById("paymentMethodSelect");
    if (!select) return;
    select.innerHTML = '<option value="">Loading...</option>';
    try {
        const res = await axios.post(`${BASE_URL}/payments/sub-method.php`, new URLSearchParams({ operation: "getAllSubMethods" }));
        const methods = Array.isArray(res.data) ? res.data : [];
        if (methods.length === 0) {
            select.innerHTML = '<option value="">No payment methods</option>';
            return;
        }
        // Filter to only show Cash, GCash, and PayMaya
        const allowedMethods = methods.filter(m =>
            m.name && (m.name.toLowerCase() === 'cash' ||
                m.name.toLowerCase() === 'gcash' ||
                m.name.toLowerCase() === 'paymaya')
        );

        select.innerHTML = '<option value="">-- Select Payment Method --</option>';
        for (const m of allowedMethods) {
            select.innerHTML += `<option value="${m.sub_method_id}">${m.name}</option>`;
        }

        if (allowedMethods.length === 0) {
            select.innerHTML = '<option value="">No valid payment methods available</option>';
        }
    } catch (err) {
        select.innerHTML = '<option value="">Failed to load</option>';
    }
}

// Load payment methods when modal is shown
const reservationModal = document.getElementById("reservationModal");
if (reservationModal) {
    reservationModal.addEventListener("show.bs.modal", loadPaymentMethodsDropdown);
}

// Add payment method change handler for reference number field
const paymentMethodSelect = document.getElementById("paymentMethodSelect");
if (paymentMethodSelect) {
    paymentMethodSelect.addEventListener("change", function () {
        const selectedOption = this.options[this.selectedIndex];
        const selectedText = selectedOption ? selectedOption.text.toLowerCase() : '';

        // Show/hide reference number field based on payment method
        const referenceContainer = document.getElementById("referenceNumberContainer");
        const referenceInput = document.getElementById("referenceNumber");

        if (selectedText === 'gcash' || selectedText === 'paymaya') {
            if (referenceContainer) {
                referenceContainer.style.display = 'block';
                if (referenceInput) {
                    referenceInput.required = true;
                }
            }
        } else {
            if (referenceContainer) {
                referenceContainer.style.display = 'none';
                if (referenceInput) {
                    referenceInput.required = false;
                    referenceInput.value = '';
                }
            }
        }
    });
}
// === GLOBALS & CONSTANTS ===
// ==========================
const BASE_URL = "/Hotel-Reservation-Billing-System/api/admin";
let cachedRoomTypes = [];
let cachedStatuses = [];
let cachedRooms = [];

// ==========================
// === INITIALIZATION =======
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    // --- MULTI-ROOM BOOKING LOGIC ---
    let multiRoomData = [];
    // Always keep window.multiRoomData in sync for validation and saving
    window.multiRoomData = multiRoomData;
    const multiRoomContainer = document.getElementById("multiRoomContainer");
    const multiRoomSummary = document.getElementById("multiRoomSummary");
    const addRoomBtn = document.getElementById("addRoomBtn");

    // Helper: Get room type object by id
    function getRoomTypeById(id) {
        return cachedRoomTypes.find(t => t.room_type_id == id);
    }

    // Helper: Get available rooms for a type and date
    async function getAvailableRooms(roomTypeId, checkIn, checkOut) {
        try {
            const params = {
                operation: "getAvailableRooms",
                room_type_id: roomTypeId,
                check_in_date: checkIn,
                check_out_date: checkOut
            };
            const response = await axios.get(`${BASE_URL}/rooms/rooms.php`, { params });
            if (Array.isArray(response.data)) return response.data;
            if (response.data && typeof response.data === 'object') return Object.values(response.data);
            return [];
        } catch {
            return [];
        }
    }

    // Helper: Render all room sections
    async function renderMultiRoomSections() {
        // Always keep window.multiRoomData in sync for validation and saving
        window.multiRoomData = multiRoomData;
        // Sync selected room_id from DOM to multiRoomData before rendering
        document.querySelectorAll('.room-select').forEach(sel => {
            const idx = parseInt(sel.getAttribute('data-index'));
            if (!isNaN(idx) && multiRoomData[idx]) {
                multiRoomData[idx].room_id = sel.value;
            }
        });
        if (!multiRoomContainer) return;
        multiRoomContainer.innerHTML = "";
        const checkIn = document.getElementById("checkInDate")?.value;
        const checkOut = document.getElementById("checkOutDate")?.value;
        // Gather all selected room_ids (as strings, across all sections)
        const allSelectedRoomIds = multiRoomData.map(r => r.room_id ? String(r.room_id) : null).filter(id => !!id);
        for (let i = 0; i < multiRoomData.length; i++) {
            const room = multiRoomData[i];
            // Fetch available rooms for this type
            let availableRooms = room.room_type_id && checkIn && checkOut ? await getAvailableRooms(room.room_type_id, checkIn, checkOut) : [];
            // Exclude already-selected room_ids in other sections (across all types, strict string compare)
            const selectedRoomIds = allSelectedRoomIds.filter((id, idx) => idx !== i);
            availableRooms = availableRooms.filter(r => !selectedRoomIds.includes(String(r.room_id)));
            // If the selected room is no longer available, reset it
            if (room.room_id && !availableRooms.some(r => String(r.room_id) === String(room.room_id))) {
                room.room_id = "";
            }
            const typeObj = getRoomTypeById(room.room_type_id);
            const maxCapacity = typeObj ? parseInt(typeObj.max_capacity) : 1;
            // Room section
            const section = document.createElement("div");
            section.className = "mb-4 p-3 border rounded position-relative bg-light";
            // For the first room, companions max is (maxCapacity-1), for others it's maxCapacity
            const companionsMax = i === 0 ? Math.max(0, maxCapacity - 1) : maxCapacity;
            section.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div><b>Room #${i + 1}</b> ${typeObj ? `<span class='text-primary'>${typeObj.type_name}</span>` : ''}</div>
                    ${i > 0 ? `<button type="button" class="btn btn-danger btn-sm remove-room-btn" data-index="${i}"><i class="fas fa-trash"></i> Remove</button>` : ''}
                </div>
                <div class="row g-3 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label">Room Type</label>
                        <select class="form-select room-type-select" data-index="${i}" required>
                            <option value="">-- Select Room Type --</option>
                            ${cachedRoomTypes.map(rt => `<option value="${rt.room_type_id}" ${room.room_type_id == rt.room_type_id ? 'selected' : ''}>${rt.type_name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Available Room</label>
                        <select class="form-select room-select" data-index="${i}" required>
                            <option value="">-- Select Room --</option>
                            ${availableRooms.map(r => `<option value="${r.room_id}" ${room.room_id == r.room_id ? 'selected' : ''}>${r.room_number} (${typeObj ? typeObj.type_name : ''})</option>`).join('')}
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Companions</label>
                        <select class="form-select num-companions-select" data-index="${i}" ${maxCapacity ? '' : 'disabled'}>
                            ${Array.from({ length: companionsMax + 1 }, (_, n) => `<option value="${n}" ${room.num_companions == n ? 'selected' : ''}>${n}</option>`).join('')}
                        </select>
                        <div class="form-text">Max: ${companionsMax}</div>
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-12 companion-fields" data-index="${i}">
                        ${renderCompanionInputs(i, room.num_companions, i === 0)}
                    </div>
                </div>
            `;
            multiRoomContainer.appendChild(section);
        }
        attachRoomSectionEvents();
        updateMultiRoomSummary();
    }

    // Render companion input fields for a room
    function renderCompanionInputs(roomIdx, num, isFirstRoom) {
        let html = "";
        if (isFirstRoom) {
            // Main guest assigned to first slot, disabled (not counted in companions)
            html += `<div class="mb-2"><label><i class='fas fa-user me-1'></i>Main Guest (auto-assigned)</label><input type="text" class="form-control" value="(Main Guest)" disabled></div>`;
        }
        for (let i = 0; i < num; i++) {
            html += `<div class="mb-2"><label><i class='fas fa-user-friends me-1'></i>Companion #${i + 1} Full Name</label><input type="text" class="form-control companion-name-input" data-room-index="${roomIdx}" name="companionName_${roomIdx}[]" placeholder="Full Name" required autocomplete="off" value="${multiRoomData[roomIdx].companions[i] || ''}"></div>`;
        }
        return html;
    }

    // Attach events to dynamic room sections
    function attachRoomSectionEvents() {
        // Room type change
        multiRoomContainer.querySelectorAll('.room-type-select').forEach(sel => {
            sel.addEventListener('change', async function () {
                const idx = parseInt(this.getAttribute('data-index'));
                multiRoomData[idx].room_type_id = this.value;
                multiRoomData[idx].room_id = "";
                await renderMultiRoomSections();
            });
        });
        // Room select change
        multiRoomContainer.querySelectorAll('.room-select').forEach(sel => {
            sel.addEventListener('change', function () {
                const idx = parseInt(this.getAttribute('data-index'));
                multiRoomData[idx].room_id = this.value;
                renderMultiRoomSections();
            });
        });
        // Num companions change
        multiRoomContainer.querySelectorAll('.num-companions-select').forEach(sel => {
            sel.addEventListener('change', function () {
                const idx = parseInt(this.getAttribute('data-index'));
                multiRoomData[idx].num_companions = parseInt(this.value);
                multiRoomData[idx].companions = Array(multiRoomData[idx].num_companions).fill("");
                renderMultiRoomSections();
            });
        });
        // Remove room
        multiRoomContainer.querySelectorAll('.remove-room-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const idx = parseInt(this.getAttribute('data-index'));
                multiRoomData.splice(idx, 1);
                renderMultiRoomSections();
            });
        });
        // Companion name input
        multiRoomContainer.querySelectorAll('.companion-name-input').forEach(input => {
            input.addEventListener('input', function () {
                const roomIdx = parseInt(this.getAttribute('data-room-index'));
                const compIdx = Array.from(this.parentNode.parentNode.querySelectorAll('.companion-name-input')).indexOf(this);
                multiRoomData[roomIdx].companions[compIdx] = this.value;
            });
        });
    }

    // Add new room section
    function addRoomSection() {
        multiRoomData.push({
            room_type_id: "",
            room_id: "",
            num_companions: 0,
            companions: []
        });
        renderMultiRoomSections();
    }

    // Update summary and total bill, show payment method and 50% partial
    function updateMultiRoomSummary() {
        if (!multiRoomSummary) return;
        let summary = {};
        let total = 0;
        multiRoomData.forEach(room => {
            const typeObj = getRoomTypeById(room.room_type_id);
            if (!typeObj) return;
            if (!summary[typeObj.type_name]) summary[typeObj.type_name] = { count: 0, price: 0 };
            summary[typeObj.type_name].count++;
            summary[typeObj.type_name].price += parseFloat(typeObj.price_per_stay || 0);
            total += parseFloat(typeObj.price_per_stay || 0);
        });
        let html = '<ul class="list-group mb-2">';
        Object.entries(summary).forEach(([type, val]) => {
            html += `<li class="list-group-item d-flex justify-content-between align-items-center">${val.count} x ${type}<span>₱${val.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></li>`;
        });
        html += '</ul>';
        html += `<div class="fs-5 fw-bold text-end">Total: <span class="text-success">₱${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>`;
        // Payment method and partial payment
        const paymentMethodSelect = document.getElementById("paymentMethodSelect");
        // let paymentMethod = paymentMethodSelect ? paymentMethodSelect.options[paymentMethodSelect.selectedIndex]?.text : '';
        let partial = total * 0.5;
        // html += `<div class="mt-3"><b>Payment Method:</b> <span class="text-info">${paymentMethod || 'N/A'}</span></div>`;
        html += `<div class="mt-1"><b>Partial Payment (50%):</b> <span class="text-warning">₱${partial.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>`;
        // Also update the partialPayment span in the payment section
        const partialPaymentSpan = document.getElementById("partialPayment");
        if (partialPaymentSpan) partialPaymentSpan.textContent = `₱${partial.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        multiRoomSummary.innerHTML = html;
    }

    // Initialize with one room section on modal open
    const reservationModal = document.getElementById("reservationModal");
    if (reservationModal) {
        reservationModal.addEventListener("show.bs.modal", async () => {
            multiRoomData = [{ room_type_id: "", room_id: "", num_companions: 0, companions: [] }];
            window.multiRoomData = multiRoomData;
            await loadRoomTypes();
            await renderMultiRoomSections();
            await loadPaymentMethodsDropdown();
        });
    }
    if (addRoomBtn) {
        addRoomBtn.addEventListener('click', addRoomSection);
    }

    // ...existing code...
    // Remove old room price/partial logic, now handled in summary
    function updateRoomPriceAndPartial() {
        // No-op: handled by updateMultiRoomSummary
        updateMultiRoomSummary();
    }

    // Attach listeners for live update
    // Remove old single-room listeners
    // Always update summary on modal open
    updateRoomPriceAndPartial();
    // --- Guest search logic ---
    let allGuests = [];
    const guestSearchInput = document.getElementById("guestSearchInput");
    const guestSearchDropdown = document.getElementById("guestSearchDropdown");

    // Helper: Enable/disable guest info fields
    function setGuestFieldsDisabled(disabled) {
        [
            "firstName", "lastName", "middleName", "suffix", "dateOfBirth",
            "email", "phone", "idType", "idNumber"
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = !!disabled;
        });
    }

    // Fetch all guests when modal opens
    const addReservationBtn = document.getElementById("addReservationBtn");
    if (addReservationBtn) {
        addReservationBtn.addEventListener("click", async () => {
            try {
                const res = await axios.get(`${BASE_URL}/guests/guests.php`, { params: { operation: "getAllGuests" } });
                allGuests = Array.isArray(res.data) ? res.data : [];
            } catch {
                allGuests = [];
            }
            if (guestSearchInput) guestSearchInput.value = "";
            if (guestSearchDropdown) guestSearchDropdown.style.display = "none";
            setGuestFieldsDisabled(false); // Always enable fields on modal open
            document.getElementById("guestSelectId")?.remove(); // Remove hidden guest id if any
        });
    }

    if (guestSearchInput) {
        guestSearchInput.addEventListener("input", function () {
            const q = (this.value || "").toLowerCase();
            if (!q || !allGuests.length) {
                if (guestSearchDropdown) guestSearchDropdown.style.display = "none";
                setGuestFieldsDisabled(false);
                document.getElementById("guestSelectId")?.remove();
                return;
            }
            const matches = allGuests.filter(g =>
                (`${g.first_name} ${g.last_name} ${g.email}`.toLowerCase().includes(q))
            ).slice(0, 8);
            if (!matches.length) {
                if (guestSearchDropdown) guestSearchDropdown.style.display = "none";
                setGuestFieldsDisabled(false);
                document.getElementById("guestSelectId")?.remove();
                return;
            }
            if (guestSearchDropdown) {
                guestSearchDropdown.innerHTML = matches.map(g =>
                    `<a href="#" class="list-group-item list-group-item-action" data-guest-id="${g.guest_id}">
                        <b>${g.first_name} ${g.last_name}</b> <small>(${g.email})</small>
                    </a>`
                ).join("");
                guestSearchDropdown.style.display = "block";
            }
        });

        // Hide dropdown on blur
        guestSearchInput.addEventListener("blur", function () {
            setTimeout(() => {
                if (guestSearchDropdown) guestSearchDropdown.style.display = "none";
            }, 200);
        });
    }

    if (guestSearchDropdown) {
        guestSearchDropdown.addEventListener("mousedown", function (e) {
            const a = e.target.closest("a[data-guest-id]");
            if (!a) return;
            e.preventDefault();
            const guestId = a.getAttribute("data-guest-id");
            const guest = allGuests.find(g => g.guest_id == guestId);
            if (guest) {
                const setFieldValue = (id, value) => {
                    const field = document.getElementById(id);
                    if (field) field.value = value || "";
                };

                setFieldValue("firstName", guest.first_name);
                setFieldValue("lastName", guest.last_name);
                setFieldValue("middleName", guest.middle_name);
                setFieldValue("suffix", guest.suffix);
                setFieldValue("dateOfBirth", guest.date_of_birth);
                setFieldValue("email", guest.email);
                setFieldValue("phone", guest.phone_number);
                setFieldValue("idType", guest.id_type);
                setFieldValue("idNumber", guest.id_number);

                // Store selected guest_id in a hidden field
                let hidden = document.getElementById("guestSelectId");
                if (!hidden) {
                    hidden = document.createElement("input");
                    hidden.type = "hidden";
                    hidden.id = "guestSelectId";
                    hidden.name = "guestSelectId";
                    document.getElementById("reservationForm").appendChild(hidden);
                }
                hidden.value = guestId;

                setGuestFieldsDisabled(true); // Disable guest fields if existing guest is selected
            }
            guestSearchDropdown.style.display = "none";
        });
    }

    // Allow user to clear guest selection and re-enable fields
    ["firstName", "lastName", "email"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", function () {
                // If user edits any guest field, remove guestSelectId and enable fields
                document.getElementById("guestSelectId")?.remove();
                setGuestFieldsDisabled(false);
            });
        }
    });


    // --- Load initial data ---
    loadRoomTypes().then(() => {
        updateRoomPriceAndPartial();
    });
    loadGuests();
    loadIDTypes();
    loadStatuses().then(() => {
        updateStatusFilter(); // Call this after statuses are loaded
    });
    displayReservations();

    // --- Event Listeners with null checks ---
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", displayReservations);
    }

    if (addReservationBtn) {
        addReservationBtn.addEventListener("click", () => {
            clearReservationForm();
            new bootstrap.Modal(document.getElementById("reservationModal")).show();
            updateAvailableRooms();
            updateCheckoutDate();
            updateRoomPriceAndPartial();
        });
    }

    const saveReservationBtn = document.getElementById("saveReservationBtn");
    if (saveReservationBtn) {
        saveReservationBtn.addEventListener("click", saveReservation);
    }

    const roomTypeSelect = document.getElementById("roomTypeSelect");
    if (roomTypeSelect) {
        roomTypeSelect.addEventListener("change", updateAvailableRooms);
    }

    const checkInDate = document.getElementById("checkInDate");
    const checkInTime = document.getElementById("checkInTime");

    if (checkInDate) {
        checkInDate.addEventListener("change", () => {
            updateAvailableRooms();
            updateCheckoutDate();
        });
    }

    if (checkInTime) {
        checkInTime.addEventListener("change", () => {
            updateAvailableRooms();
            updateCheckoutDate();
        });
    }

    const newGuestBtn = document.getElementById("newGuestBtn");
    if (newGuestBtn) {
        newGuestBtn.addEventListener("click", () => {
            clearGuestForm();
            new bootstrap.Modal(document.getElementById("guestModal")).show();
        });
    }

    const saveGuestBtn = document.getElementById("saveGuestBtn");
    if (saveGuestBtn) {
        saveGuestBtn.addEventListener("click", async () => {
            await saveGuest();
            clearGuestForm();
        });
    }

    // --- Date restrictions ---
    const today = new Date();
    if (checkInDate) checkInDate.min = today.toISOString().split("T")[0];

    const dateOfBirth = document.getElementById("dateOfBirth");
    if (dateOfBirth) dateOfBirth.max = today.toISOString().split("T")[0];

    // --- Filters with proper null checks ---
    const statusFilter = document.getElementById("statusFilter");
    const applyFilters = document.getElementById("applyFilters");
    const dateFrom = document.getElementById("dateFrom");
    const dateTo = document.getElementById("dateTo");

    // Trigger filterReservations on filter changes
    if (statusFilter) {
        statusFilter.addEventListener("change", filterReservations);
    }
    if (dateFrom) {
        dateFrom.addEventListener("change", filterReservations);
    }
    if (dateTo) {
        dateTo.addEventListener("change", filterReservations);
    }
    if (applyFilters) {
        applyFilters.addEventListener("click", filterReservations);
    }

    // Reset filters and reload all reservations on refresh
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            if (statusFilter) statusFilter.value = "";
            if (dateFrom) dateFrom.value = "";
            if (dateTo) dateTo.value = "";
            const searchInput = document.getElementById("searchReservation");
            if (searchInput) searchInput.value = "";
            displayReservations();
        });
    }

    // --- Search logic ---
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchReservation");
    if (searchBtn) {
        searchBtn.addEventListener("click", filterReservations);
    }
    if (searchInput) {
        searchInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                filterReservations();
            }
        });
    }
});

// ==========================
// === RESERVATIONS TABLE ===
// ==========================
async function displayReservations(data) {
    // If data is provided, use it; otherwise fetch all
    if (data) {
        displayReservationsTable(data);
        return;
    }
    try {
        const response = await axios.get(`${BASE_URL}/reservations/reservations.php`, {
            params: { operation: "getAllReservations" }
        });

        if (response.status === 200) {
            displayReservationsTable(response.data);
        } else {
            showError("Failed to load reservations.");
        }
    } catch (error) {
        console.error("❌ Error fetching reservations:", error);
        console.log("❌ Error response:", error.response?.data); // DEBUG
        showError("Failed to load reservations. Please try again.");
    }
}

function displayReservationsTable(reservations) {
    console.log("📊 displayReservationsTable called with:", reservations); // DEBUG
    console.log("📊 Reservations length:", reservations?.length); // DEBUG

    const tbody = document.getElementById("reservationsTableBody");
    if (!tbody) {
        console.error("❌ reservationsTableBody element not found!");
        return;
    }

    tbody.innerHTML = "";

    // Check if reservations is null, undefined, or not an array
    if (!reservations) {
        console.log("⚠️ Reservations is null or undefined");
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No reservations data received.</td></tr>`;
        return;
    }

    if (!Array.isArray(reservations)) {
        console.log("⚠️ Reservations is not an array, type:", typeof reservations);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">Invalid reservations data format.</td></tr>`;
        return;
    }

    if (!reservations.length) {
        console.log("⚠️ Reservations array is empty");
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No reservations found.</td></tr>`;
        return;
    }

    // Only show reservations where is_deleted is false/0/"0"/"FALSE"/"false"
    const filteredReservations = Array.isArray(reservations)
        ? reservations.filter(r =>
            !r.is_deleted ||
            r.is_deleted === 0 ||
            r.is_deleted === "0" ||
            r.is_deleted === false ||
            r.is_deleted === "FALSE" ||
            r.is_deleted === "false"
        )
        : [];

    // --- Update stats overview ---
    updateReservationStatsOverview(filteredReservations);

    if (!filteredReservations.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No reservations found.</td></tr>`;
        return;
    }

    console.log("✅ Processing", filteredReservations.length, "reservations"); // DEBUG

    const totalReservationsEl = document.getElementById("totalReservations");
    if (totalReservationsEl) {
        totalReservationsEl.textContent = filteredReservations.length;
    }


    filteredReservations.forEach((res, index) => {
        // Overdue logic: if not checked out/cancelled and today > check_out_date
        let status = (res.reservation_status || res.room_status || 'pending').toLowerCase();
        let isOverdue = false;
        if (status !== 'checked-out' && status !== 'cancelled' && res.check_out_date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const outDate = new Date(res.check_out_date);
            outDate.setHours(0, 0, 0, 0);
            if (today > outDate) isOverdue = true;
        }
        // Format check-in and check-out time to 12-hour format with AM/PM
        function format12Hour(timeStr) {
            if (!timeStr) return "";
            const [h, m] = timeStr.split(":");
            let hour = parseInt(h, 10);
            const minute = m ? m.padStart(2, "0") : "00";
            const ampm = hour >= 12 ? "PM" : "AM";
            hour = hour % 12;
            if (hour === 0) hour = 12;
            return `${hour}:${minute} ${ampm}`;
        }

        const checkInTime12 = res.check_in_time ? format12Hour(res.check_in_time) : "";
        const checkOutTime12 = res.check_out_time ? format12Hour(res.check_out_time) : "";

        const tr = document.createElement("tr");
        // Find which room the main guest was assigned to
        let mainGuestRoom = '';
        if (res.reservation_id && res.guest_id) {
            // Try to find from reserved_rooms API
            mainGuestRoom = '';
            if (window.cachedReservedRooms && Array.isArray(window.cachedReservedRooms)) {
                const mainRoom = window.cachedReservedRooms.find(r => String(r.reservation_id) === String(res.reservation_id) && String(r.guest_id) === String(res.guest_id));
                if (mainRoom) mainGuestRoom = `${mainRoom.type_name || ''}${mainRoom.type_name && mainRoom.room_number ? ' ' : ''}${mainRoom.room_number || ''}`;
            }
        }
        // Render status flow icons only (no text) in a dedicated column
        function renderStatusFlowIcons(res) {
            const status = (res.reservation_status || '').toLowerCase();
            const id = res.reservation_id;
            let actions = [];
            if (status === 'pending') {
                actions.push({ icon: 'fa-check-circle', color: 'text-info', label: 'Confirm', next: 'confirmed' });
                actions.push({ icon: 'fa-times-circle', color: 'text-danger', label: 'Cancel', next: 'cancelled' });
            } else if (status === 'confirmed') {
                actions.push({ icon: 'fa-door-open', color: 'text-success', label: 'Check-in', next: 'checked-in' });
                actions.push({ icon: 'fa-times-circle', color: 'text-danger', label: 'Cancel', next: 'cancelled' });
            } else if (status === 'checked-in') {
                actions.push({ icon: 'fa-sign-out-alt', color: 'text-primary', label: 'Check-out', next: 'checked-out' });
            }
            return actions.map(a =>
                `<i class="fas ${a.icon} action-icon ${a.color}" style="cursor:pointer; margin-left:8px" title="${a.label}" data-action="status-${a.next}" data-id="${id}"></i>`
            ).join('');
        }
        tr.innerHTML = `
        <td>${res.reservation_id || 'N/A'}</td>
        <td>${res.guest_name || (res.first_name && res.last_name ? res.first_name + ' ' + res.last_name : 'No Name')}</td>
        <td>${res.rooms_summary || 'No Room'}${mainGuestRoom ? `<br><span class='badge bg-success mt-1'>Main Guest: ${mainGuestRoom}</span>` : ''}</td>
        <td>${res.check_in_date || 'N/A'}${checkInTime12 ? " " + checkInTime12 : ""}</td>
        <td>${res.check_out_date || 'N/A'}${checkOutTime12 ? " " + checkOutTime12 : ""}</td>
                                        <td>
                                            ${res.reservation_type === 'walk-in' ? `<span class='badge' style='background-color: orange; color: white;'>Walk-in</span>` : ''}
                                            ${res.reservation_type === 'online' ? `<span class='badge bg-primary'>Online</span>` : ''}
                                        </td>
        <td>${isOverdue ? `<span class='text-danger fw-bold'><i class='fas fa-exclamation-circle'></i> Overdue</span>` : getStatusBadge(res.reservation_status || res.room_status || 'pending')}</td>
        <td class="status-flow-col">${renderStatusFlowIcons(res)}</td>
        <td>
            <i class="fas fa-user-edit action-icon" style="color: purple; cursor:pointer; margin-right:10px" data-action="change-booker" data-id="${res.reservation_id}" title="Change Booker"></i>
            <i class="fas fa-eye action-icon text-info" data-action="view" data-id="${res.reservation_id}" title="View Details" style="cursor:pointer; margin-right:10px"></i>
            <i class="fas fa-edit action-icon text-primary" data-action="edit" data-id="${res.reservation_id}" title="Edit" style="cursor:pointer; margin-right:10px"></i>
            <i class="fas fa-trash action-icon text-primary" data-action="delete" data-id="${res.reservation_id}" title="Delete" style="cursor:pointer;"></i>
        </td>
        `;
        // Status flow icons (Confirm, Check-in, Check-out, Cancel) event listeners
        const statusFlowIcons = tr.querySelectorAll('.status-flow-col .action-icon[data-action^="status-"]');
        statusFlowIcons.forEach(icon => {
            icon.addEventListener('click', async function () {
                const action = this.getAttribute('data-action');
                const nextStatus = action.replace('status-', '');
                const statusObj = cachedStatuses.find(s => s.reservation_status.toLowerCase() === nextStatus);
                if (!statusObj) {
                    showError('Invalid status.');
                    return;
                }
                // Confirmation dialog
                let confirmMsg = '';
                if (nextStatus === 'confirmed') confirmMsg = 'Are you sure you want to confirm this reservation?';
                else if (nextStatus === 'checked-in') confirmMsg = 'Check-in this guest and mark room as occupied?';
                else if (nextStatus === 'checked-out') confirmMsg = 'Check-out this guest? This will mark the room as available. Guest must be fully paid.';
                else if (nextStatus === 'cancelled') confirmMsg = 'Cancel this reservation? This will release the room.';
                else confirmMsg = 'Change status to ' + nextStatus + '?';
                const result = await Swal.fire({
                    title: 'Change Reservation Status',
                    text: confirmMsg,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                });
                if (!result.isConfirmed) return;
                // Call backend
                try {
                    const payload = {
                        operation: 'changeReservationStatus',
                        json: JSON.stringify({
                            reservation_id: res.reservation_id,
                            new_status_id: statusObj.reservation_status_id,
                            changed_by_user_id: res.user_id || null
                        })
                    };
                    const formData = new FormData();
                    formData.append('operation', payload.operation);
                    formData.append('json', payload.json);
                    const apiRes = await axios.post(`${BASE_URL}/reservations/reservation_status.php`, formData);
                    if (apiRes.data && apiRes.data.success) {
                        showSuccess(apiRes.data.message || 'Status updated!');
                        displayReservations();
                    } else {
                        showError(apiRes.data && apiRes.data.message ? apiRes.data.message : 'Failed to update status.');
                    }
                } catch (err) {
                    showError('Failed to update status.');
                }
            });
        });
        tbody.appendChild(tr);

        // Change Booker
        const changeBookerIcon = tr.querySelector('.fa-user-edit[data-action="change-booker"]');
        if (changeBookerIcon) {
            changeBookerIcon.addEventListener("click", async () => {
                // Fetch companions and main guest for this reservation
                let people = [];
                try {
                    const resPeople = await axios.get(`${BASE_URL}/reservations/companions_for_reservation.php?reservation_id=${res.reservation_id}`);
                    people = Array.isArray(resPeople.data) ? resPeople.data : [];
                } catch {
                    people = [];
                }
                // Build select dropdown
                const options = people.map(p => {
                    if (p.type === 'main_guest') {
                        return `<option value=\"guest_${p.guest_id}\" ${p.guest_id == res.guest_id ? 'selected' : ''}>${p.full_name} (Main Guest)${p.email ? ' (' + p.email + ')' : ''}</option>`;
                    } else {
                        return `<option value=\"companion_${p.companion_id}\">${p.full_name} (Companion)</option>`;
                    }
                }).join("");
                const html = `<div class='mb-2'>Select new booker for reservation #${res.reservation_id}:</div><select id='swalChangeBookerSelect' class='form-select'>${options}</select>`;
                const { value: confirmed } = await Swal.fire({
                    title: 'Change Main Booker',
                    html: html,
                    showCancelButton: true,
                    confirmButtonText: 'Change Booker',
                    cancelButtonText: 'Cancel',
                    preConfirm: () => {
                        const select = document.getElementById('swalChangeBookerSelect');
                        return select ? select.value : null;
                    }
                });
                if (confirmed) {
                    if (confirmed.startsWith('guest_')) {
                        // Main guest selected
                        const new_guest_id = confirmed.replace('guest_', '');
                        if (new_guest_id != res.guest_id) {
                            try {
                                const payload = { reservation_id: res.reservation_id, new_guest_id: new_guest_id };
                                const apiRes = await axios.post(`${BASE_URL}/reservations/change_booker.php`, payload);
                                if (apiRes.data && apiRes.data.success) {
                                    showSuccess('Booker changed successfully!');
                                    displayReservations();
                                } else {
                                    showError(apiRes.data && apiRes.data.message ? apiRes.data.message : 'Failed to change booker.');
                                }
                            } catch (err) {
                                showError('Failed to change booker.');
                            }
                        }
                    } else if (confirmed.startsWith('companion_')) {
                        // Companion selected: prompt for guest info
                        const companion_id = confirmed.replace('companion_', '');
                        const companion = people.find(p => p.type === 'companion' && p.companion_id == companion_id);
                        if (!companion) return;
                        // Fetch ID types (alphabetically)
                        let idTypes = [];
                        try {
                            const idTypesRes = await axios.get(`${BASE_URL}/guests/id_types.php`, { params: { operation: "getAllIDTypes" } });
                            idTypes = Array.isArray(idTypesRes.data) ? idTypesRes.data : [];
                            idTypes.sort((a, b) => a.id_type.localeCompare(b.id_type));
                        } catch { }
                        const idTypeOptions = idTypes.map(t => `<option value="${t.id_type}">${t.id_type}</option>`).join('');
                        // Show modal for guest info (no ID pic)
                        const { value: guestData } = await Swal.fire({
                            title: 'Register Companion as Guest',
                            html: `
                                <div class='mb-2'><i class='fas fa-user-friends text-info me-1'></i> Fill in required info for <b>${companion.full_name}</b>:</div>
                                <div class='swal2-input-group' style='display:flex;align-items:center;gap:8px;'>
                                    <i class='fas fa-user text-primary'></i>
                                    <input id='swalFirstName' class='swal2-input' placeholder='First Name' value='${companion.full_name.split(' ')[0] || ''}' style='width:100%;'>
                                </div>
                                <div class='swal2-input-group' style='display:flex;align-items:center;gap:8px;'>
                                    <i class='fas fa-user text-primary'></i>
                                    <input id='swalLastName' class='swal2-input' placeholder='Last Name' value='${companion.full_name.split(' ').slice(1).join(' ')}' style='width:100%;'>
                                </div>
                                <div class='swal2-input-group' style='display:flex;align-items:center;gap:8px;'>
                                    <i class='fas fa-envelope text-info'></i>
                                    <input id='swalEmail' class='swal2-input' placeholder='Email' style='width:100%;'>
                                </div>
                                <div class='swal2-input-group' style='display:flex;align-items:center;gap:8px;'>
                                    <i class='fas fa-phone text-success'></i>
                                    <input id='swalPhone' class='swal2-input' placeholder='Phone' style='width:100%;'>
                                </div>
                                <div class='swal2-input-group' style='display:flex;align-items:center;gap:8px;'>
                                    <i class='fas fa-calendar-alt text-warning'></i>
                                    <input id='swalDOB' class='swal2-input' type='date' placeholder='Date of Birth' style='width:100%;'>
                                </div>
                                <div class='swal2-input-group' style='display:flex;align-items:center;gap:8px;'>
                                    <i class='fas fa-id-card text-secondary'></i>
                                    <input id='swalIDNumber' class='swal2-input' placeholder='ID Number' style='width:100%;'>
                                </div>
                                <div class='swal2-input-group' style='display:flex;align-items:center;gap:8px;'>
                                    <i class='fas fa-id-badge text-secondary'></i>
                                    <select id='swalIDType' class='swal2-input' style='width:100%;'>
                                        <option value=''>-- Select ID Type --</option>
                                        ${idTypeOptions}
                                    </select>
                                </div>
                            `,
                            focusConfirm: false,
                            showCancelButton: true,
                            confirmButtonText: 'Register & Assign',
                            cancelButtonText: 'Cancel',
                            preConfirm: () => {
                                // Map id_type to guest_idtype_id for backend
                                const id_type = document.getElementById('swalIDType').value;
                                let guest_idtype_id = null;
                                if (id_type && Array.isArray(idTypes)) {
                                    const found = idTypes.find(t => t.id_type === id_type);
                                    guest_idtype_id = found ? found.guest_idtype_id : null;
                                }
                                return {
                                    first_name: document.getElementById('swalFirstName').value.trim(),
                                    last_name: document.getElementById('swalLastName').value.trim(),
                                    email: document.getElementById('swalEmail').value.trim(),
                                    phone_number: document.getElementById('swalPhone').value.trim(),
                                    date_of_birth: document.getElementById('swalDOB').value,
                                    id_number: document.getElementById('swalIDNumber').value.trim(),
                                    id_type: id_type,
                                    guest_idtype_id: guest_idtype_id
                                };
                            }
                        });
                        if (guestData && guestData.first_name && guestData.last_name && guestData.email && guestData.phone_number && guestData.date_of_birth && guestData.id_number && guestData.id_type) {
                            // Register guest
                            try {
                                const formData = new FormData();
                                formData.append('operation', 'insertGuest');
                                formData.append('json', JSON.stringify(guestData));
                                const guestRes = await axios.post(`${BASE_URL}/guests/guests.php`, formData);
                                let new_guest_id = null;
                                if (guestRes.data && typeof guestRes.data === 'object' && guestRes.data.guest_id) {
                                    new_guest_id = guestRes.data.guest_id;
                                } else if (guestRes.data && !isNaN(guestRes.data) && Number(guestRes.data) > 0) {
                                    new_guest_id = guestRes.data;
                                }
                                if (new_guest_id) {
                                    // Mark the companion as deleted in ReservedRoomCompanion
                                    try {
                                        await axios.post(`${BASE_URL}/reservations/companions.php`, {
                                            operation: 'deleteCompanion',
                                            companion_id: companion_id
                                        });
                                    } catch (e) { /* ignore error, just try to hide companion */ }
                                    // Assign as booker
                                    const payload = { reservation_id: res.reservation_id, new_guest_id: new_guest_id };
                                    const apiRes = await axios.post(`${BASE_URL}/reservations/change_booker.php`, payload);
                                    if (apiRes.data && apiRes.data.success) {
                                        showSuccess('Booker changed successfully!');
                                        displayReservations(); // This will refresh the row and dropdown
                                    } else {
                                        showError(apiRes.data && apiRes.data.message ? apiRes.data.message : 'Failed to change booker.');
                                    }
                                } else {
                                    showError('Failed to register companion as guest.');
                                }
                            } catch (err) {
                                showError('Failed to register companion as guest.');
                            }
                        } else if (guestData) {
                            showError('Please fill in all required fields.');
                        }
                    }
                }
            });
        }

        // View (SweetAlert, simplified: only show companions for each assigned room, no details, no room selection)
        const viewIcon = tr.querySelector('.fa-eye[data-action="view"]');
        if (viewIcon) {
            viewIcon.addEventListener('click', async () => {
                // Fetch reserved rooms for this reservation
                const rrRes = await axios.get('/Hotel-Reservation-Billing-System/api/admin/reservations/reserved_rooms.php', {
                    params: { operation: 'getAllReservedRooms' }
                });
                const reservedRooms = Array.isArray(rrRes.data) ? rrRes.data.filter(r => String(r.reservation_id) === String(res.reservation_id) && r.is_deleted == 0) : [];
                if (reservedRooms.length === 0) {
                    Swal.fire('No reserved rooms found for this reservation.');
                    return;
                }
                // Sort reservedRooms alphabetically by type_name, then room_number
                reservedRooms.sort((a, b) => {
                    const typeA = (a.type_name || '').toLowerCase();
                    const typeB = (b.type_name || '').toLowerCase();
                    if (typeA < typeB) return -1;
                    if (typeA > typeB) return 1;
                    // If type_name is the same, sort by room_number (as string for consistency)
                    const numA = String(a.room_number || '');
                    const numB = String(b.room_number || '');
                    return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
                });
                // Fetch all companions for all reserved rooms in this reservation
                let allCompanions = [];
                try {
                    const compRes = await axios.get('/Hotel-Reservation-Billing-System/api/admin/reservations/companions.php', {
                        params: { operation: 'getAllCompanions' }
                    });
                    if (Array.isArray(compRes.data)) {
                        allCompanions = compRes.data;
                    }
                } catch (err) { }
                // Build HTML for all rooms
                let html = `<div style='text-align:left;font-size:1.08em;'>`;
                reservedRooms.forEach((reservedRoom) => {
                    let companions = allCompanions.filter(c => String(c.reserved_room_id) === String(reservedRoom.reserved_room_id) && c.is_deleted == 0);
                    html += `<div style=\"background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;padding:1.2em 1.5em 1.2em 1.5em;margin-bottom:18px;\">`;
                    html += `<div style='display:flex;align-items:center;gap:12px;margin-bottom:18px;'>`;
                    html += `<div style='background:#0d6efd1a;border-radius:50%;padding:10px;display:flex;align-items:center;justify-content:center;'><i class='fas fa-bed text-primary' style='font-size:2em;'></i></div>`;
                    html += `<span style='font-size:1.35em;font-weight:700;letter-spacing:0.5px;'>Room: ${reservedRoom.type_name ? reservedRoom.type_name : ''}${reservedRoom.type_name && reservedRoom.room_number ? ' ' : ''}${reservedRoom.room_number ? reservedRoom.room_number : ''}</span>`;
                    html += `</div>`;
                    html += `<div style='margin-top:18px;margin-bottom:6px;'><i class='fas fa-users text-info'></i> <span class='label'>Assigned People</span><br>`;
                    if (companions.length > 0) {
                        html += `<div style='display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:6px;'>`;
                        companions.forEach((c, i) => {
                            html += `<div style='background:#f1f3f6;border-radius:8px;padding:9px 18px 9px 12px;display:flex;align-items:center;min-width:0;max-width:calc(50% - 18px);flex:1 1 45%;margin-bottom:6px;font-size:1.05em;box-shadow:0 1px 2px #0001;'>`;
                            html += `<i class='fas fa-user-friends text-secondary me-2' style='margin-right:9px;'></i> <span style='white-space:normal;text-overflow:ellipsis;overflow:hidden;max-width:220px;display:inline-block;font-weight:500;'>${c.full_name}</span>`;
                            html += `</div>`;
                        });
                        html += `</div>`;
                    } else {
                        html += `<span class='text-muted'>No companions listed.</span>`;
                    }
                    html += `</div>`;
                    html += `</div>`;
                });
                html += `</div>`;
                Swal.fire({
                    title: '',
                    html: html,
                    showConfirmButton: true,
                    confirmButtonText: '<i class=\"fas fa-times\"></i> Close',
                    customClass: {
                        popup: 'swal2-reservation-details',
                        htmlContainer: 'swal2-reservation-details-html'
                    },
                    background: '#f8f9fa',
                    width: 600,
                    showCloseButton: true
                });
            });
        }

        // Edit
        const editIcon = tr.querySelector('.fa-edit[data-action="edit"]');
        if (editIcon) {
            editIcon.addEventListener("click", () => {
                // Pass the full reservation object for editing
                window.currentReservation = res; // for guest_id reference in modal
                updateReservationModal(res, cachedRoomTypes, cachedStatuses, displayReservations);
            });
        }
        // Delete
        const deleteIcon = tr.querySelector('.fa-trash[data-action="delete"]');
        if (deleteIcon) {
            deleteIcon.addEventListener("click", () => {
                deleteReservationModal(res.reservation_id, displayReservations);
            });
        }
        // Remove check-in/check-out icons and logic
    });

    console.log("✅ Successfully rendered", reservations.length, "reservations"); // DEBUG
}

function getStatusBadge(status) {
    status = (status || '').toLowerCase();
    let icon = '<i class="fas fa-question-circle text-secondary"></i>';
    let label = status.charAt(0).toUpperCase() + status.slice(1);
    if (status === 'confirmed') icon = '<i class="fas fa-check-circle text-info"></i>';
    else if (status === 'pending') icon = '<i class="fas fa-hourglass-half text-warning"></i>';
    else if (status === 'checked-in') icon = '<i class="fas fa-door-open text-success"></i>';
    else if (status === 'checked-out') icon = '<i class="fas fa-sign-out-alt text-primary"></i>';
    else if (status === 'cancelled') icon = '<i class="fas fa-times-circle text-danger"></i>';
    return `${icon} ${label}`;
}

// ==========================
// === RESERVATION MODAL ====
// ==========================
function clearReservationForm() {
    const form = document.getElementById("reservationForm");
    if (form) form.reset();

    const setFieldValue = (id, value) => {
        const field = document.getElementById(id);
        if (field) field.value = value || "";
    };

    setFieldValue("reservationId", "");

    const modalLabel = document.getElementById("reservationModalLabel");
    if (modalLabel) {
        modalLabel.textContent = "Add New Reservation";
    }

    updateCheckoutDate();
    // Reset companion UI in Add Modal
    const maxCapDiv = document.getElementById("addMaxCapacityDisplay");
    const numCompanionSelect = document.getElementById("addNumCompanionsSelect");
    const container = document.getElementById("addCompanionFieldsContainer");
    if (maxCapDiv) maxCapDiv.textContent = "Max Capacity: N/A";
    if (numCompanionSelect) numCompanionSelect.innerHTML = '<option value="0">0</option>';
    if (container) container.innerHTML = "";

    const roomSelect = document.getElementById("roomSelect");
    if (roomSelect) {
        roomSelect.innerHTML = `<option value="">-- Select Room --</option>`;
    }

    setFieldValue("roomTypeSelect", "");
    updateAvailableRooms();
    loadIDTypes();

    // Reset payment method and reference number
    setFieldValue("paymentMethodSelect", "");
    setFieldValue("referenceNumber", "");
    const referenceContainer = document.getElementById("referenceNumberContainer");
    if (referenceContainer) {
        referenceContainer.style.display = 'none';
        const referenceInput = document.getElementById("referenceNumber");
        if (referenceInput) {
            referenceInput.required = false;
        }
    }

    // Ensure price/partial fields are reset
    if (typeof updateRoomPriceAndPartial === 'function') updateRoomPriceAndPartial();
}

function updateCheckoutDate() {
    const checkInDate = document.getElementById("checkInDate");
    const checkInTime = document.getElementById("checkInTime");
    const checkOutDate = document.getElementById("checkOutDate");
    const checkOutTime = document.getElementById("checkOutTime");

    if (!checkInDate || !checkOutDate) return;

    const checkIn = checkInDate.value;
    const checkInTimeValue = checkInTime ? (checkInTime.value || "14:00") : "14:00";

    if (checkIn && checkInTimeValue) {
        const dt = new Date(`${checkIn}T${checkInTimeValue}:00+08:00`);
        dt.setHours(dt.getHours() + 24);
        const manilaDate = dt.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
        const manilaTime = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Manila' });

        checkOutDate.value = manilaDate;
        checkOutDate.readOnly = true;

        if (checkOutTime) {
            checkOutTime.value = manilaTime;
            checkOutTime.readOnly = true;
        }
    } else {
        checkOutDate.value = "";
        if (checkOutTime) checkOutTime.value = "";
    }
}

// ==========================
// === ROOMS & ROOM TYPES ====
// ==========================
async function loadRoomTypes() {
    // Multi-room: fetch and cache room types for all dynamic sections
    try {
        const response = await axios.get(`${BASE_URL}/rooms/room-type.php`);
        cachedRoomTypes = Array.isArray(response.data)
            ? response.data.filter(t => !t.is_deleted || t.is_deleted === 0 || t.is_deleted === "0" || t.is_deleted === "FALSE" || t.is_deleted === "false")
            : [];
    } catch (error) {
        cachedRoomTypes = [];
        console.error("Failed to load room types:", error);
        showError("Failed to load room types.");
    }
}

async function updateAvailableRooms() {
    const roomTypeSelect = document.getElementById("roomTypeSelect");
    const roomSelect = document.getElementById("roomSelect");
    const checkInDate = document.getElementById("checkInDate");
    const checkOutDate = document.getElementById("checkOutDate");

    if (!roomSelect) return;

    roomSelect.innerHTML = `<option value="">-- Select Room --</option>`;

    const roomTypeId = roomTypeSelect ? roomTypeSelect.value : "";
    const checkInDateValue = checkInDate ? checkInDate.value : "";
    const checkOutDateValue = checkOutDate ? checkOutDate.value : "";

    // Defensive: Only fetch if all required fields are present
    if (!roomTypeId) {
        roomSelect.innerHTML = `<option value="">Select a room type first</option>`;
        return;
    }
    if (!checkInDateValue || !checkOutDateValue) {
        roomSelect.innerHTML = `<option value="">Select check-in and check-out date</option>`;
        return;
    }

    try {
        roomSelect.innerHTML = `<option value="">Loading available rooms...</option>`;

        const reservationId = document.getElementById("reservationId");
        const params = {
            operation: "getAvailableRooms",
            room_type_id: roomTypeId,
            check_in_date: checkInDateValue,
            check_out_date: checkOutDateValue
        };
        if (reservationId && reservationId.value) {
            params.reservation_id = reservationId.value;
        }

        // Always expect an array from API, fallback to []
        const response = await axios.get(`${BASE_URL}/rooms/rooms.php`, { params });
        roomSelect.innerHTML = `<option value="">-- Select Room --</option>`;
        let rooms = [];
        if (Array.isArray(response.data)) {
            rooms = response.data;
        } else if (response.data && typeof response.data === 'object') {
            rooms = Object.values(response.data);
        }
        // Only show available rooms for this type
        if (!rooms.length) {
            roomSelect.innerHTML = `<option value="">No available rooms for this type</option>`;
            return;
        }
        cachedRooms = rooms;
        rooms.forEach(room => {
            const option = document.createElement("option");
            option.value = room.room_id;
            option.textContent = `${room.room_number} (${room.type_name || 'Room'})`;
            roomSelect.appendChild(option);
        });
        // Show summary at the bottom
        const typeName = cachedRoomTypes.find(t => t.room_type_id == roomTypeId)?.type_name || 'room';
        roomSelect.innerHTML += `<option disabled>───────────────</option>`;
        roomSelect.innerHTML += `<option disabled>${rooms.length} ${typeName} room(s) available</option>`;
    } catch (error) {
        console.error("Failed to load available rooms:", error);
        roomSelect.innerHTML = `<option value="">Error loading rooms: ${error.message}</option>`;
    }
}

// ==========================
// === GUESTS ===============
// ==========================
async function loadGuests() {
    const select = document.getElementById("guestSelect");
    if (!select) {
        console.warn("guestSelect element not found, skipping loadGuests");
        return;
    }

    select.innerHTML = `<option value="">-- Select Guest --</option>`;
    try {
        const response = await axios.get(`${BASE_URL}/guests/guests.php`, {
            params: { operation: "getAllGuests" }
        });
        cachedGuests = response.data || [];
        cachedGuests.forEach(guest => {
            const option = document.createElement("option");
            option.value = guest.guest_id;
            option.textContent = `${guest.first_name} ${guest.suffix ? guest.suffix + " " : ""}${guest.last_name}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to load guests:", error);
        showError("Failed to load guests.");
    }
}

function filterGuestDropdown(query) {
    const select = document.getElementById("guestSelect");
    if (!select || !cachedGuests || !cachedGuests.length) return;

    const q = (query || "").toLowerCase();
    select.innerHTML = `<option value="">-- Select Guest --</option>`;
    cachedGuests
        .filter(g => (`${g.first_name} ${g.last_name} ${g.suffix || ""}`.toLowerCase().includes(q)))
        .forEach(guest => {
            const option = document.createElement("option");
            option.value = guest.guest_id;
            option.textContent = `${guest.first_name} ${guest.suffix ? guest.suffix + " " : ""}${guest.last_name}`;
            select.appendChild(option);
        });
}

function clearGuestForm() {
    const form = document.getElementById("guestForm");
    if (form) form.reset();

    const guestId = document.getElementById("guestId");
    if (guestId) guestId.value = "";

    const dateOfBirth = document.getElementById("dateOfBirth");
    if (dateOfBirth) {
        const today = new Date();
        dateOfBirth.max = today.toISOString().split("T")[0];
    }
}

async function saveGuest() {
    const getFieldValue = (id) => {
        const field = document.getElementById(id);
        return field ? field.value : "";
    };

    const firstName = getFieldValue("firstName");
    const lastName = getFieldValue("lastName");
    const middleName = getFieldValue("middleName");
    const suffix = getFieldValue("suffix");
    const dateOfBirth = getFieldValue("dateOfBirth");
    const email = getFieldValue("email");
    const phone = getFieldValue("phone");
    const idType = getFieldValue("idType");
    const idNumber = getFieldValue("idNumber");

    // Validation
    if (!firstName || !lastName || !dateOfBirth || !email || !phone || !idType || !idNumber) {
        showError("Please fill in all guest fields.");
        return;
    }

    // Date of birth cannot be in the future
    const today = new Date();
    const dob = new Date(dateOfBirth);
    today.setHours(0, 0, 0, 0);
    if (dob > today) {
        showError("Date of birth cannot be in the future.");
        return;
    }

    // Find guest_idtype_id from idType
    let guest_idtype_id = null;
    try {
        const idTypesRes = await axios.get(`${BASE_URL}/guests/id_types.php`, { params: { operation: "getAllIDTypes" } });
        const idTypes = idTypesRes.data || [];
        const found = idTypes.find(t => t.id_type === idType);
        guest_idtype_id = found ? found.guest_idtype_id : null;
    } catch (error) {
        console.error("Failed to fetch ID types:", error);
    }

    const jsonData = {
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
        suffix: suffix,
        date_of_birth: dateOfBirth,
        email: email,
        phone_number: phone,
        id_type: idType,
        id_number: idNumber,
        guest_idtype_id: guest_idtype_id
    };

    const formData = new FormData();
    formData.append("operation", "insertGuest");
    formData.append("json", JSON.stringify(jsonData));

    try {
        const response = await axios.post(`${BASE_URL}/guests/guests.php`, formData);
        if (response.data == 1) {
            loadGuests();
            showSuccess("Guest added!");
        } else {
            showError("Failed to add guest.");
        }
    } catch (error) {
        console.error("Failed to save guest:", error);
        showError("Failed to add guest.");
    }
}

// ==========================
// === RESERVATION STATUS ====
// ==========================
async function loadStatuses() {
    const select = document.getElementById("statusSelect");
    if (!select) {
        console.warn("statusSelect element not found, skipping loadStatuses");
        return;
    }

    select.innerHTML = "";
    try {
        const response = await axios.get(`${BASE_URL}/reservations/reservation_status.php`);
        if (response.data && Array.isArray(response.data)) {
            cachedStatuses = response.data;
            if (cachedStatuses.length === 0) {
                select.innerHTML = `<option value="">No statuses found</option>`;
                return;
            }
            cachedStatuses.forEach(status => {
                const option = document.createElement("option");
                option.value = status.reservation_status_id;
                option.textContent = status.reservation_status;
                select.appendChild(option);
            });
        } else {
            throw new Error("Invalid response format from reservation_status.php");
        }
    } catch (error) {
        console.error("Error loading reservation statuses:", error);
        showError("Failed to load reservation statuses.");
    }
}

function updateStatusFilter() {
    const statusFilter = document.getElementById("statusFilter");
    if (!statusFilter || !cachedStatuses || cachedStatuses.length === 0) return;

    statusFilter.innerHTML = `<option value="">All Statuses</option>`;
    cachedStatuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status.reservation_status;
        option.textContent = status.reservation_status.charAt(0).toUpperCase() + status.reservation_status.slice(1);
        statusFilter.appendChild(option);
    });
}

// ==========================
// === RESERVED ROOMS LOGIC =
// ==========================
async function upsertReservedRoom(reservationId, roomId) {
    if (!reservationId || !roomId) return;
    try {
        const checkRes = await axios.get(`${BASE_URL}/reservations/reserved_rooms.php`, {
            params: { operation: "getAllReservedRooms" }
        });
        let reservedRoom = null;
        if (Array.isArray(checkRes.data)) {
            reservedRoom = checkRes.data.find(rr => rr.reservation_id == reservationId && rr.is_deleted == 0);
        }
        if (reservedRoom) {
            if (reservedRoom.room_id != roomId) {
                await axios.post(`${BASE_URL}/reservations/reserved_rooms.php`, new FormData(Object.entries({
                    operation: "deleteReservedRoom",
                    json: JSON.stringify({ reserved_room_id: reservedRoom.reserved_room_id })
                })));
                await saveReservedRoom(reservationId, roomId);
            }
        } else {
            await saveReservedRoom(reservationId, roomId);
        }
    } catch (err) {
        console.error("Error in upsertReservedRoom, fallback to saveReservedRoom:", err);
        await saveReservedRoom(reservationId, roomId);
    }
}

async function saveReservedRoom(reservationId, roomId) {
    if (!reservationId || !roomId) return;
    const formData = new FormData();
    formData.append("operation", "insertReservedRoom");
    formData.append("json", JSON.stringify({
        reservation_id: reservationId,
        room_id: roomId,
    }));
    try {
        await axios.post(`${BASE_URL}/reservations/reserved_rooms.php`, formData);
    } catch (error) {
        console.error("Error saving reserved room:", error);
    }
}

// ==========================
// === SAVE RESERVATION =====
// ==========================
async function saveReservation() {
    // Disable save button to prevent multiple submissions
    const saveBtn = document.getElementById("saveReservationBtn");
    if (saveBtn) saveBtn.disabled = true;
    function getVal(id) {
        const el = document.getElementById(id);
        return el ? el.value : "";
    }
    // Get selected payment method for partial payment
    const subMethodId = getVal("paymentMethodSelect");
    const referenceNumber = getVal("referenceNumber");
    let guestId = document.getElementById("guestSelectId")?.value || getVal("guestSelect");
    const reservationId = getVal("reservationId");
    // Guest fields
    const firstName = getVal("firstName");
    const lastName = getVal("lastName");
    const middleName = getVal("middleName");
    const suffix = getVal("suffix");
    const dateOfBirth = getVal("dateOfBirth");
    const email = getVal("email");
    const phone = getVal("phone");
    const idType = getVal("idType");
    const idNumber = getVal("idNumber");
    const checkInDate = getVal("checkInDate");
    const checkOutDate = getVal("checkOutDate");
    const statusId = getVal("statusSelect");

    // Validation (for guest and stay info only)
    if (!firstName || !lastName || !dateOfBirth || !email || !phone || !idType || !idNumber || !checkInDate || !statusId) {
        showError("Please fill in all required fields.");
        if (saveBtn) saveBtn.disabled = false;
        return;
    }

    // Validate payment method selection
    if (!subMethodId) {
        showError("Please select a payment method.");
        if (saveBtn) saveBtn.disabled = false;
        return;
    }

    // Validate reference number for GCash and PayMaya
    const paymentMethodSelect = document.getElementById("paymentMethodSelect");
    const selectedOption = paymentMethodSelect ? paymentMethodSelect.options[paymentMethodSelect.selectedIndex] : null;
    const selectedMethodName = selectedOption ? selectedOption.text.toLowerCase() : '';

    if ((selectedMethodName === 'gcash' || selectedMethodName === 'paymaya') && !referenceNumber.trim()) {
        showError("Reference number is required for " + selectedOption.text + " payments.");
        if (saveBtn) saveBtn.disabled = false;
        return;
    }

    // Validate at least one room
    if (!window.multiRoomData || !Array.isArray(window.multiRoomData) || window.multiRoomData.length === 0) {
        showError("Please add at least one room to the booking.");
        if (saveBtn) saveBtn.disabled = false;
        return;
    }
    // Validate all rooms have type and room selected
    for (const room of window.multiRoomData) {
        if (!room.room_type_id || !room.room_id) {
            showError("Please select a room type and available room for each room.");
            if (saveBtn) saveBtn.disabled = false;
            return;
        }
    }

    // Check-in date must be today or future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(checkInDate);
    checkIn.setHours(0, 0, 0, 0);
    if (checkIn < today) {
        showError("Check-in date cannot be before today.");
        if (saveBtn) saveBtn.disabled = false;
        return;
    }

    // Map id_type to guest_idtype_id
    let guest_idtype_id = null;
    try {
        const idTypesRes = await axios.get(`${BASE_URL}/guests/id_types.php`, { params: { operation: "getAllIDTypes" } });
        const idTypes = idTypesRes.data || [];
        const found = idTypes.find(t => t.id_type === idType);
        guest_idtype_id = found ? found.guest_idtype_id : null;
    } catch (error) {
        guest_idtype_id = null;
    }

    // If guestId is not selected, create guest first
    if (!guestId) {
        const guestData = {
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            suffix: suffix,
            date_of_birth: dateOfBirth,
            email: email,
            phone_number: phone,
            id_type: idType,
            id_number: idNumber,
            guest_idtype_id: guest_idtype_id
        };
        const guestForm = new FormData();
        guestForm.append("operation", "insertGuest");
        guestForm.append("json", JSON.stringify(guestData));
        try {
            const guestRes = await axios.post(`${BASE_URL}/guests/guests.php`, guestForm);
            if (guestRes.data && typeof guestRes.data === 'object' && guestRes.data.guest_id) {
                guestId = guestRes.data.guest_id;
            } else if (guestRes.data && !isNaN(guestRes.data) && Number(guestRes.data) > 0) {
                const guestsList = await axios.get(`${BASE_URL}/guests/guests.php`, { params: { operation: "getAllGuests" } });
                if (Array.isArray(guestsList.data)) {
                    const found = guestsList.data.find(g => g.email === email);
                    guestId = found ? found.guest_id : null;
                }
            }
            if (!guestId) {
                showError("Failed to save guest. Please check guest info.");
                if (saveBtn) saveBtn.disabled = false;
                return;
            }
        } catch (err) {
            console.error("Error saving guest:", err);
            showError("Failed to save guest. Please check guest info.");
            if (saveBtn) saveBtn.disabled = false;
            return;
        }
    }

    // Build rooms array for API
    const roomsPayload = window.multiRoomData.map((room, idx) => {
        let companions = [...room.companions];
        if (idx === 0) {
            // Only for the first room, add the main guest as the first companion
            companions = [
                `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}${suffix ? ' ' + suffix : ''}`,
                ...companions
            ];
        }
        // For other rooms, do not add the main guest
        return {
            room_type_id: room.room_type_id,
            room_id: room.room_id,
            companions: companions,
            is_main_guest: idx === 0
        };
    });

    const jsonData = {
        guest_id: guestId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        reservation_status_id: statusId,
        sub_method_id: subMethodId,
        reference_number: referenceNumber.trim() || null,
        rooms: roomsPayload
    };
    let operation = "insertReservation";
    if (reservationId) {
        jsonData.reservation_id = reservationId;
        operation = "updateReservation";
    }
    // Save reservation
    const formData = new FormData();
    formData.append("operation", operation);
    formData.append("json", JSON.stringify(jsonData));
    try {
        const response = await axios.post(`${BASE_URL}/reservations/reservations.php`, formData);
        if (response.data == 1) {
            displayReservations();
            const modal = document.getElementById("reservationModal");
            if (modal && window.bootstrap) {
                const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modal);
                modalInstance.hide();
            } else if (modal) {
                // fallback for Bootstrap 4
                $(modal).modal('hide');
            }
            // Fallback: forcibly remove any stuck modal-backdrop and always unlock scroll after modal closes
            setTimeout(() => {
                document.querySelectorAll('.modal-backdrop').forEach(bd => bd.parentNode && bd.parentNode.removeChild(bd));
                // Remove modal-open regardless, as a last fallback
                document.body.classList.remove('modal-open');
                // Remove inline style that may block scroll
                document.body.style.overflow = '';
            }, 500);
            showSuccess("Reservation saved!");
        } else {
            showError("Failed to save reservation.");
        }
    } catch (error) {
        console.error("Error saving reservation:", error);
        showError("An error occurred while saving the reservation.");
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

// ==========================
// === ROOM STATUS HELPERS ===
// ==========================
async function setRoomOccupied(roomId) {
    try {
        const formData = new FormData();
        formData.append("operation", "updateRoom");
        formData.append("json", JSON.stringify({
            room_id: roomId,
            room_status_id: await getRoomStatusIdByName('occupied'),
            update_type: "status_only"
        }));
        const response = await axios({
            url: `${BASE_URL}/rooms/rooms.php`,
            method: "POST",
            data: formData
        });
        return response.data == 1;
    } catch (error) {
        console.error("Error setting room occupied:", error);
        return false;
    }
}

async function setRoomAvailable(roomId) {
    try {
        const formData = new FormData();
        formData.append("operation", "updateRoom");
        formData.append("json", JSON.stringify({
            room_id: roomId,
            room_status_id: await getRoomStatusIdByName('available'),
            update_type: "status_only"
        }));
        const response = await axios({
            url: `${BASE_URL}/rooms/rooms.php`,
            method: "POST",
            data: formData
        });
        return response.data == 1;
    } catch (error) {
        console.error("Error setting room available:", error);
        return false;
    }
}

async function getRoomStatusIdByName(statusName) {
    try {
        const response = await axios.get(`${BASE_URL}/rooms/rooms.php`, {
            params: { operation: "getAllRoomStatus" }
        });
        if (Array.isArray(response.data)) {
            const found = response.data.find(s => s.room_status === statusName);
            return found ? found.room_status_id : null;
        }
        return null;
    } catch (error) {
        console.error("Error getting room status ID:", error);
        return null;
    }
}

// ==========================
// === UTILITIES ============
// ==========================
function showError(msg) {
    if (window.Swal) {
        Swal.fire("Error", msg, "error");
    } else {
        alert(msg);
    }
}

function showSuccess(msg) {
    if (window.Swal) {
        Swal.fire("Success", msg, "success");
    } else {
        alert(msg);
    }
}

// Dynamically load ID Types from API for the Add Reservation modal
async function loadIDTypes() {
    const select = document.getElementById("idType");
    if (!select) return;
    select.innerHTML = `<option value="">-- Select ID Type --</option>`;
    try {
        const response = await axios.get(`${BASE_URL}/guests/id_types.php`, {
            params: { operation: "getAllIDTypes" }
        });
        let idTypes = Array.isArray(response.data) ? response.data : [];
        // Sort alphabetically by id_type
        idTypes = idTypes.sort((a, b) => (a.id_type || '').localeCompare(b.id_type || ''));
        idTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type.id_type;
            option.textContent = type.id_type;
            select.appendChild(option);
        });
    } catch (error) {
        // fallback: keep only the placeholder
    }
}

async function filterReservations() {
    const status = document.getElementById("statusFilter")?.value || "";
    const dateFrom = document.getElementById("dateFrom")?.value || ""; // check-in date
    const dateTo = document.getElementById("dateTo")?.value || "";     // check-out date
    const search = document.getElementById("searchReservation")?.value.trim() || "";

    let url = "/Hotel-Reservation-Billing-System/api/admin/reservations/reservations.php?operation=getAllReservations";
    const params = [];
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    if (dateFrom) params.push(`date_from=${encodeURIComponent(dateFrom)}`);
    if (dateTo) params.push(`date_to=${encodeURIComponent(dateTo)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length > 0) url += "&" + params.join("&");

    try {
        const response = await axios.get(url);
        let reservations = response.data || [];

        // --- Filter by check-in and check-out date ---
        reservations = reservations.filter(r => {
            const checkIn = r.check_in_date;
            const checkOut = r.check_out_date;
            if (!checkIn || !checkOut) return false;
            // If both dates are set: check_in_date >= dateFrom AND check_out_date <= dateTo
            if (dateFrom && dateTo) {
                return checkIn >= dateFrom && checkOut <= dateTo;
            }
            // Only check-in date set
            if (dateFrom) {
                return checkIn >= dateFrom;
            }
            // Only check-out date set
            if (dateTo) {
                return checkOut <= dateTo;
            }
            return true;
        });

        displayReservationsTable(reservations);
    } catch (error) {
        displayReservationsTable([]);
    }
}

// --- Reservation Stats Overview ---
function updateReservationStatsOverview(reservations) {
    // Defensive: always use array
    reservations = Array.isArray(reservations) ? reservations : [];
    let total = reservations.length;
    let checkedIn = 0, checkedOut = 0, reserved = 0, pending = 0, cancelled = 0;
    reservations.forEach(r => {
        const status = (r.reservation_status || r.room_status || '').toLowerCase();
        if (status === "checked-in") checkedIn++;
        else if (status === "checked-out") checkedOut++;
        else if (status === "confirmed") reserved++;
        else if (status === "pending") pending++;
        else if (status === "cancelled") cancelled++;
    });
    document.getElementById("statTotalReservations").textContent = total;
    document.getElementById("statCheckedIn").textContent = checkedIn;
    document.getElementById("statCheckedOut").textContent = checkedOut;
    document.getElementById("statReserved").textContent = reserved;
    document.getElementById("statPending").textContent = pending;
    document.getElementById("statCancelled").textContent = cancelled;
}
