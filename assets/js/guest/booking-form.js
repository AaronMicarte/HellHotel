// Stepper logic
const stepLabels = [document.getElementById('step-1-label'), document.getElementById('step-2-label'), document.getElementById('step-3-label')];
const forms = [
    document.getElementById('guestInfoForm'),
    document.getElementById('bookingDetailsForm'),
    document.getElementById('paymentForm')
];
let currentStep = 0;
let guestInfo = {}; // Initialize guest info object

function showStep(idx) {
    forms.forEach((f, i) => f.classList.toggle('d-none', i !== idx));
    stepLabels.forEach((l, i) => {
        l.classList.remove('active', 'completed');
        if (i < idx) {
            l.classList.add('completed');
        } else if (i === idx) {
            l.classList.add('active');
        }
    });
    // Hide booking success message on step change
    const successMsg = document.getElementById('bookingSuccess');
    if (successMsg) successMsg.classList.remove('active');
}
showStep(0);

// Load ID types
async function loadIdTypes() {
    try {
        const { data } = await axios.get('/Hotel-Reservation-Billing-System/api/admin/guests/id_types.php', {
            params: { operation: 'getAllIDTypes' }
        });
        const select = document.getElementById('idType');
        if (!select) return;
        const sorted = Array.isArray(data) ? [...data].sort((a, b) => (a.id_type || '').localeCompare(b.id_type || '')) : [];
        select.innerHTML = '<option value="">Select ID Type</option>' +
            sorted.map(t =>
                `<option value="${t.guest_idtype_id}">${t.id_type}</option>`
            ).join('');
    } catch { }
}
loadIdTypes();

// Load payment methods (handle 404 and missing select gracefully)
async function loadPaymentMethods() {
    try {
        const { data } = await axios.get('/Hotel-Reservation-Billing-System/api/admin/payments/payment_methods.php');
        const select = document.getElementById('paymentMethod');
        if (!select) return;
        select.innerHTML = '<option value="">Select Method</option>' +
            (Array.isArray(data) ? data : []).map(m =>
                `<option value="${m.sub_method_id}">${m.name} (${m.category_name})</option>`
            ).join('');
        select.disabled = false;
    } catch (e) {
        const select = document.getElementById('paymentMethod');
        if (select) {
            select.innerHTML = '<option value="">Payment methods unavailable</option>';
            select.disabled = true;
        }
        showToast('Failed to load payment methods.', 'error');
    }
}
loadPaymentMethods();

// Room types management
let roomTypes = [];
let selectedRooms = {}; // {roomTypeId: quantity}
let totalAmount = 0;
// New room-based companion tracking
let roomCompanions = {}; // {roomTypeId: {numCompanions: N, companions: [{full_name: 'Name'}]}}
// Old companion tracking (removing this but keeping variable for compatibility)
let totalCompanions = 0;
let companionDetails = [];

// Load all room types
document.addEventListener('DOMContentLoaded', async function () {
    await loadAllRoomTypes();

    // Handle URL parameter for pre-selected room
    const params = new URLSearchParams(window.location.search);
    const typeName = params.get('type');
    if (typeName) {
        const type = roomTypes.find(t => (t.type_name || '').toLowerCase() === typeName.toLowerCase());
        if (type) {
            // Pre-select one quantity of this room type
            updateRoomQuantity(type.room_type_id, 1);
        }
    }

    // Set back button to correct room listing page
    const backBtn = document.getElementById('backToRoomDetailsBtn');
    if (backBtn) {
        backBtn.href = 'room-selection.html';
    }

    // Set minimum date for check-in (today)
    const today = new Date();
    const checkInDate = document.getElementById('checkInDate');
    if (checkInDate) {
        checkInDate.min = today.toISOString().split('T')[0];
    }

    // Set minimum date for check-out (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkOutDate = document.getElementById('checkOutDate');
    if (checkOutDate) {
        checkOutDate.min = tomorrow.toISOString().split('T')[0];
    }

    // Always set check-out date to the day after check-in (12 hour rule = 1 day)
    checkInDate?.addEventListener('change', function () {
        if (checkOutDate) {
            const selectedDate = new Date(this.value);
            selectedDate.setDate(selectedDate.getDate() + 1);
            const nextDayCheckout = selectedDate.toISOString().split('T')[0];
            checkOutDate.min = nextDayCheckout;

            // Always update checkout to the next day
            checkOutDate.value = nextDayCheckout;
        }
    });
});

async function loadAllRoomTypes() {
    try {
        const { data } = await axios.get('/Hotel-Reservation-Billing-System/api/admin/rooms/room-type.php', {
            params: { operation: 'getAllRoomTypes' }
        });
        roomTypes = Array.isArray(data) ? data : [];
        displayRoomTypeCards();
    } catch (error) {
        console.error('Failed to load room types:', error);
        showToast('Failed to load room types. Please refresh the page.', 'error');
    }
}

