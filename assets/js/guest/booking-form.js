// Stepper logic
const stepLabels = [document.getElementById('step-1-label'), document.getElementById('step-2-label'), document.getElementById('step-3-label')];
const forms = [
    document.getElementById('guestInfoForm'),
    document.getElementById('bookingDetailsForm'),
    document.getElementById('paymentForm')
];
let currentStep = 0;
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
        const { data } = await axios.get('/Hotel-Reservation-Billing-System/api/admin/guests/id_types.php');
        const select = document.getElementById('idType');
        if (!select) return;
        select.innerHTML = '<option value="">Select ID Type</option>' +
            (Array.isArray(data) ? data : []).map(t =>
                `<option value="${t.id_type}">${t.id_type}</option>`
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

// Room type from URL
let selectedRoomType = '';
let selectedRoomTypeId = '';
let selectedRoomTypePrice = 0;
document.addEventListener('DOMContentLoaded', async function () {
    // Room type from URL
    const params = new URLSearchParams(window.location.search);
    const typeName = params.get('type');
    if (typeName) {
        // Fetch room type info
        try {
            const { data } = await axios.get('/Hotel-Reservation-Billing-System/api/admin/rooms/room-type.php');
            const roomTypes = Array.isArray(data) ? data : [];
            const type = roomTypes.find(t => (t.type_name || '').toLowerCase() === typeName.toLowerCase());
            if (type) {
                selectedRoomType = type.type_name;
                selectedRoomTypeId = type.room_type_id;
                selectedRoomTypePrice = Number(type.price_per_stay) || 0;
                const roomTypeInput = document.getElementById('roomType');
                const guestsInput = document.getElementById('guests');
                if (roomTypeInput) roomTypeInput.value = selectedRoomType;
                if (guestsInput) {
                    guestsInput.max = type.max_capacity || 10;
                    guestsInput.value = type.max_capacity || 1;
                }
            }
        } catch { }
    }
});

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

    // Set back button to correct room type
    const params = new URLSearchParams(window.location.search);
    const typeName = params.get('type');
    const backBtn = document.getElementById('backToRoomDetailsBtn');
    if (typeName && backBtn) {
        backBtn.href = `selected-room.html?type=${encodeURIComponent(typeName)}`;
    }
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
        window.bookingGuestInfo = {
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
        // Test API connection for guest info (optional, for debugging)
        // const testFormData = new FormData();
        // Object.entries(window.bookingGuestInfo).forEach(([k, v]) => {
        //     if (k === 'id_picture' && v) testFormData.append('id_picture', v);
        //     else testFormData.append(k, v);
        // });
        // testFormData.append('operation', 'insertGuest');
        // let testRes = await axios.post('/Hotel-Reservation-Billing-System/api/admin/guests/guests.php', testFormData, {
        //     headers: { 'Content-Type': 'multipart/form-data' }
        // });
        // if (!testRes.data || !testRes.data.guest_id) throw new Error('Guest API error: ' + JSON.stringify(testRes.data));
        showStep(1);
    } catch (err) {
        showToast('Failed to save guest info: ' + (err?.message || ''), 'error');
    }
};

// --- Companion Input for Multiple Guests ---
// Show companion inputs immediately if guests > 1, and update on change
function updateCompanionInputs() {
    const guestsInput = document.getElementById('guests');
    const containerId = 'companionsContainer';
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'mt-3';
        const parent = guestsInput.closest('.row.g-4') || guestsInput.parentElement;
        parent.appendChild(container);
    }
    container.innerHTML = '';
    const guests = parseInt(guestsInput.value, 10) || 1;
    if (guests > 1) {
        for (let i = 2; i <= guests; i++) {
            container.innerHTML += `
                <div class="mb-2">
                    <label class="form-label">Companion #${i} Full Name <span class="text-danger">*</span></label>
                    <input type="text" class="form-control companion-name" data-index="${i}" placeholder="Full Name of Companion #${i}" required>
                </div>
            `;
        }
    }
}
document.getElementById('guests')?.addEventListener('input', updateCompanionInputs);
document.getElementById('guests')?.addEventListener('change', updateCompanionInputs);
// Show companion inputs immediately on load if guests > 1
document.addEventListener('DOMContentLoaded', function () {
    const guestsInput = document.getElementById('guests');
    if (guestsInput) updateCompanionInputs();
});

