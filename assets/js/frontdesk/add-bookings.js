// ==========================
// === POS BOOKING SYSTEM ===
// ==========================

// === GLOBALS & CONSTANTS ===
const BASE_URL = "/Hotel-Reservation-Billing-System/api/admin";
let currentStep = 0;
let cachedRoomTypes = [];
let cachedRooms = [];
let cachedGuests = [];
let cachedIDTypes = [];
let cachedPaymentCategories = [];
let cachedPaymentMethods = [];

// Booking data
let guestData = {};
let multipleBookings = [];
let selectedPaymentCategory = '';
let selectedPaymentMethod = '';
let selectedPaymentMethodId = '';

// === INITIALIZATION ===
document.addEventListener("DOMContentLoaded", () => {
    // Initialize the POS system
    initializePOSSystem();

    // Load initial data
    loadInitialData();

    // Setup event listeners
    setupEventListeners();

    // Set minimum dates
    setMinimumDates();
});

// === INITIALIZATION FUNCTIONS ===
async function initializePOSSystem() {
    showStep(0); // Start with guest info step
    updateBookingSummary();
}

async function loadInitialData() {
    try {
        await Promise.all([
            loadRoomTypes(),
            loadGuests(),
            loadIDTypes(),
            loadPaymentCategoriesAndMethods()
        ]);
        console.log("Initial data loaded successfully");
    } catch (error) {
        console.error("Error loading initial data:", error);
        showError("Failed to load system data. Please refresh the page.");
    }
}

function setupEventListeners() {
    // Step navigation buttons
    const toStep2Btn = document.getElementById("toStep2Btn");
    const toStep3Btn = document.getElementById("toStep3Btn");
    const backToStep1Btn = document.getElementById("backToStep1Btn");
    const backToStep2Btn = document.getElementById("backToStep2Btn");
    const finalizeBookingBtn = document.getElementById("finalizeBookingBtn");

    if (toStep2Btn) toStep2Btn.addEventListener("click", validateAndGoToStep2);
    if (toStep3Btn) toStep3Btn.addEventListener("click", validateAndGoToStep3);
    if (backToStep1Btn) backToStep1Btn.addEventListener("click", () => showStep(0));
    if (backToStep2Btn) backToStep2Btn.addEventListener("click", () => showStep(1));
    if (finalizeBookingBtn) finalizeBookingBtn.addEventListener("click", finalizeBooking);

    // Guest search
    const guestSearchInput = document.getElementById("guestSearchInput");
    if (guestSearchInput) {
        guestSearchInput.addEventListener("input", handleGuestSearch);
        guestSearchInput.addEventListener("focus", () => {
            if (guestSearchInput.value.length > 0) {
                handleGuestSearch();
            }
        });
    }

    // Date change handlers
    const checkInDate = document.getElementById("checkInDate");
    const checkOutDate = document.getElementById("checkOutDate");

    if (checkInDate) checkInDate.addEventListener("change", handleDateChange);
    // Removed manual change event for checkOutDate since it's now automatic and disabled

    // Multiple booking support
    const addBookingBtn = document.getElementById("addBookingBtn");
    if (addBookingBtn) addBookingBtn.addEventListener("click", addNewBooking);

    // Form field listeners for guest info
    setupGuestFormListeners();
}

function setupGuestFormListeners() {
    const guestFields = ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth', 'idType', 'idNumber'];
    guestFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', updateGuestData);
            field.addEventListener('change', updateGuestData);
        }
    });
}

function setMinimumDates() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];

    const checkInDate = document.getElementById("checkInDate");
    const checkOutDate = document.getElementById("checkOutDate");

    if (checkInDate) {
        checkInDate.min = today;
        checkInDate.value = today;
    }
    if (checkOutDate) {
        checkOutDate.min = tomorrowString;
        checkOutDate.value = tomorrowString;
        checkOutDate.disabled = true;
    }
}

// === STEP NAVIGATION ===
function showStep(step) {
    currentStep = step;

    // Hide all step contents
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });

    // Show current step content
    const currentStepContent = document.getElementById(`step-${step + 1}-content`);
    if (currentStepContent) {
        currentStepContent.classList.add('active');
    }

    // Update stepper
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index === step) {
            stepEl.classList.add('active');
        } else if (index < step) {
            stepEl.classList.add('completed');
        }
    });

    updateBookingSummary();
}

async function validateAndGoToStep2() {
    if (!validateGuestInfo()) return;

    // Save guest data
    updateGuestData();

    // Load room types for step 2
    await displayRoomTypes();

    // Initialize with one booking item
    if (multipleBookings.length === 0) {
        addNewBooking();
    }

    showStep(1);
}

async function validateAndGoToStep3() {
    if (!validateRoomSelection()) return;

    // Load payment methods for step 3
    await displayPaymentCategories();

    showStep(2);
}

// === GUEST MANAGEMENT ===
function updateGuestData() {
    guestData = {
        firstName: document.getElementById("firstName")?.value || '',
        lastName: document.getElementById("lastName")?.value || '',
        email: document.getElementById("email")?.value || '',
        phoneNumber: document.getElementById("phoneNumber")?.value || '',
        dateOfBirth: document.getElementById("dateOfBirth")?.value || '',
        idType: document.getElementById("idType")?.value || '',
        idNumber: document.getElementById("idNumber")?.value || '',
        idPicture: document.getElementById("idPicture")?.files[0] || null
    };
}