function displayRoomTypeCards() {
    const container = document.getElementById('roomTypesContainer');
    if (!container) return;

    if (!roomTypes.length) {
        container.innerHTML = '<div class="col-12"><div class="alert alert-warning">No room types available. Please try again later.</div></div>';
        return;
    }

    container.innerHTML = '';

    roomTypes.forEach(room => {
        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6 mb-3'; // Keep 3 columns per row
        card.innerHTML = `
            <div class="room-type-card compact-card" data-room-id="${room.room_type_id}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h5 class="card-title mb-0" style="color:var(--hell-red);font-weight:700;">${room.type_name}</h5>
                        <div class="small ms-1 opacity-75">${room.max_capacity} guests</div>
                    </div>
                    <div class="price" style="color:var(--hell-accent);font-weight:700;font-size:1.2rem;">
                        ₱${Number(room.price_per_stay).toLocaleString()}/stay
                    </div>
                </div>
                <div class="d-flex justify-content-end align-items-center mt-2">
                    <div class="quantity-control">
                        <input 
                            type="number" 
                            min="0" 
                            value="${selectedRooms[room.room_type_id] || 0}" 
                            class="form-control form-control-sm text-center" 
                            id="quantity-${room.room_type_id}" 
                            onchange="updateRoomQuantity(${room.room_type_id}, this.value, true)" 
                            style="width:60px;">
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    updateRoomCompanions();
}

function updateRoomQuantity(roomTypeId, change, isDirectValue = false) {
    const roomType = roomTypes.find(r => r.room_type_id == roomTypeId);
    if (!roomType) return;

    // Get current quantity
    let currentQuantity = selectedRooms[roomTypeId] || 0;

    // Update quantity based on change
    if (isDirectValue) {
        currentQuantity = parseInt(change) || 0;
    } else {
        currentQuantity += parseInt(change);
    }

    // Ensure quantity is not negative
    currentQuantity = Math.max(0, currentQuantity);

    // Update selected rooms object
    if (currentQuantity > 0) {
        selectedRooms[roomTypeId] = currentQuantity;
    } else {
        delete selectedRooms[roomTypeId];
    }

    // Update input field
    const inputField = document.getElementById(`quantity-${roomTypeId}`);
    if (inputField) {
        inputField.value = currentQuantity;
    }

    // Highlight card if selected
    const card = document.querySelector(`.room-type-card[data-room-id="${roomTypeId}"]`);
    if (card) {
        if (currentQuantity > 0) {
            card.classList.add('selected-room');
            card.style.borderColor = '#d20707';
            card.style.borderWidth = '2px';
        } else {
            card.classList.remove('selected-room');
            card.style.borderColor = '#d20707';
            card.style.borderWidth = '1px';
        }
    }

    // Update companion UI
    updateRoomCompanions();
}

function updateRoomCompanions() {
    const container = document.getElementById('companionsContainer');
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // If no rooms selected, nothing to do
    if (Object.keys(selectedRooms).length === 0) {
        return;
    }

    // Create the main container for room companions with enhanced styling
    const companionSection = document.createElement('div');
    companionSection.className = 'companion-container';
    companionSection.innerHTML = `
        <div class="companion-header">
            <i class="fas fa-users me-2"></i>Room Companions & Guest Assignment
            <small class="d-block mt-2 opacity-75" style="font-size: 0.9rem; font-weight: 400;">
                Manage companions for each selected room
            </small>
        </div>
        <div id="roomCompanionsArea"></div>
    `;
    container.appendChild(companionSection);

    const roomCompanionsArea = document.getElementById('roomCompanionsArea');

    // For each selected room type, create individual cards based on quantity
    Object.entries(selectedRooms).forEach(([roomTypeId, quantity]) => {
        const roomType = roomTypes.find(r => r.room_type_id == roomTypeId);
        if (!roomType) return;

        // For each quantity, create a separate card
        for (let i = 0; i < quantity; i++) {
            const roomIndexKey = `${roomTypeId}-${i}`;

            // Ensure room exists in roomCompanions object with unique index
            if (!roomCompanions[roomIndexKey]) {
                roomCompanions[roomIndexKey] = {
                    roomTypeId: roomTypeId,
                    numCompanions: 0,
                    companions: []
                };
            }

            // Create card for this individual room with enhanced styling
            const roomCard = document.createElement('div');
            roomCard.className = 'card mb-3 enhanced-room-card';

            // Determine if this is the first room (main guest room)
            const isFirstRoom = (Object.keys(selectedRooms).indexOf(roomTypeId) === 0) && (i === 0);

            // For the first room, companions max is (maxCapacity-1), for others it's maxCapacity
            const companionsMax = isFirstRoom ? Math.max(0, roomType.max_capacity - 1) : roomType.max_capacity;

            roomCard.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <div class="room-info-header">
                        <strong class="room-type-name">${roomType.type_name}</strong>
                        <span class="room-number-badge">Room #${i + 1}</span>
                        ${isFirstRoom ? '<span class="badge main-guest-badge ms-2"><i class="fas fa-star me-1"></i>Main Guest Room</span>' : ''}
                    </div>
                    <div class="companion-selector">
                        <label class="companion-label">Companions:</label>
                        <select class="form-select companion-count-select" data-room-id="${roomIndexKey}">
                            ${createCompanionCountOptions(companionsMax, roomCompanions[roomIndexKey].numCompanions)}
                        </select>
                    </div>
                </div>
                <div class="card-body" id="companions-inputs-${roomIndexKey}"></div>
            `;
            roomCompanionsArea.appendChild(roomCard);

            // Add listeners for companion dropdown
            const companionSelect = roomCard.querySelector('.companion-count-select');
            companionSelect.addEventListener('change', function () {
                const numCompanions = parseInt(this.value) || 0;
                const roomId = this.getAttribute('data-room-id');

                // Update the roomCompanions object
                roomCompanions[roomId].numCompanions = numCompanions;

                // Adjust the companions array size
                while (roomCompanions[roomId].companions.length < numCompanions) {
                    roomCompanions[roomId].companions.push({ full_name: '' });
                }
                if (roomCompanions[roomId].companions.length > numCompanions) {
                    roomCompanions[roomId].companions = roomCompanions[roomId].companions.slice(0, numCompanions);
                }

                // Render the companion inputs
                renderCompanionInputs(roomId);
            });

            // Trigger initial render of companion inputs
            renderCompanionInputs(roomIndexKey);
        }
    });    // Update the old companionDetails array for compatibility with the rest of the code
    companionDetails = [];
    Object.values(roomCompanions).forEach(room => {
        room.companions.forEach(companion => {
            if (companion.full_name.trim()) {
                companionDetails.push({ full_name: companion.full_name });
            }
        });
    });
}