// Step 2 -> Step 3 (add companion validation)
document.getElementById('toStep3Btn').onclick = function () {
    const form = document.getElementById('bookingDetailsForm');
    // Validate all required fields
    const requiredFields = [
        'roomType', 'guests', 'checkInDate', 'checkInTime', 'checkOutDate', 'checkOutTime'
    ];
    let missing = [];
    requiredFields.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !el.value) missing.push(id);
    });
    if (missing.length > 0) {
        showToast('Please fill in all booking details.', 'warning');
        return;
    }
    // Validate check-in/check-out logic
    const checkInDate = document.getElementById('checkInDate').value;
    const checkInTime = document.getElementById('checkInTime').value;
    if (!checkInDate || !checkInTime) {
        showToast('Please select check-in date and time.', 'warning');
        return;
    }
    // 24 hours slot, roll over date
    const dt = new Date(`${checkInDate}T${checkInTime}:00+08:00`);
    dt.setDate(dt.getDate() + 1);
    const checkOutDate = dt.toISOString().slice(0, 10);
    const checkOutTime = checkInTime;
    const checkOutDateInput = document.getElementById('checkOutDate');
    const checkOutTimeInput = document.getElementById('checkOutTime');
    if (checkOutDateInput) checkOutDateInput.value = checkOutDate;
    if (checkOutTimeInput) checkOutTimeInput.value = checkOutTime;

    // Validate companions if guests > 1
    const guests = parseInt(document.getElementById('guests').value, 10) || 1;
    if (guests > 1) {
        const companions = Array.from(document.querySelectorAll('.companion-name')).map(inp => inp.value.trim());
        if (companions.some(name => !name)) {
            showToast('Please enter all companion names.', 'warning');
            return;
        }
    }

    // Fill summary
    const summaryRoomType = document.getElementById('summaryRoomType');
    const summaryDates = document.getElementById('summaryDates');
    const summaryGuests = document.getElementById('summaryGuests');
    const summaryPrice = document.getElementById('summaryPrice');
    const summaryDownPayment = document.getElementById('summaryDownPayment');
    const amountToPay = document.getElementById('amountToPay');
    if (summaryRoomType) summaryRoomType.textContent = `Room Type: ${selectedRoomType}`;
    if (summaryDates) summaryDates.textContent = `Check-in: ${checkInDate} ${checkInTime} | Check-out: ${checkOutDate} ${checkOutTime}`;
    if (summaryGuests) summaryGuests.textContent = `Guests: ${document.getElementById('guests').value}`;
    if (summaryPrice) summaryPrice.textContent = `Total Price: ₱${selectedRoomTypePrice.toLocaleString()}`;
    if (summaryDownPayment) summaryDownPayment.textContent = `Down Payment (50%): ₱${(selectedRoomTypePrice * 0.5).toLocaleString()}`;
    if (amountToPay) amountToPay.value = (selectedRoomTypePrice * 0.5).toLocaleString();

    showStep(2);
};