function validateGuestInfo() {
    updateGuestData();

    const requiredFields = {
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        phoneNumber: "Phone Number",
        dateOfBirth: "Date of Birth",
        idType: "ID Type",
        idNumber: "ID Number"
    };

    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
        if (!guestData[field]) {
            missingFields.push(label);
        }
    }

    if (missingFields.length > 0) {
        showError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestData.email)) {
        showError("Please enter a valid email address");
        return false;
    }

    // Validate phone number (Philippine format)
    const phoneRegex = /^(\+63|0)9\d{9}$/;
    if (!phoneRegex.test(guestData.phoneNumber)) {
        showError("Please enter a valid Philippine phone number (e.g., 09123456789)");
        return false;
    }

    // Validate date of birth
    const dobDate = new Date(guestData.dateOfBirth);
    const today = new Date();
    if (dobDate >= today) {
        showError("Date of birth cannot be today or in the future");
        return false;
    }

    return true;
}

async function loadGuests() {
    try {
        const response = await axios.get(`${BASE_URL}/guests/guests.php`);
        if (Array.isArray(response.data)) {
            cachedGuests = response.data;
        } else if (response.data.guests) {
            cachedGuests = response.data.guests;
        } else {
            cachedGuests = [];
        }
        console.log("Loaded guests:", cachedGuests.length);
    } catch (error) {
        console.error("Error loading guests:", error);
        cachedGuests = [];
    }
}

async function loadIDTypes() {
    try {
        const response = await axios.get(`${BASE_URL}/guests/id_types.php`);
        if (Array.isArray(response.data)) {
            cachedIDTypes = response.data;
        } else if (response.data.id_types) {
            cachedIDTypes = response.data.id_types;
        } else {
            cachedIDTypes = [];
        }
        populateIDTypeSelect();
    } catch (error) {
        console.error("Error loading ID types:", error);
        cachedIDTypes = [];
        populateIDTypeSelect();
    }
}

function populateIDTypeSelect() {
    const idTypeSelect = document.getElementById("idType");
    if (!idTypeSelect) return;

    idTypeSelect.innerHTML = '<option value="">Select ID Type</option>';
    // Sort alphabetically by id_type
    const sortedTypes = [...cachedIDTypes].sort((a, b) => a.id_type.localeCompare(b.id_type));
    sortedTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type.guest_idtype_id;
        option.textContent = type.id_type;
        idTypeSelect.appendChild(option);
    });
}

function handleGuestSearch() {
    const searchInput = document.getElementById("guestSearchInput");
    const dropdown = document.getElementById("guestSearchDropdown");

    if (!searchInput || !dropdown) return;

    const query = searchInput.value.toLowerCase().trim();

    if (query.length < 2) {
        dropdown.style.display = "none";
        return;
    }

    const filteredGuests = cachedGuests.filter(guest =>
        guest.first_name.toLowerCase().includes(query) ||
        guest.last_name.toLowerCase().includes(query) ||
        guest.email.toLowerCase().includes(query) ||
        guest.phone_number.includes(query)
    );

    if (filteredGuests.length === 0) {
        dropdown.style.display = "none";
        return;
    }

    dropdown.innerHTML = filteredGuests.map(guest => `
        <div class="guest-search-item" onclick="selectGuest(${guest.guest_id})">
            <strong>${guest.first_name} ${guest.last_name}</strong><br>
            <small>${guest.email} • ${guest.phone_number}</small>
        </div>
    `).join('');

    dropdown.style.display = "block";
}

function selectGuest(guestId) {
    const guest = cachedGuests.find(g => g.guest_id == guestId);
    if (!guest) return;

    // Fill form with guest data
    document.getElementById("firstName").value = guest.first_name || '';
    document.getElementById("lastName").value = guest.last_name || '';
    document.getElementById("email").value = guest.email || '';
    document.getElementById("phoneNumber").value = guest.phone_number || '';
    document.getElementById("dateOfBirth").value = guest.date_of_birth || '';
    document.getElementById("idType").value = guest.guest_idtype_id || '';
    document.getElementById("idNumber").value = guest.id_number || '';
    // If guest has id_picture, show it (no upload)
    const idPicPreview = document.getElementById("idPicPreview");
    if (idPicPreview) {
        if (guest.id_picture) {
            idPicPreview.src = guest.id_picture;
            idPicPreview.style.display = "block";
        } else {
            idPicPreview.style.display = "none";
        }
    }

    // Update guest data
    updateGuestData();
    guestData.existingGuestId = guestId;

    // Hide dropdown
    const dropdown = document.getElementById("guestSearchDropdown");
    if (dropdown) dropdown.style.display = "none";

    // Clear search input
    const searchInput = document.getElementById("guestSearchInput");
    if (searchInput) searchInput.value = '';

    showSuccess("Guest information loaded successfully");
}