// Helper function to create options for companion count dropdown
function createCompanionCountOptions(maxCount, selectedValue = 0) {
    let options = '';
    for (let i = 0; i <= maxCount; i++) {
        options += `<option value="${i}" ${i === selectedValue ? 'selected' : ''}>${i}</option>`;
    }
    return options;
}

// Helper function to render companion input fields
function renderCompanionInputs(roomId) {
    const container = document.getElementById(`companions-inputs-${roomId}`);
    if (!container) return;

    container.innerHTML = '';

    const room = roomCompanions[roomId];
    if (!room) return;

    // Create a row for companions
    const row = document.createElement('div');
    row.className = 'row g-2';
    container.appendChild(row);

    // Extract room type ID and index from the roomId
    const [roomTypeId, roomIndex] = roomId.split('-').map(part => parseInt(part));
    const roomType = roomTypes.find(r => r.room_type_id == roomTypeId);

    // Determine if this is the first room (main guest room)
    const isFirstRoom = (Object.keys(selectedRooms).indexOf(roomTypeId.toString()) === 0) && (roomIndex === 0);

    if (isFirstRoom) {
        // Main guest assigned to first slot, disabled (not counted in companions)
        const mainGuestCol = document.createElement('div');
        mainGuestCol.className = 'col-12 mb-3';
        // Check if guestInfo is available
        const guestName = guestInfo && guestInfo.first_name ?
            `${guestInfo.first_name || ''} ${guestInfo.last_name || ''}` :
            '(Main Guest)';

        mainGuestCol.innerHTML = `
            <div class="main-guest-container">
                <label class="form-label main-guest-label">
                    <i class='fas fa-user-crown me-2'></i>Main Guest (auto-assigned)
                </label>
                <input type="text" class="form-control main-guest-input" value="${guestName}" disabled>
            </div>
        `;
        row.appendChild(mainGuestCol);
    }

    // If no companions, nothing more to render
    if (room.numCompanions <= 0) return;

    // Create input for each companion
    for (let i = 0; i < room.numCompanions; i++) {
        // Ensure companions array has this entry
        if (!room.companions[i]) {
            room.companions[i] = { full_name: '' };
        }

        const companionCol = document.createElement('div');
        companionCol.className = 'col-lg-6 col-md-12 mb-3';
        companionCol.innerHTML = `
            <div class="companion-input-group">
                <div class="input-group">
                    <span class="input-group-text companion-number">
                        <i class='fas fa-user-friends me-1'></i>#${i + 1}
                    </span>
                    <input type="text" class="form-control companion-name-input" 
                           placeholder="Enter full name" value="${room.companions[i]?.full_name || ''}" 
                           data-room-id="${roomId}" data-companion-index="${i}">
                </div>
            </div>
        `;
        row.appendChild(companionCol);

        // Add listener for name input
        const nameInput = companionCol.querySelector('.companion-name-input');
        nameInput.addEventListener('input', function () {
            const roomId = this.getAttribute('data-room-id');
            const companionIndex = parseInt(this.getAttribute('data-companion-index'));

            // Ensure the roomCompanions object has this entry
            if (!roomCompanions[roomId]) {
                roomCompanions[roomId] = { companions: [] };
            }

            if (!roomCompanions[roomId].companions) {
                roomCompanions[roomId].companions = [];
            }

            // Ensure companions array has this entry
            if (!roomCompanions[roomId].companions[companionIndex]) {
                roomCompanions[roomId].companions[companionIndex] = { full_name: '' };
            }

            roomCompanions[roomId].companions[companionIndex].full_name = this.value.trim();

            // Update the old companionDetails array
            updateCompanionDetailsArray();
        });
    }
}

// Helper to update the old companionDetails array
function updateCompanionDetailsArray() {
    companionDetails = [];
    Object.values(roomCompanions).forEach(room => {
        if (room && room.companions) {
            room.companions.forEach(companion => {
                if (companion && companion.full_name && companion.full_name.trim()) {
                    companionDetails.push({ full_name: companion.full_name.trim() });
                }
            });
        }
    });
}

// ID Picture preview
const idPictureInput = document.getElementById('idPicture');
if (idPictureInput) {
    idPictureInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        const preview = document.getElementById('idPicPreview');
        if (file && preview) {
            const reader = new FileReader();
            reader.onload = function (evt) {
                preview.src = evt.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }
    });
}

// Header/footer placeholders and back button (add null checks)
document.addEventListener('DOMContentLoaded', function () {
    fetch('pages/header.html').then(r => r.text()).then(h => {
        const header = document.getElementById('header-placeholder');
        if (header) header.innerHTML = h;
    });
    fetch('pages/footer.html').then(r => r.text()).then(h => {
        const footer = document.getElementById('footer-placeholder');
        if (footer) footer.innerHTML = h;
    });
});

// --- Step Navigation (Back Buttons) ---
document.getElementById('backToStep1Btn')?.addEventListener('click', function () {
    showStep(0);
});
document.getElementById('backToStep2Btn')?.addEventListener('click', function () {
    showStep(1);
});

// Set max date for Date of Birth picker (today)
document.addEventListener('DOMContentLoaded', function () {
    const dob = document.getElementById('dateOfBirth');
    if (dob) {
        const today = new Date();
        dob.max = today.toISOString().split('T')[0];
    }
});