// --- Payment Category & Method Hero Logic ---
let paymentCategories = [];
let paymentSubMethods = [];
let selectedPaymentCategory = '';
let selectedPaymentMethod = '';
let selectedPaymentMethodId = '';
let selectedPaymentInstructions = '';

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
    if (name.includes('gcash')) return 'Send payment to our official GCash number: <b>09XXXXXXXXX</b>.<br>After payment, upload your proof of payment in your account or send to our email.';
    if (name.includes('paymaya')) return 'Send payment to our official PayMaya number: <b>09XXXXXXXXX</b>.<br>After payment, upload your proof of payment in your account or send to our email.';
    if (name.includes('bpi')) return 'Transfer to our BPI account: <b>1234-5678-90</b>.<br>After payment, upload your proof of payment in your account or send to our email.';
    if (name.includes('bdo')) return 'Transfer to our BDO account: <b>1234-5678-90</b>.<br>After payment, upload your proof of payment in your account or send to our email.';
    if (name.includes('visa')) return 'Pay using your Visa card at checkout. After payment, upload your proof of payment in your account or send to our email.';
    return 'Follow the instructions provided after booking or contact our front desk for assistance.';
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
            select.parentNode.insertBefore(hero, select.nextSibling);
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
        <div class="mb-2"><strong>Select Payment Method:</strong></div>
        <div class="d-flex flex-wrap gap-2 mb-2">
            ${methods.map(m =>
        `<button type="button" class="btn btn-outline-primary payment-sub-method-btn" 
                    data-method-id="${m.sub_method_id}" 
                    data-method-name="${m.name}" 
                    data-instructions="${getPaymentInstructions(m)}">${m.name}</button>`
    ).join('')}
        </div>
        <div class="mt-2" id="paymentInstructionsBox" style="display:none;"></div>
    `;
    // Add click listeners
    hero.querySelectorAll('.payment-sub-method-btn').forEach(btn => {
        btn.onclick = function () {
            hero.querySelectorAll('.payment-sub-method-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPaymentMethod = btn.getAttribute('data-method-name');
            selectedPaymentMethodId = btn.getAttribute('data-method-id');
            selectedPaymentInstructions = btn.getAttribute('data-instructions');
            // Show instructions
            const instrBox = hero.querySelector('#paymentInstructionsBox');
            if (instrBox) {
                instrBox.style.display = '';
                instrBox.innerHTML = `<div class="alert alert-info"><strong>Instructions:</strong><br>${selectedPaymentInstructions}</div>`;
            }
            // Show chosen method as text below select
            let info = document.getElementById('chosenPaymentMethodInfo');
            const select = document.getElementById('paymentMethod');
            if (select) {
                if (!info) {
                    info = document.createElement('div');
                    info.id = 'chosenPaymentMethodInfo';
                    select.parentNode.appendChild(info);
                }
                info.innerHTML = `<div class="mt-2 alert alert-success py-2">Selected: <strong>${selectedPaymentMethod}</strong><br><small>${selectedPaymentInstructions}</small></div>`;
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
}

// When payment category is selected, show hero for sub-methods
document.getElementById('paymentMethod')?.addEventListener('change', function (e) {
    const catId = this.value;
    if (!catId) {
        // Remove hero if exists
        const hero = document.getElementById('paymentSubMethodsHero');
        if (hero) hero.remove();
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

    // 1. Save guest info (upload id_picture if present)
    let guestId = null;
    try {
        const guestData = window.bookingGuestInfo;
        const formData = new FormData();
        Object.entries(guestData).forEach(([k, v]) => {
            if (k === 'id_picture' && v) {
                formData.append('id_picture', v);
            } else {
                formData.append(k, v);
            }
        });
        formData.append('operation', 'insertGuest');
        const res = await axios.post('/Hotel-Reservation-Billing-System/api/admin/guests/guests.php', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        guestId = res.data && res.data.guest_id ? res.data.guest_id : null;
        if (!guestId) throw new Error('Failed to save guest info');
    } catch (err) {
        Swal.fire('Error', 'Failed to save guest info', 'error');
        return;
    }
    // 2. Save reservation
    let reservationId = null;
    try {
        const checkInDate = document.getElementById('checkInDate').value;
        const checkInTime = document.getElementById('checkInTime').value;
        const checkOutDate = document.getElementById('checkOutDate').value;
        const checkOutTime = document.getElementById('checkOutTime').value;
        const guests = document.getElementById('guests').value;
        const reservationData = {
            guest_id: guestId,
            room_type_id: selectedRoomTypeId,
            check_in_date: checkInDate,
            check_in_time: checkInTime,
            check_out_date: checkOutDate,
            check_out_time: checkOutTime,
            guests: guests
        };
        const formData = new FormData();
        formData.append('operation', 'createReservation');
        formData.append('json', JSON.stringify(reservationData));
        const res = await axios.post('/Hotel-Reservation-Billing-System/api/admin/reservations/reservations.php', formData);
        reservationId = res.data && res.data.reservation_id ? res.data.reservation_id : null;
        if (!reservationId) throw new Error('Failed to save reservation');
    } catch (err) {
        Swal.fire('Error', 'Failed to save reservation', 'error');
        return;
    }

    // 2b. Save companions if any (fetch reserved_room_id)
    try {
        const guests = parseInt(document.getElementById('guests').value, 10) || 1;
        if (guests > 1) {
            // Fetch reserved_room_id(s) for this reservation
            const rrRes = await axios.get('/Hotel-Reservation-Billing-System/api/admin/reservations/reserved_rooms.php', {
                params: {
                    operation: 'getAllReservedRooms'
                }
            });
            // Find reserved_room_id(s) for this reservation
            const reservedRooms = Array.isArray(rrRes.data) ? rrRes.data.filter(r => r.reservation_id == reservationId) : [];
            // Use the first reserved_room_id (or all, if needed)
            const reserved_room_id = reservedRooms.length > 0 ? reservedRooms[0].reserved_room_id : null;
            if (reserved_room_id) {
                const companions = Array.from(document.querySelectorAll('.companion-name')).map(inp => inp.value.trim());
                for (const name of companions) {
                    if (!name) continue;
                    await axios.post('/Hotel-Reservation-Billing-System/api/admin/reservations/companions.php', {
                        operation: 'insertCompanion',
                        json: JSON.stringify({
                            reserved_room_id,
                            full_name: name
                        })
                    });
                }
            }
        }
    } catch (err) {
        // Companion save failure is not fatal for booking
    }

    // 3. Save payment (50% downpayment)
    try {
        const paymentData = {
            reservation_id: reservationId,
            sub_method_id: paymentMethodId,
            amount_paid: selectedRoomTypePrice * 0.5
        };
        const formData = new FormData();
        formData.append('operation', 'createPayment');
        formData.append('json', JSON.stringify(paymentData));
        await axios.post('/Hotel-Reservation-Billing-System/api/admin/payments/payments.php', formData);
    } catch (err) {
        Swal.fire('Error', 'Failed to save payment', 'error');
        return;
    }
    // Success
    forms.forEach(f => f.classList.add('d-none'));
    Swal.fire({
        icon: 'success',
        title: 'Booking Successful!',
        text: 'Thank you for booking with HellHotel. Check your email for confirmation.',
        timer: 2500,
        showConfirmButton: false
    });
    // Show booking success message with fade-in
    const successMsg = document.getElementById('bookingSuccess');
    if (successMsg) successMsg.classList.add('active');
};

// --- 24-hour PH time logic for check-out ---
// Fix: Always use PH timezone and ensure date rolls over if needed
function setCheckOutFields() {
    const checkInDate = document.getElementById('checkInDate').value;
    const checkInTime = document.getElementById('checkInTime').value;
    if (!checkInDate || !checkInTime) return;
    // Always treat as Asia/Manila (UTC+8)
    const dt = new Date(`${checkInDate}T${checkInTime}:00+08:00`);
    dt.setDate(dt.getDate() + 1); // Add 1 day (24 hours)
    const checkOutDate = dt.toISOString().slice(0, 10);
    const checkOutTime = checkInTime; // Keep the same time for check-out
    const checkOutDateInput = document.getElementById('checkOutDate');
    const checkOutTimeInput = document.getElementById('checkOutTime');
    if (checkOutDateInput) checkOutDateInput.value = checkOutDate;
    if (checkOutTimeInput) checkOutTimeInput.value = checkOutTime;
}
document.getElementById('checkInDate')?.removeEventListener('change', setCheckOutFields);
document.getElementById('checkInTime')?.removeEventListener('change', setCheckOutFields);
document.getElementById('checkInDate')?.addEventListener('change', setCheckOutFields);
document.getElementById('checkInTime')?.addEventListener('change', setCheckOutFields);
// Also set check-out fields on page load if check-in fields are filled
document.addEventListener('DOMContentLoaded', function () {
    setCheckOutFields();
});