// === ROOM MANAGEMENT ===
async function loadRoomTypes() {
    try {
        const response = await axios.get(`${BASE_URL}/rooms/room-type.php`);
        if (Array.isArray(response.data)) {
            cachedRoomTypes = response.data;
        } else if (response.data.room_types) {
            cachedRoomTypes = response.data.room_types;
        } else {
            cachedRoomTypes = [];
        }
    } catch (error) {
        console.error("Error loading room types:", error);
        cachedRoomTypes = [];
        showError("Failed to load room types");
    }
}

async function displayRoomTypes() {
    const container = document.getElementById("roomTypesGrid");
    if (!container) return;

    if (cachedRoomTypes.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-muted text-center">No room types available</p></div>';
        return;
    }

    container.innerHTML = cachedRoomTypes.map(roomType => {
        // Only use the actual image_url from database, no fallback
        let imageUrl = '';
        if (typeof roomType.image_url === 'string' && roomType.image_url.trim() !== '') {
            imageUrl = `/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/${roomType.image_url}`;
        } else {
            imageUrl = '/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/placeholder-room.jpg';
        }

        // Use price_per_stay from database (the actual column name)
        const price = parseFloat(roomType.price_per_stay) || parseFloat(roomType.price_per_night) || 0;

        return `
            <div class="col-md-4 col-sm-6 mb-3">
                <div class="room-type-card" data-room-type-id="${roomType.room_type_id}" onclick="selectRoomType(${roomType.room_type_id})">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${roomType.type_name}" class="room-type-image mb-2" style="width:100%;height:120px;object-fit:cover;border-radius:8px;">` : ''}
                    <h6 class="mb-2">${roomType.type_name}</h6>
                    <p class="mb-2"><i class="fas fa-users"></i> Up to ${roomType.max_capacity} guests</p>
                    <p class="mb-0"><strong>₱${price.toLocaleString()}/night</strong></p>
                </div>
            </div>
        `;
    }).join('');
}

async function selectRoomType(roomTypeId) {
    // Update visual selection
    document.querySelectorAll('.room-type-card').forEach(card => {
        card.classList.remove('selected');
    });

    const selectedCard = document.querySelector(`[data-room-type-id="${roomTypeId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    // Get current active booking
    const activeBooking = getCurrentActiveBooking();
    if (activeBooking) {
        activeBooking.roomTypeId = roomTypeId;
        activeBooking.roomType = cachedRoomTypes.find(rt => rt.room_type_id == roomTypeId);
    }

    // Load available rooms for selected dates and type
    await loadAvailableRooms(roomTypeId);
    updateBookingSummary();
}

async function loadAvailableRooms(roomTypeId) {
    const checkInDate = document.getElementById("checkInDate")?.value;
    const checkOutDate = document.getElementById("checkOutDate")?.value;

    if (!checkInDate || !checkOutDate) {
        showError("Please select check-in and check-out dates first");
        return;
    }

    try {
        const params = {
            operation: "getAvailableRooms",
            room_type_id: roomTypeId,
            check_in_date: checkInDate,
            check_out_date: checkOutDate
        };

        const response = await axios.get(`${BASE_URL}/rooms/rooms.php`, { params });

        let rooms = [];
        if (Array.isArray(response.data)) {
            rooms = response.data;
        } else if (response.data && response.data.rooms) {
            rooms = response.data.rooms;
        }

        displayAvailableRooms(rooms);
    } catch (error) {
        console.error("Error loading available rooms:", error);
        displayAvailableRooms([]);
        showError("Failed to load available rooms");
    }
}

function displayAvailableRooms(rooms) {
    const container = document.getElementById("roomNumbersGrid");
    const section = document.getElementById("availableRoomsSection");

    if (!container || !section) return;

    if (rooms.length === 0) {
        container.innerHTML = '<p class="text-muted">No available rooms for selected dates</p>';
        section.style.display = "block";
        return;
    }

    container.innerHTML = rooms.map(room => `
        <button type="button" class="btn btn-outline-secondary room-number-btn" 
                data-room-id="${room.room_id}" 
                onclick="selectRoom(${room.room_id})">
            Room ${room.room_number}
        </button>
    `).join('');

    section.style.display = "block";
}

function selectRoom(roomId) {
    // Update visual selection
    document.querySelectorAll('.room-number-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    const selectedBtn = document.querySelector(`[data-room-id="${roomId}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }

    // Get current active booking
    const activeBooking = getCurrentActiveBooking();
    if (activeBooking) {
        activeBooking.roomId = roomId;
        activeBooking.roomNumber = selectedBtn.textContent.trim();
    }

    // Show companions section
    displayCompanionsSection();
    updateBookingSummary();
}

function displayCompanionsSection() {
    const section = document.getElementById("companionsSection");
    const container = document.getElementById("companionsContainer");
    if (!section || !container) return;

    const activeBooking = getCurrentActiveBooking();
    if (!activeBooking || !activeBooking.roomType) return;

    let maxGuests = activeBooking.roomType.max_capacity || activeBooking.roomType.max_guests || 1;
    const bookingIndex = multipleBookings.findIndex(b => b.id === activeBooking.id);
    let maxCompanions = bookingIndex === 0 ? Math.max(0, maxGuests - 1) : maxGuests;

    if (maxCompanions === 0) {
        section.style.display = "none";
        return;
    }

    container.innerHTML = `
        <div class="companion-card">
            <h6 class="mb-3">Room Companions (Optional)</h6>
            <div class="mb-3">
                <label class="form-label">Number of Companions (Max: ${maxCompanions})</label>
                <select class="form-select" id="companionCount" onchange="updateCompanionInputs()">
                    ${Array.from({ length: maxCompanions + 1 }, (_, i) =>
        `<option value="${i}">${i} companion${i !== 1 ? 's' : ''}</option>`
    ).join('')}
                </select>
            </div>
            <div id="companionInputs"></div>
            ${bookingIndex === 0 ? `<div class="mt-2 text-info"><i class="fas fa-user me-1"></i>Main guest is assigned to this room.</div>` : ''}
        </div>
    `;
    section.style.display = "block";
}

function updateCompanionInputs() {
    const companionCount = parseInt(document.getElementById("companionCount")?.value || 0);
    const container = document.getElementById("companionInputs");

    if (!container) return;

    if (companionCount === 0) {
        container.innerHTML = '';
        // Update booking data
        const activeBooking = getCurrentActiveBooking();
        if (activeBooking) {
            activeBooking.companionCount = 0;
            activeBooking.companions = [];
        }
        updateBookingSummary();
        return;
    }

    container.innerHTML = Array.from({ length: companionCount }, (_, i) => `
        <div class="companion-input mb-2">
            <input type="text" class="form-control companion-name-input" 
                   placeholder="Companion ${i + 1} Full Name" 
                   id="companion${i + 1}Name"
                   onchange="updateCompanionData()">
        </div>
    `).join('');

    // Update booking data
    const activeBooking = getCurrentActiveBooking();
    if (activeBooking) {
        activeBooking.companionCount = companionCount;
        activeBooking.companions = [];
    }
    updateBookingSummary();
}

function updateCompanionData() {
    const activeBooking = getCurrentActiveBooking();
    if (!activeBooking) return;

    const companionCount = activeBooking.companionCount || 0;
    activeBooking.companions = [];

    for (let i = 1; i <= companionCount; i++) {
        const companionName = document.getElementById(`companion${i}Name`)?.value?.trim();
        if (companionName) {
            activeBooking.companions.push({ full_name: companionName });
        }
    }

    updateBookingSummary();
}

function validateRoomSelection() {
    if (multipleBookings.length === 0) {
        showError("Please add at least one room booking");
        return false;
    }

    let hasValidBooking = false;
    for (const booking of multipleBookings) {
        if (booking.roomTypeId && booking.roomId) {
            hasValidBooking = true;

            // Collect companion names from form inputs
            const companionCount = booking.companionCount || 0;
            booking.companions = [];
            for (let i = 1; i <= companionCount; i++) {
                const companionName = document.getElementById(`companion${i}Name`)?.value?.trim();
                if (companionName) {
                    booking.companions.push({ full_name: companionName });
                }
            }
        }
    }

    if (!hasValidBooking) {
        showError("Please select room type and room number for at least one booking");
        return false;
    }

    const checkInDate = document.getElementById("checkInDate")?.value;
    const checkOutDate = document.getElementById("checkOutDate")?.value;

    if (!checkInDate || !checkOutDate) {
        showError("Please select check-in and check-out dates");
        return false;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
        showError("Check-out date must be after check-in date");
        return false;
    }

    return true;
}

function handleDateChange() {
    const checkInDate = document.getElementById("checkInDate");
    const checkOutDate = document.getElementById("checkOutDate");

    if (!checkInDate || !checkOutDate) return;

    // Automatically set check-out date to 1 day after check-in and disable input
    if (checkInDate.value) {
        const minCheckOut = new Date(checkInDate.value);
        minCheckOut.setDate(minCheckOut.getDate() + 1);
        checkOutDate.value = minCheckOut.toISOString().split('T')[0];
        checkOutDate.disabled = true;
    }

    // Refresh available rooms if room type is selected
    const selectedRoomType = document.querySelector('.room-type-card.selected');
    if (selectedRoomType) {
        const roomTypeId = selectedRoomType.getAttribute('data-room-type-id');
        loadAvailableRooms(roomTypeId);
    }

    updateBookingSummary();
}

// === MULTIPLE BOOKING MANAGEMENT ===
function addNewBooking() {
    const newBooking = {
        id: Date.now(),
        roomTypeId: null,
        roomType: null,
        roomId: null,
        roomNumber: null,
        companionCount: 0,
        companions: []
    };

    multipleBookings.push(newBooking);
    displayMultipleBookings();
    setActiveBooking(newBooking.id);
    updateBookingSummary();
}

function displayMultipleBookings() {
    const container = document.getElementById("bookingItemsContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="row g-3">
            ${multipleBookings.map((booking, index) => {

        const companionNames = booking.companions && booking.companions.length > 0
            ? booking.companions.map(c => c.full_name).filter(name => name).join(', ')
            : 'None';

        return `
                    <div class="col-md-4 mb-3">
                        <div class="booking-item ${booking.active ? 'selected' : ''}" data-booking-id="${booking.id}">
                            <button type="button" class="remove-booking-btn" onclick="removeBooking(${booking.id})" ${multipleBookings.length <= 1 ? 'style=\"display:none\"' : ''}>
                                <i class="fas fa-times"></i>
                            </button>
                            <div onclick="setActiveBooking(${booking.id})" style="cursor: pointer;">
                               Booking #${index + 1}</h6>
                            </div>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

function setActiveBooking(bookingId) {
    multipleBookings.forEach(booking => {
        booking.active = booking.id === bookingId;
    });
    displayMultipleBookings();

    // Update UI to reflect active booking
    const activeBooking = getCurrentActiveBooking();
    if (activeBooking) {
        // Update room type selection
        document.querySelectorAll('.room-type-card').forEach(card => {
            card.classList.remove('selected');
        });

        if (activeBooking.roomTypeId) {
            const selectedCard = document.querySelector(`[data-room-type-id="${activeBooking.roomTypeId}"]`);
            if (selectedCard) {
                selectedCard.classList.add('selected');
                loadAvailableRooms(activeBooking.roomTypeId);
            }
        }
    }
}

function removeBooking(bookingId) {
    if (multipleBookings.length <= 1) {
        showError("You must have at least one booking");
        return;
    }

    multipleBookings = multipleBookings.filter(booking => booking.id !== bookingId);

    // Set first booking as active if removed booking was active
    if (multipleBookings.length > 0 && !multipleBookings.some(b => b.active)) {
        multipleBookings[0].active = true;
    }

    displayMultipleBookings();
    updateBookingSummary();
}

function getCurrentActiveBooking() {
    return multipleBookings.find(booking => booking.active) || multipleBookings[0];
}

// === PAYMENT MANAGEMENT ===
async function loadPaymentCategoriesAndMethods() {
    try {
        const [categoriesResponse, methodsResponse] = await Promise.all([
            axios.get(`${BASE_URL}/payments/sub-method-category.php`),
            axios.get(`${BASE_URL}/payments/sub-method.php`)
        ]);

        if (Array.isArray(categoriesResponse.data)) {
            cachedPaymentCategories = categoriesResponse.data;
        } else if (categoriesResponse.data.categories) {
            cachedPaymentCategories = categoriesResponse.data.categories;
        } else {
            cachedPaymentCategories = [];
        }

        // Only allow Cash and E-wallet (GCash, PayMaya, Maya) for walk-in
        let allMethods = Array.isArray(methodsResponse.data) ? methodsResponse.data : methodsResponse.data.methods || [];
        cachedPaymentMethods = allMethods.filter(m => {
            if (!m.name) return false;
            const name = m.name.toLowerCase();
            return name === 'cash' || name === 'gcash' || name === 'paymaya' || name === 'maya';
        });
    } catch (error) {
        console.error("Error loading payment data:", error);
        cachedPaymentCategories = [];
        cachedPaymentMethods = [];
    }
}

async function displayPaymentCategories() {
    const container = document.getElementById("paymentCategoriesGrid");
    if (!container) return;

    container.innerHTML = cachedPaymentCategories.map(category => `
        <div class="payment-method-btn" data-category-id="${category.payment_category_id}" onclick="selectPaymentCategory(${category.payment_category_id})">
            <i class="fas fa-credit-card"></i><br>
            <span>${category.name}</span>
        </div>
    `).join('');
}

function selectPaymentCategory(categoryId) {
    selectedPaymentCategory = categoryId;

    // Update visual selection
    document.querySelectorAll('#paymentCategoriesGrid .payment-method-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    document.querySelector(`[data-category-id="${categoryId}"]`).classList.add('selected');

    // Show sub-methods
    displayPaymentSubMethods(categoryId);
}

function displayPaymentSubMethods(categoryId) {
    const container = document.getElementById("paymentSubMethodsGrid");
    const subMethodsContainer = document.getElementById("paymentSubMethodsContainer");

    if (!container || !subMethodsContainer) return;

    // Only show allowed methods (Cash, E-wallet) and filter out others
    const subMethods = cachedPaymentMethods.filter(method => {
        if (method.is_deleted || method.payment_category_id != categoryId) return false;
        if (!method.name) return false;
        const name = method.name.toLowerCase();
        return name === 'cash' || name === 'gcash' || name === 'paymaya' || name === 'maya';
    });
    // Remove gray background from referenceNumberContainer and paymentDetailsSection
    if (referenceContainer) {
        referenceContainer.style.background = 'transparent';
        referenceContainer.classList.remove('bg-light', 'bg-secondary', 'bg-gray');
    }
    if (detailsSection) {
        detailsSection.style.background = 'transparent';
        detailsSection.classList.remove('bg-light', 'bg-secondary', 'bg-gray');
    }

    if (subMethods.length === 0) {
        subMethodsContainer.style.display = "none";
        return;
    }

    container.innerHTML = subMethods.map(method => `
        <div class="payment-method-btn" data-method-id="${method.sub_method_id}" onclick="selectPaymentMethod(${method.sub_method_id}, '${method.name}')">
            <span>${method.name}</span>
        </div>
    `).join('');

    subMethodsContainer.style.display = "block";
}

function selectPaymentMethod(methodId, methodName) {
    selectedPaymentMethod = methodName;
    selectedPaymentMethodId = methodId;

    // Update visual selection
    document.querySelectorAll('#paymentSubMethodsGrid .payment-method-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    document.querySelector(`[data-method-id="${methodId}"]`).classList.add('selected');

    // Show payment details section
    showPaymentDetails(methodName);
    updateBookingSummary();
}

function showPaymentDetails(methodName) {
    const detailsSection = document.getElementById("paymentDetailsSection");
    const referenceContainer = document.getElementById("referenceNumberContainer");
    const proofContainer = document.getElementById("proofOfPaymentContainer");
    const instructionsBox = document.getElementById("paymentInstructionsBox");

    if (!detailsSection) return;

    detailsSection.style.display = "block";

    // Show reference number field only for E-wallet, and label as 'Frontdesk Reference Number'
    const needsReference = methodName.toLowerCase().includes('gcash') ||
        methodName.toLowerCase().includes('maya') ||
        methodName.toLowerCase().includes('paymaya');

    if (referenceContainer) {
        referenceContainer.style.display = needsReference ? "block" : "none";
        // Update label for reference number
        const label = referenceContainer.querySelector('label[for="referenceNumber"]');
        if (label) label.textContent = needsReference ? 'Frontdesk Reference Number' : 'Reference Number';
    }

    if (proofContainer) {
        proofContainer.style.display = needsReference ? "block" : "none";
    }

    // Show payment instructions
    if (instructionsBox) {
        const instructions = getPaymentInstructions(methodName);
        instructionsBox.innerHTML = instructions;
        instructionsBox.style.display = "block";
    }
}

function getPaymentInstructions(methodName) {
    const name = methodName.toLowerCase();

    if (name.includes('gcash')) {
        return `
            <div class="alert alert-info">
                <h6><i class="fas fa-mobile-alt me-2"></i>GCash Payment Instructions</h6>
                <ol>
                    <li>Open your GCash app</li>
                    <li>Send payment to: <strong>09123456789 (HellHotel)</strong></li>
                    <li>Enter the reference number after payment</li>
                    <li>Upload screenshot of payment confirmation</li>
                </ol>
            </div>
        `;
    }

    if (name.includes('maya') || name.includes('paymaya')) {
        return `
            <div class="alert alert-info">
                <h6><i class="fas fa-mobile-alt me-2"></i>Maya/PayMaya Payment Instructions</h6>
                <ol>
                    <li>Open your Maya app</li>
                    <li>Send payment to: <strong>09123456789 (HellHotel)</strong></li>
                    <li>Enter the reference number after payment</li>
                    <li>Upload screenshot of payment confirmation</li>
                </ol>
            </div>
        `;
    }

    if (name.includes('bank')) {
        return `
            <div class="alert alert-info">
                <h6><i class="fas fa-university me-2"></i>Bank Transfer Instructions</h6>
                <ol>
                    <li>Transfer to: <strong>HellHotel Account</strong></li>
                    <li>Account Number: <strong>1234-5678-9012</strong></li>
                    <li>Enter the reference number from your receipt</li>
                    <li>Upload photo of transfer receipt</li>
                </ol>
            </div>
        `;
    }

    return `
        <div class="alert alert-warning">
            <h6><i class="fas fa-info-circle me-2"></i>Payment Instructions</h6>
            <p>Please contact our front desk for payment assistance.</p>
            <p><strong>Phone:</strong> +63 912 345 6789</p>
        </div>
    `;
}

// === BOOKING SUMMARY ===
function updateBookingSummary() {
    const container = document.getElementById("bookingSummaryContent");
    if (!container) return;

    if (multipleBookings.length === 0 || !multipleBookings.some(b => b.roomType)) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-shopping-cart fa-3x mb-3"></i>
                <p>No rooms selected yet</p>
            </div>
        `;
        return;
    }

    const checkInDate = document.getElementById("checkInDate")?.value;
    const checkOutDate = document.getElementById("checkOutDate")?.value;

    let totalAmount = 0;
    let nights = 0;

    if (checkInDate && checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    }

    const bookingItems = multipleBookings
        .filter(booking => booking.roomType)
        .map((booking, index) => {
            // Use price_per_stay from database (the actual column name)
            const pricePerNight = parseFloat(booking.roomType.price_per_stay) || parseFloat(booking.roomType.price_per_night) || 0;
            const roomTotal = pricePerNight * nights;
            totalAmount += roomTotal;

            const companionsList = booking.companions && booking.companions.length > 0
                ? booking.companions.map(c => c.full_name).filter(name => name).join(', ')
                : 'None';

            return `
                <div class="summary-item">
                    <div class="d-flex justify-content-between">
                        <div>
                            <strong>Booking #${index + 1} - ${booking.roomType.type_name}</strong><br>
                            <small>${booking.roomNumber || 'Room not selected'}</small><br>
                            <small><strong>Companions:</strong> ${companionsList}</small>
                        </div>
                        <div class="text-end">
                            <strong>₱${roomTotal.toLocaleString()}</strong><br>
                            <small>₱${pricePerNight.toLocaleString()}/night × ${nights} night(s)</small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    const partialPayment = totalAmount * 0.5;
    const isPartialChecked = document.getElementById("partialPaymentCheck")?.checked;
    const amountToPay = isPartialChecked ? partialPayment : totalAmount;

    container.innerHTML = `
        <!-- Guest Info -->
        ${guestData.firstName ? `
            <div class="summary-item">
                <h6><i class="fas fa-user me-2"></i>Guest</h6>
                <p class="mb-0">${guestData.firstName} ${guestData.lastName}</p>
                <small class="text-muted">${guestData.email}</small>
            </div>
        ` : ''}
        
        <!-- Dates -->
        ${checkInDate && checkOutDate ? `
            <div class="summary-item">
                <h6><i class="fas fa-calendar me-2"></i>Stay Duration</h6>
                <p class="mb-0">${formatDate(checkInDate)} to ${formatDate(checkOutDate)}</p>
                <small class="text-muted">${nights} night(s)</small>
            </div>
        ` : ''}
        
        <!-- Room Bookings -->
        <div class="summary-item">
            <h6><i class="fas fa-bed me-2"></i>Rooms</h6>
        </div>
        ${bookingItems}
        
        <!-- Payment Method -->
        ${selectedPaymentMethod ? `
            <div class="summary-item">
                <h6><i class="fas fa-credit-card me-2"></i>Payment Method</h6>
                <p class="mb-0">${selectedPaymentMethod}</p>
            </div>
        ` : ''}
        
        <!-- Totals -->
        <div class="summary-total">
            <div class="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>₱${totalAmount.toLocaleString()}</span>
            </div>
            ${isPartialChecked ? `
                <div class="d-flex justify-content-between mb-2">
                    <span>50% Partial Payment:</span>
                    <span>₱${partialPayment.toLocaleString()}</span>
                </div>
                <div class="d-flex justify-content-between text-muted">
                    <small>Remaining (due on check-in):</small>
                    <small>₱${(totalAmount - partialPayment).toLocaleString()}</small>
                </div>
                <hr>
            ` : ''}
            <div class="d-flex justify-content-between">
                <strong>Amount to Pay:</strong>
                <strong>₱${amountToPay.toLocaleString()}</strong>
            </div>
        </div>
    `;
}// === FINALIZE BOOKING ===
async function finalizeBooking() {
    if (!validatePayment()) return;

    const finalizeBtn = document.getElementById("finalizeBookingBtn");
    if (finalizeBtn) {
        finalizeBtn.disabled = true;
        finalizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    }

    try {
        // Create/get guest
        const guestId = await createOrGetGuest();
        if (!guestId) {
            showError("Failed to create/get guest information");
            return;
        }

        // Create reservations for each booking
        const reservationIds = [];
        for (const booking of multipleBookings) {
            if (booking.roomType && booking.roomId) {
                const reservationId = await createReservation(guestId, booking);
                if (reservationId) {
                    reservationIds.push(reservationId);
                }
            }
        }

        if (reservationIds.length === 0) {
            showError("Failed to create any reservations");
            return;
        }

        // Create payment record
        await createPayment(reservationIds);

        // Show success message
        showBookingSuccess();

        // Reset form after delay
        setTimeout(() => {
            resetForm();
        }, 3000);

    } catch (error) {
        console.error("Error finalizing booking:", error);
        showError("Failed to finalize booking. Please try again.");
    } finally {
        if (finalizeBtn) {
            finalizeBtn.disabled = false;
            finalizeBtn.innerHTML = '<i class="fas fa-check me-2"></i>Finalize Booking';
        }
    }
}

function validatePayment() {
    if (!selectedPaymentMethodId) {
        showError("Please select a payment method");
        return false;
    }

    const referenceNumber = document.getElementById("referenceNumber")?.value;
    const needsReference = selectedPaymentMethod.toLowerCase().includes('gcash') ||
        selectedPaymentMethod.toLowerCase().includes('maya') ||
        selectedPaymentMethod.toLowerCase().includes('paymaya') ||
        selectedPaymentMethod.toLowerCase().includes('bank');

    if (needsReference && !referenceNumber) {
        showError("Please enter the reference number for your payment");
        return false;
    }

    return true;
}

async function createOrGetGuest() {
    if (guestData.existingGuestId) {
        return guestData.existingGuestId;
    }

    try {
        const formData = new FormData();
        formData.append('first_name', guestData.firstName);
        formData.append('last_name', guestData.lastName);
        formData.append('email', guestData.email);
        formData.append('phone_number', guestData.phoneNumber);
        formData.append('date_of_birth', guestData.dateOfBirth);
        formData.append('guest_idtype_id', guestData.idType);
        formData.append('id_number', guestData.idNumber);

        if (guestData.idPicture) {
            formData.append('id_picture', guestData.idPicture);
        }

        const response = await axios.post(`${BASE_URL}/guests/guests.php`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (response.data.success) {
            return response.data.guest_id;
        } else {
            console.error("Error creating guest:", response.data.message);
            return null;
        }
    } catch (error) {
        console.error("Error creating guest:", error);
        return null;
    }
}

async function createReservation(guestId, booking) {
    try {
        const checkInDate = document.getElementById("checkInDate").value;
        const checkOutDate = document.getElementById("checkOutDate").value;

        const reservationData = {
            guest_id: guestId,
            reservation_type: 'walk-in',
            requested_room_type_id: booking.roomTypeId,
            check_in_date: checkInDate,
            check_out_date: checkOutDate,
            reservation_status_id: 2 // confirmed
        };

        const response = await axios.post(`${BASE_URL}/reservations/reservations.php`, reservationData);

        if (response.data.success) {
            const reservationId = response.data.reservation_id;

            // Create reserved room
            await createReservedRoom(reservationId, booking.roomId, booking.companions);

            return reservationId;
        } else {
            console.error("Error creating reservation:", response.data.message);
            return null;
        }
    } catch (error) {
        console.error("Error creating reservation:", error);
        return null;
    }
}

async function createReservedRoom(reservationId, roomId, companions) {
    try {
        const reservedRoomData = {
            reservation_id: reservationId,
            room_id: roomId
        };

        const response = await axios.post(`${BASE_URL}/reservations/reserved_rooms.php`, reservedRoomData);

        if (response.data.success && companions && companions.length > 0) {
            const reservedRoomId = response.data.reserved_room_id;

            // Add companions
            for (const companion of companions) {
                await axios.post(`${BASE_URL}/reservations/companions.php`, {
                    reserved_room_id: reservedRoomId,
                    full_name: companion.full_name
                });
            }
        }

        return response.data.success;
    } catch (error) {
        console.error("Error creating reserved room:", error);
        return false;
    }
}

async function createPayment(reservationIds) {
    try {
        const totalAmount = calculateTotalAmount();
        const isPartial = document.getElementById("partialPaymentCheck")?.checked;
        const amountPaid = isPartial ? totalAmount * 0.5 : totalAmount;
        const referenceNumber = document.getElementById("referenceNumber")?.value || null;

        for (const reservationId of reservationIds) {
            const paymentData = {
                reservation_id: reservationId,
                sub_method_id: selectedPaymentMethodId,
                amount: amountPaid,
                payment_date: new Date().toISOString().split('T')[0],
                reference_number: referenceNumber,
                notes: isPartial ? '50% Partial Payment - Walk-in Booking' : 'Full Payment - Walk-in Booking'
            };

            await axios.post(`${BASE_URL}/payments/payments.php`, paymentData);
        }

        return true;
    } catch (error) {
        console.error("Error creating payment:", error);
        return false;
    }
}

function calculateTotalAmount() {
    const checkInDate = document.getElementById("checkInDate")?.value;
    const checkOutDate = document.getElementById("checkOutDate")?.value;

    if (!checkInDate || !checkOutDate) return 0;

    const nights = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));

    return multipleBookings
        .filter(booking => booking.roomType)
        .reduce((total, booking) => {
            // Use price_per_stay from database (the actual column name)
            const pricePerNight = parseFloat(booking.roomType.price_per_stay) || parseFloat(booking.roomType.price_per_night) || 0;
            return total + (pricePerNight * nights);
        }, 0);
}

function showBookingSuccess() {
    const successMessage = document.getElementById("bookingSuccessMessage");
    if (successMessage) {
        successMessage.innerHTML = `
            <div class="text-center">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h4>Booking Confirmed!</h4>
                <p class="mb-3">Walk-in booking has been successfully created and confirmed.</p>
                <p class="mb-0">Guest: <strong>${guestData.firstName} ${guestData.lastName}</strong></p>
                <p class="mb-0">Rooms: <strong>${multipleBookings.filter(b => b.roomType).length} room(s)</strong></p>
            </div>
        `;
        successMessage.style.display = "block";

        // Hide all step contents
        document.querySelectorAll('.step-content').forEach(content => {
            content.style.display = "none";
        });

        showSuccess("Booking confirmed successfully!");
    }
}

function resetForm() {
    // Reset all form data
    guestData = {};
    multipleBookings = [];
    selectedPaymentCategory = '';
    selectedPaymentMethod = '';
    selectedPaymentMethodId = '';

    // Reset form fields
    document.querySelectorAll('form input, form select').forEach(field => {
        if (field.type !== 'file') {
            field.value = '';
        } else {
            field.files = null;
        }
    });

    // Reset checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Hide sections
    document.getElementById("availableRoomsSection").style.display = "none";
    document.getElementById("companionsSection").style.display = "none";
    document.getElementById("paymentDetailsSection").style.display = "none";
    document.getElementById("bookingSuccessMessage").style.display = "none";

    // Reset stepper and show first step
    setMinimumDates();
    showStep(0);
}

// === UTILITY FUNCTIONS ===
function formatDate(dateStr) {
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'error');
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toastId = 'toast-' + Date.now();
    const iconColor = type === 'success' ? 'text-success' : type === 'error' ? 'text-danger' : 'text-info';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle';

    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center bg-white text-dark border mb-2 show`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${icon} ${iconColor} me-2"></i>${message}
            </div>
            <button type="button" class="btn-close me-2 m-auto" onclick="this.closest('.toast').remove()"></button>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        const toastEl = document.getElementById(toastId);
        if (toastEl) toastEl.remove();
    }, 5000);
}

// Make functions globally accessible for onclick handlers
window.selectGuest = selectGuest;
window.selectRoomType = selectRoomType;
window.selectRoom = selectRoom;
window.updateCompanionInputs = updateCompanionInputs;
window.updateCompanionData = updateCompanionData;
window.addNewBooking = addNewBooking;
window.removeBooking = removeBooking;
window.setActiveBooking = setActiveBooking;
window.selectPaymentCategory = selectPaymentCategory;
window.selectPaymentMethod = selectPaymentMethod;