// Helper function to format dates nicely
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Toast utility
function showToast(msg, type = 'warning') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    const id = 'toast-' + Date.now();
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-times-circle' : 'fa-exclamation-triangle');
    const bg = type === 'success' ? 'bg-success' : (type === 'error' ? 'bg-danger' : 'bg-warning');
    const html = `
        <div id="${id}" class="toast align-items-center text-white ${bg} border-0 mb-2 show" role="alert" aria-live="assertive" aria-atomic="true" style="min-width:220px;">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${icon} me-2"></i>${msg}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close" onclick="this.closest('.toast').remove();"></button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', html);
    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.remove();
    }, 3200);
}

// Step 1 -> Step 2
document.getElementById('toStep2Btn').onclick = async function () {
    const form = document.getElementById('guestInfoForm');
    // Validate all required fields
    const requiredFields = [
        'firstName', 'lastName', 'dateOfBirth', 'email', 'phoneNumber', 'idType', 'idNumber', 'idPicture'
    ];
    let missing = [];
    requiredFields.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !el.value || (el.type === 'file' && !el.files.length)) missing.push(id);
    });
    // Validate phone number (PH format)
    const phone = document.getElementById('phoneNumber').value.trim();
    const phonePH = /^(\+63|0)9\d{9}$/;
    if (!phonePH.test(phone)) {
        showToast('Please enter a valid PH mobile number (e.g. +639123456789 or 09123456789).', 'warning');
        document.getElementById('phoneNumber').focus();
        return;
    }
    // Validate Date of Birth is not in the future
    const dob = document.getElementById('dateOfBirth').value;
    if (dob && new Date(dob) > new Date()) {
        showToast('Date of Birth cannot be in the future.', 'warning');
        document.getElementById('dateOfBirth').focus();
        return;
    }
    if (missing.length > 0) {
        showToast('Please fill in all required fields.', 'warning');
        return;
    }
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    try {
        guestInfo = {
            first_name: document.getElementById('firstName').value.trim(),
            last_name: document.getElementById('lastName').value.trim(),
            middle_name: document.getElementById('middleName').value.trim(),
            suffix: document.getElementById('suffix').value.trim(),
            date_of_birth: dob,
            email: document.getElementById('email').value.trim(),
            phone_number: phone.startsWith('0') ? '+63' + phone.slice(1) : phone,
            guest_idtype_id: document.getElementById('idType').value,
            id_number: document.getElementById('idNumber').value.trim(),
            id_picture: document.getElementById('idPicture').files[0] || null
        };
        window.bookingGuestInfo = guestInfo; // Keep this for backward compatibility
        showStep(1);
    } catch (err) {
        showToast('Failed to save guest info: ' + (err?.message || ''), 'error');
    }
};

// Step 2 -> Step 3
document.getElementById('toStep3Btn').onclick = function () {
    // Validate dates
    const checkInDate = document.getElementById('checkInDate').value;
    const checkOutDate = document.getElementById('checkOutDate').value;

    if (!checkInDate) {
        showToast('Please select a check-in date.', 'warning');
        return;
    }

    if (!checkOutDate) {
        showToast('Please select a check-out date.', 'warning');
        return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
        showToast('Check-out date must be after check-in date.', 'warning');
        return;
    }

    // Check if any rooms are selected
    if (Object.keys(selectedRooms).length === 0) {
        showToast('Please select at least one room.', 'warning');
        return;
    }

    // Calculate total amount
    totalAmount = 0;
    Object.entries(selectedRooms).forEach(([roomTypeId, quantity]) => {
        const roomType = roomTypes.find(r => r.room_type_id == roomTypeId);
        if (roomType) {
            totalAmount += roomType.price_per_stay * quantity;
        }
    });

    // Validate companion inputs if any are added - SIMPLIFIED VALIDATION
    let hasInvalidCompanions = false;
    Object.entries(roomCompanions).forEach(([roomTypeId, room]) => {
        if (room && room.numCompanions > 0 && room.companions) {
            // Only check existing companions with actual input fields
            const companionInputs = document.querySelectorAll(`input[data-room-type-id="${roomTypeId}"][data-companion-index]`);
            companionInputs.forEach(input => {
                if (input.style.display !== 'none' && input.value.trim() === '') {
                    hasInvalidCompanions = true;
                }
            });
        }
    });

    if (hasInvalidCompanions) {
        showToast('Please fill in all visible companion name fields.', 'warning');
        return;
    }

    // Fill summary for step 3
    const summaryRoomTypes = document.getElementById('summaryRoomTypes');
    const summaryDates = document.getElementById('summaryDates');
    const summaryPrice = document.getElementById('summaryPrice');
    const summaryDownPayment = document.getElementById('summaryDownPayment');
    const amountToPay = document.getElementById('amountToPay');

    if (summaryRoomTypes) {
        let roomsHtml = '<div class="mb-3">';

        // Loop through each room type
        Object.entries(selectedRooms).forEach(([roomTypeId, quantity]) => {
            const roomType = roomTypes.find(r => r.room_type_id == roomTypeId);
            if (!roomType) return;

            // Add room type header
            roomsHtml += `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <strong>${roomType.type_name}</strong> × ${quantity}
                        <span class="badge bg-secondary ms-1">₱${Number(roomType.price_per_stay).toLocaleString()}/room</span>
                    </div>
                    <div class="text-end">
                        <span class="text-primary">₱${(roomType.price_per_stay * quantity).toLocaleString()}/stay</span>
                    </div>
                </div>`;

            // Loop through each individual room of this type
            for (let i = 0; i < quantity; i++) {
                const roomIndexKey = `${roomTypeId}-${i}`;
                const roomCompanion = roomCompanions[roomIndexKey];
                const isFirstRoom = (Object.keys(selectedRooms).indexOf(roomTypeId) === 0) && (i === 0);

                // Individual room card in summary
                roomsHtml += `<div class="ms-3 mb-2 border-start border-2 ps-2">`;
                roomsHtml += `<div class="small"><strong>Room #${i + 1}</strong></div>`;

                // Show main guest for first room
                if (isFirstRoom) {
                    // Check if guestInfo is available
                    const guestName = guestInfo && guestInfo.first_name ?
                        `${guestInfo.first_name} ${guestInfo.last_name}` :
                        '(Main Guest)';

                    roomsHtml += `<div class="small text-success"><i class="fas fa-user"></i> <strong>Main Guest:</strong> ${guestName}</div>`;
                }

                // Show companions if any
                if (roomCompanion && roomCompanion.numCompanions > 0) {
                    roomsHtml += `<div class="small">`;
                    roomsHtml += `<i class="fas fa-users"></i> <strong>Companions (${roomCompanion.numCompanions}):</strong> `;
                    const companionNames = roomCompanion.companions.map(c => c.full_name.trim()).filter(name => name);
                    if (companionNames.length > 0) {
                        roomsHtml += `<span>${companionNames.join(', ')}</span>`;
                    } else {
                        roomsHtml += `<span class="text-muted">(None specified)</span>`;
                    }
                    roomsHtml += `</div>`;
                }

                roomsHtml += `</div>`;
            }
        });

        roomsHtml += '</div>';
        summaryRoomTypes.innerHTML = roomsHtml;
    }

    if (summaryDates) {
        summaryDates.textContent = `Check-in: ${checkInDate} | Check-out: ${checkOutDate}`;
    }

    if (summaryPrice) {
        summaryPrice.textContent = `Total Price: ₱${totalAmount.toLocaleString()}`;
    }

    const downPaymentAmount = totalAmount * 0.5;
    if (summaryDownPayment) {
        summaryDownPayment.textContent = `Down Payment (50%): ₱${downPaymentAmount.toLocaleString()}`;
    }

    if (amountToPay) {
        amountToPay.value = downPaymentAmount.toLocaleString();
    }

    showStep(2);
};

// --- Payment Category & Method Hero Logic ---
let paymentCategories = [];
let paymentSubMethods = [];
let selectedPaymentCategory = '';
let selectedPaymentMethod = '';
let selectedPaymentMethodId = '';
let selectedPaymentInstructions = '';
// Add global variable for reference number
let selectedPaymentReferenceNumber = '';

async function loadPaymentCategoriesAndMethods() {
    try {
        // Load categories
        const catRes = await axios.get('/Hotel-Reservation-Billing-System/api/admin/payments/sub-method-category.php', {
            params: { operation: 'getAllCategories' }
        });
        paymentCategories = Array.isArray(catRes.data) ? catRes.data : [];

        // Load sub-methods
        const subRes = await axios.get('/Hotel-Reservation-Billing-System/api/admin/payments/sub-method.php', {
            params: { operation: 'getAllSubMethods' }
        });
        paymentSubMethods = Array.isArray(subRes.data) ? subRes.data : [];

        // Populate payment category select (no cash)
        const select = document.getElementById('paymentMethod');
        if (!select) return;

        select.innerHTML = '<option value="">Select Payment Category</option>' +
            paymentCategories
                .filter(cat => String(cat.name).toLowerCase() !== 'cash')
                .map(cat => `<option value="${cat.payment_category_id}">${cat.name}</option>`)
                .join('');
        select.disabled = false;
    } catch (e) {
        console.error('Payment methods error:', e);
        const select = document.getElementById('paymentMethod');
        if (select) {
            select.innerHTML = '<option value="">Payment methods unavailable</option>';
            select.disabled = true;
        }
        showToast('Failed to load payment methods.', 'error');
    }
}
loadPaymentCategoriesAndMethods();

// Helper: Payment instructions per method
function getPaymentInstructions(method) {
    const name = (method.name || '').toLowerCase();

    if (name.includes('gcash')) {
        return {
            title: 'GCash Payment Instructions',
            instructions: `
                <div class="payment-instructions">
                    <div class="row align-items-center">
                        <div class="col-lg-5 text-center mb-4 mb-lg-0">
                            <div class="qr-code-container bg-white p-4 rounded" style="display: inline-block; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                                <img src="../../assets/images/payment/gcash-logo.png" alt="GCash QR Code" class="img-fluid payment-qr">
                            </div>
                            <div class="mt-3">
                                <small class="text-white">Scan with GCash app</small>
                            </div>
                        </div>
                        <div class="col-lg-7">
                            <div class="payment-steps">
                                <p class="fw-bold">Please follow these steps:</p>
                                <ol class="ps-3">
                                    <li>Open your GCash app</li>
                                    <li>Scan this QR code or send payment to <span class="fw-bold">09551280440</span></li>
                                    <li>Enter amount: ₱<span class="fw-bold amount-to-pay"></span></li>
                                    <li>Complete the payment in your GCash app</li>
                                    <li>Enter the reference number in the field below</li>
                                    <li>Upload a screenshot of your payment</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            hasRefNumField: false
        };
    }

    if (name.includes('paymaya')) {
        return {
            title: 'PayMaya Payment Instructions',
            instructions: `
                <div class="payment-instructions">
                    <div class="row align-items-center">
                        <div class="col-lg-5 text-center mb-4 mb-lg-0">
                            <div class="qr-code-container bg-white p-4 rounded" style="display: inline-block; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);">
                                <img src="../../assets/images/payment/maya-logo.png" alt="PayMaya QR Code" class="img-fluid payment-qr">
                            </div>
                            <div class="mt-3">
                                <small class="text-white">Scan with PayMaya app</small>
                            </div>
                        </div>
                        <div class="col-lg-7">
                            <div class="payment-steps">
                                <p class="fw-bold">Please follow these steps:</p>
                                <ol class="ps-3">
                                    <li>Open your PayMaya app</li>
                                    <li>Scan this QR code or send payment to <span class="fw-bold">09551280440</span></li>
                                    <li>Enter amount: ₱<span class="fw-bold amount-to-pay"></span></li>
                                    <li>Complete the payment in your PayMaya app</li>
                                    <li>Enter the reference number in the field below</li>
                                    <li>Upload a screenshot of your payment</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            hasRefNumField: false
        };
    }

    if (name.includes('bpi')) {
        return {
            title: 'BPI Bank Transfer Instructions',
            instructions: `
                <div class="payment-instructions">
                    <div class="row">
                        <div class="col-12">
                            <div class="bank-details p-4 mb-3">
                                <p class="fw-bold mb-3">Bank Details:</p>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Account Name:</span>
                                    <span class="fw-bold">HellHotel Corporation</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Account Number:</span>
                                    <span class="fw-bold">1234-5678-90</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Branch:</span>
                                    <span class="fw-bold">Makati Branch</span>
                                </div>
                            </div>
                            <div class="payment-steps">
                                <p class="fw-bold">Please follow these steps:</p>
                                <ol class="ps-3">
                                    <li>Log in to your BPI online banking</li>
                                    <li>Select "Transfer to Another BPI Account"</li>
                                    <li>Enter the account details above</li>
                                    <li>Enter amount: ₱<span class="fw-bold amount-to-pay"></span></li>
                                    <li>Complete the transfer</li>
                                    <li>Enter the reference number in the field below</li>
                                    <li>Upload a screenshot of your payment receipt</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            hasRefNumField: false
        };
    }

    if (name.includes('bdo')) {
        return {
            title: 'BDO Bank Transfer Instructions',
            instructions: `
                <div class="payment-instructions">
                    <div class="row">
                        <div class="col-12">
                            <div class="bank-details p-4 mb-3">
                                <p class="fw-bold mb-3">Bank Details:</p>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Account Name:</span>
                                    <span class="fw-bold">HellHotel Corporation</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Account Number:</span>
                                    <span class="fw-bold">9876-5432-10</span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Branch:</span>
                                    <span class="fw-bold">Ortigas Branch</span>
                                </div>
                            </div>
                            <div class="payment-steps">
                                <p class="fw-bold">Please follow these steps:</p>
                                <ol class="ps-3">
                                    <li>Log in to your BDO online banking</li>
                                    <li>Select "Transfer to Another BDO Account"</li>
                                    <li>Enter the account details above</li>
                                    <li>Enter amount: ₱<span class="fw-bold amount-to-pay"></span></li>
                                    <li>Complete the transfer</li>
                                    <li>Enter the reference number in the field below</li>
                                    <li>Upload a screenshot of your payment receipt</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            hasRefNumField: false
        };
    }

    if (name.includes('visa') || name.includes('mastercard') || name.includes('credit card')) {
        return {
            title: 'Credit Card Payment',
            instructions: `
                <div class="payment-instructions">
                    <div class="row">
                        <div class="col-12">
                            <div class="credit-card-form p-4">
                                <div class="row mb-3">
                                    <div class="col-12">
                                        <label for="cardNumber" class="form-label required">Card Number</label>
                                        <input type="text" class="form-control" id="cardNumber" placeholder="XXXX XXXX XXXX XXXX" required>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6 mb-3 mb-md-0">
                                        <label for="expiryDate" class="form-label required">Expiry Date</label>
                                        <input type="text" class="form-control" id="expiryDate" placeholder="MM/YY" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="cvv" class="form-label required">CVV</label>
                                        <input type="text" class="form-control" id="cvv" placeholder="XXX" required>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-12">
                                        <label for="cardholderName" class="form-label required">Cardholder Name</label>
                                        <input type="text" class="form-control" id="cardholderName" placeholder="Name on card" required>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3 small text-white opacity-75">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-lock me-2 text-success"></i>
                                    <span>Your payment information is secure and encrypted</span>
                                </div>
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-shield-alt me-2 text-success"></i>
                                    <span>We don't store your complete card details</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            hasRefNumField: false
        };
    }

    return {
        title: 'Payment Instructions',
        instructions: `
            <div class="payment-instructions">
                <div class="row">
                    <div class="col-12">
                        <div class="text-center p-4">
                            <div class="mb-3">
                                <i class="fas fa-info-circle fa-2x text-warning"></i>
                            </div>
                            <h5 class="mb-3 text-white">Payment Method Instructions</h5>
                            <p>Please contact our customer service for assistance with your payment method.</p>
                            <p class="mb-0"><strong>Customer Service:</strong> +63 912 345 6789</p>
                        </div>
                    </div>
                </div>
            </div>
        `,
        hasRefNumField: false
    };
}

// Show payment sub-methods as a hero section inside the form
function showPaymentSubMethodsHero(categoryId) {
    let hero = document.getElementById('paymentSubMethodsHero');
    if (!hero) {
        hero = document.createElement('div');
        hero.id = 'paymentSubMethodsHero';
        hero.className = 'mt-3';
        // Insert after paymentMethod select
        const select = document.getElementById('paymentMethod');
        if (select && select.parentNode) {
            select.parentNode.appendChild(hero);
        }
    }

    // Populate sub-methods for this category
    const methods = paymentSubMethods.filter(m => String(m.payment_category_id) === String(categoryId) && !m.is_deleted);
    if (!methods.length) {
        hero.innerHTML = `<div class="alert alert-warning">No payment methods available for this category.</div>`;
        selectedPaymentMethod = '';
        selectedPaymentMethodId = '';
        selectedPaymentInstructions = '';
        return;
    }

    hero.innerHTML = `
        <div class="payment-methods-container">
            <div class="mb-3"><strong>Select Payment Method:</strong></div>
            <div class="d-flex flex-wrap gap-2 mb-3 payment-method-buttons">
                ${methods.map(m =>
        `<button type="button" class="btn payment-sub-method-btn" 
                        data-method-id="${m.sub_method_id}" 
                        data-method-name="${m.name}">${m.name}</button>`
    ).join('')}
            </div>
            <div id="paymentInstructionsBox" class="mt-4 payment-instructions-container" style="display:none;"></div>
        </div>
    `;    // Add click listeners
    hero.querySelectorAll('.payment-sub-method-btn').forEach(btn => {
        btn.onclick = function () {
            const methodId = this.getAttribute('data-method-id');
            const methodName = this.getAttribute('data-method-name');
            const method = methods.find(m => String(m.sub_method_id) === String(methodId));

            if (!method) return;

            // Get instructions for this method
            const instructionObj = getPaymentInstructions(method);

            // Update selection
            selectedPaymentMethod = methodName;
            selectedPaymentMethodId = methodId;
            selectedPaymentInstructions = instructionObj;

            // Update UI - highlight selected button
            hero.querySelectorAll('.payment-sub-method-btn').forEach(b => {
                b.classList.remove('btn-primary');
            });
            this.classList.add('btn-primary');

            // Show instructions
            const instrBox = hero.querySelector('#paymentInstructionsBox');
            if (instrBox) {
                instrBox.innerHTML = `
                    <div class="payment-instruction-card">
                        <div class="payment-instruction-card-header">
                            <h5 class="mb-0">${instructionObj.title}</h5>
                        </div>
                        <div class="payment-instruction-card-body">
                            ${instructionObj.instructions}
                        </div>
                    </div>
                `;
                instrBox.style.display = 'block';

                // Update amount to pay in all instruction blocks
                const amountToPay = document.getElementById('amountToPay').value;
                instrBox.querySelectorAll('.amount-to-pay').forEach(el => {
                    el.textContent = amountToPay;
                });

                // Handle payment method specific requirements
                const refContainer = document.getElementById('referenceNumberContainer');
                const proofContainer = document.getElementById('proofOfPaymentContainer');

                // Show reference number field for bank/e-wallet payments
                if (methodName.toLowerCase().includes('bank') ||
                    methodName.toLowerCase().includes('gcash') ||
                    methodName.toLowerCase().includes('paymaya') ||
                    methodName.toLowerCase().includes('wallet')) {
                    if (refContainer) refContainer.classList.remove('d-none');
                    if (proofContainer) proofContainer.classList.remove('d-none');
                } else {
                    if (refContainer) refContainer.classList.add('d-none');
                    if (proofContainer) proofContainer.classList.add('d-none');
                }
            }
        };
    });

    // Reset selection
    selectedPaymentMethod = '';
    selectedPaymentMethodId = '';
    selectedPaymentInstructions = '';

    // Hide instructions initially
    const instrBox = hero.querySelector('#paymentInstructionsBox');
    if (instrBox) instrBox.style.display = 'none';

    // Hide reference number and proof of payment containers
    const refContainer = document.getElementById('referenceNumberContainer');
    const proofContainer = document.getElementById('proofOfPaymentContainer');
    if (refContainer) refContainer.classList.add('d-none');
    if (proofContainer) proofContainer.classList.add('d-none');
}

// When payment category is selected, show hero for sub-methods
document.getElementById('paymentMethod')?.addEventListener('change', function (e) {
    const catId = this.value;
    if (!catId) {
        // Remove hero if exists
        const hero = document.getElementById('paymentSubMethodsHero');
        if (hero) hero.innerHTML = '';
        selectedPaymentMethod = '';
        selectedPaymentMethodId = '';
        selectedPaymentInstructions = '';
        return;
    }
    showPaymentSubMethodsHero(catId);
});

// Step 3 Submit (send correct sub_method_id, show instructions)
document.getElementById('paymentForm').onsubmit = async function (e) {
    e.preventDefault();
    // Use selectedPaymentMethodId for sub_method_id
    const paymentMethodId = selectedPaymentMethodId;
    if (!paymentMethodId) {
        showToast('Please select a payment method.', 'warning');
        return;
    }

    // Check for reference number and proof of payment for bank/e-wallet payments
    const refContainer = document.getElementById('referenceNumberContainer');
    const proofContainer = document.getElementById('proofOfPaymentContainer');
    const referenceNumber = document.getElementById('referenceNumber');
    const proofOfPayment = document.getElementById('proofOfPayment');

    const isRefVisible = refContainer && !refContainer.classList.contains('d-none');
    const isProofVisible = proofContainer && !proofContainer.classList.contains('d-none');

    // Validate required fields if they are visible
    if (isRefVisible && (!referenceNumber || !referenceNumber.value.trim())) {
        showToast('Please enter the reference number.', 'warning');
        referenceNumber.focus();
        return;
    }

    if (isProofVisible && (!proofOfPayment || !proofOfPayment.files || proofOfPayment.files.length === 0)) {
        showToast('Please upload proof of payment.', 'warning');
        return;
    }

    // Get booking details
    const checkInDate = document.getElementById('checkInDate').value;
    const checkOutDate = document.getElementById('checkOutDate').value;

    // Confirm booking
    const confirm = await Swal.fire({
        icon: 'question',
        title: 'Confirm Booking?',
        text: 'Are you sure you want to confirm this booking? You will pay 50% downpayment.',
        showCancelButton: true,
        confirmButtonText: 'Yes, Book Now',
        cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;

    // Show loading indicator
    Swal.fire({
        title: 'Processing...',
        text: 'Please wait while we process your booking.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });


    // 1. Save guest info (upload id_picture if present)
    let guestId = null;
    try {
        const guestData = window.bookingGuestInfo;
        const formData = new FormData();
        if (guestData.id_picture) {
            formData.append('id_picture', guestData.id_picture);
            delete guestData.id_picture;
        }
        formData.append('operation', 'insertGuest');
        formData.append('json', JSON.stringify(guestData));
        const res = await axios.post('/Hotel-Reservation-Billing-System/api/admin/guests/guests.php', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        guestId = res.data && res.data.guest_id ? res.data.guest_id : null;
        if (!guestId) {
            throw new Error('Failed to get guest ID from response');
        }
    } catch (err) {
        Swal.fire('Error', 'Failed to save guest info', 'error');
        return;
    }

    // 2. Create reservation with on-hold payment info (for online bookings)
    let reservationId = null;
    try {
        // Prepare rooms array for the reservation
        const roomsArray = [];
        let firstRoomTypeId = null;
        Object.entries(selectedRooms).forEach(([roomTypeId, quantity], idx) => {
            if (idx === 0) firstRoomTypeId = roomTypeId;
            for (let i = 0; i < quantity; i++) {
                roomsArray.push({
                    room_type_id: roomTypeId,
                    room_id: null
                });
            }
        });

        // Prepare payment data (create actual payment record instead of JSON)
        const paymentMethodId = selectedPaymentMethodId;
        const referenceNumber = document.getElementById('referenceNumber')?.value || '';
        const proofOfPayment = document.getElementById('proofOfPayment');
        let proofOfPaymentFile = null;
        if (proofOfPayment && proofOfPayment.files.length > 0) {
            proofOfPaymentFile = proofOfPayment.files[0];
        }

        const reservationData = {
            guest_id: guestId,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            reservation_type: 'online',
            requested_room_type_id: firstRoomTypeId,
            rooms: roomsArray,
            // Remove on_hold_payment_info - we'll create payment record separately
        };

        // Collect companions data to send with reservation
        const companionsData = [];
        Object.entries(selectedRooms).forEach(([roomTypeId, quantity]) => {
            for (let i = 0; i < quantity; i++) {
                const roomCompanionKey = `${roomTypeId}-${i}`;
                const roomCompanion = roomCompanions[roomCompanionKey];
                if (roomCompanion && roomCompanion.numCompanions > 0) {
                    roomCompanion.companions.forEach((companion) => {
                        if (companion && companion.full_name && companion.full_name.trim()) {
                            companionsData.push({
                                room_type_id: roomTypeId,
                                room_index: i,
                                full_name: companion.full_name.trim()
                            });
                        }
                    });
                }
            }
        });

        const formData = new FormData();
        formData.append('operation', 'insertReservation');
        formData.append('json', JSON.stringify(reservationData));

        // Add companions data
        if (companionsData.length > 0) {
            formData.append('companions', JSON.stringify(companionsData));
        }

        const res = await axios.post('/Hotel-Reservation-Billing-System/api/admin/reservations/reservations.php', formData);
        console.log('Backend response:', res.data);
        reservationId = res.data && res.data.reservation_id ? res.data.reservation_id : null;
        if (!reservationId) {
            console.error('No reservation_id in response. Full response:', res.data);
            throw new Error('Failed to get reservation ID from response');
        }

        // Create payment record directly in Payment table (on hold status)
        try {
            const paymentData = {
                reservation_id: reservationId,
                billing_id: res.data.billing_id || null, // Use billing_id from reservation response
                sub_method_id: paymentMethodId,
                amount_paid: totalAmount * 0.5, // 50% down payment
                payment_date: new Date().toISOString().split('T')[0], // Today's date
                reference_number: referenceNumber,
                notes: 'Online booking - On hold pending confirmation',
                status: 'on_hold' // New status for pending payments
            };

            const paymentFormData = new FormData();
            paymentFormData.append('operation', 'insertOnHoldPayment');
            paymentFormData.append('json', JSON.stringify(paymentData));

            // Upload proof of payment if provided
            if (proofOfPaymentFile) {
                paymentFormData.append('proof_of_payment', proofOfPaymentFile);
            }

            await axios.post('/Hotel-Reservation-Billing-System/api/admin/payments/payments.php', paymentFormData);
            console.log('Payment record created successfully with billing_id:', res.data.billing_id);
        } catch (paymentError) {
            console.error('Failed to create payment record:', paymentError);
            // Continue with booking even if payment fails
        }
    } catch (err) {
        console.error('Reservation creation error:', err);
        Swal.fire('Error', 'Failed to create reservation', 'error');
        return;
    }

    // Success - Online bookings don't need billing records until confirmed
    forms.forEach(f => f.classList.add('d-none'));

    // Create a more professional success message with booking details
    Swal.fire({
        icon: 'success',
        title: 'Your Booking is Confirmed!',
        html: `
            <div class="booking-confirmation">
                <p><i class="fas fa-check-circle text-success me-2"></i>Thank you for booking with HellHotel.</p>
                <div class="confirmation-details mt-3">
                    <p><strong>Reservation ID:</strong> ${reservationId}</p>
                    <p><strong>Check-in Date:</strong> ${formatDate(checkInDate)}</p>
                    <p><strong>Check-out Date:</strong> ${formatDate(checkOutDate)}</p>
                    <p><strong>Amount Paid:</strong> ₱${(totalAmount * 0.5).toFixed(2)} (50% Downpayment)</p>
                    <p><strong>Payment Method:</strong> ${selectedPaymentMethod}</p>
                </div>
                <div class="alert alert-info mt-3">
                    <i class="fas fa-envelope me-2"></i>
                    <strong>Please check your email</strong> for booking confirmation details, receipt, and important information about your stay.
                </div>
                <p class="small text-muted mt-3">Please keep your reservation ID for reference and bring a valid ID during check-in.</p>
            </div>
        `,
        confirmButtonText: 'Done',
        allowOutsideClick: false
    });

    // Show booking success message with fade-in
    const successMsg = document.getElementById('bookingSuccess');
    if (successMsg) successMsg.classList.add('active');
};
