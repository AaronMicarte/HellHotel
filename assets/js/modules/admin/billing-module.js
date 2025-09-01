// Billing Module (Admin) - Modal logic for update, delete, details

// --- Show Billing Details Modal ---
export const showBillingDetailsModal = async (billingId) => {
    // Helper to format date as 'Mmm d, yyyy'
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        const month = d.toLocaleString('en-US', { month: 'short' });
        const day = d.getDate();
        const year = d.getFullYear();
        return `${month} ${day}, ${year}`;
    }
    try {
        console.debug("[BillingModule] showBillingDetailsModal called with billingId:", billingId);

        const modalEl = document.getElementById("billingDetailsModal");
        if (!modalEl) {
            console.error("[BillingModule] Modal element #billingDetailsModal not found in DOM.");
            return;
        }
        const modal = new bootstrap.Modal(modalEl, {
            keyboard: true,
            backdrop: "static"
        });

        // Fetch billing details (now includes room price, addons, etc)
        const billing = await getBillingDetails(billingId);
        console.debug("[BillingModule] Billing details loaded:", billing);

        if (!billing || typeof billing !== "object" || Object.keys(billing).length === 0) {
            console.error("[BillingModule] No billing details found for billingId:", billingId, billing);
            document.getElementById("billingDetails").innerHTML = `<div class="alert alert-warning">No billing details found.</div>`;
            modal.show();
            return;
        }

        // Addons table rows
        let addonsHtml = "";
        if (billing.addons && billing.addons.length > 0) {
            addonsHtml = `
                <table class="table table-sm table-bordered mb-2">
                    <thead>
                        <tr>
                            <th>Addon</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${billing.addons.map(a => `
                            <tr>
                                <td>${a.addon_name}</td>
                                <td>${a.quantity}</td>
                                <td>₱${parseFloat(a.unit_price).toFixed(2)}</td>
                                <td>₱${parseFloat(a.subtotal).toFixed(2)}</td>
                            </tr>
                        `).join("")}
                        <tr>
                            <td colspan="3" class="text-end fw-bold">Addons Total</td>
                            <td class="fw-bold">₱${parseFloat(billing.addons_total).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        } else {
            addonsHtml = `<div class="text-muted">No addons.</div>`;
        }

        // Populate billing details
        let roomPrice = billing.room_price !== undefined ? billing.room_price : 0;
        let totalBill = billing.total_bill !== undefined ? billing.total_bill : 0;
        let amountPaid = billing.amount_paid !== undefined ? billing.amount_paid : 0;
        let remainingAmount = billing.remaining_amount !== undefined ? billing.remaining_amount : 0;
        let billingStatus = billing.billing_status || '';

        const billingDetailsDiv = document.getElementById("billingDetails");
        if (!billingDetailsDiv) {
            console.error("[BillingModule] #billingDetails element not found in DOM.");
            modal.show();
            return;
        }

        // Show all reserved rooms in a table, type first then number
        let roomsHtml = '';
        if (billing.rooms && billing.rooms.length > 0) {
            roomsHtml = `
                <table class="table table-sm table-bordered mb-2">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Room Number</th>
                            <th>Price/Stay</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${billing.rooms.map(r => `
                            <tr>
                                <td>${r.type_name}</td>
                                <td>${r.room_number}</td>
                                <td>₱${parseFloat(r.price_per_stay).toFixed(2)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            `;
        } else {
            roomsHtml = `<div class="text-muted">No reserved rooms.</div>`;
        }

        // Determine color for status text
        let statusColor = '#6c757d'; // default gray
        if (billingStatus.toLowerCase() === 'paid') statusColor = '#198754'; // green
        else if (billingStatus.toLowerCase() === 'unpaid' || billingStatus.toLowerCase() === 'overdue') statusColor = '#dc3545'; // red
        else if (billingStatus.toLowerCase() === 'partial') statusColor = '#fd7e14'; // orange

        // Make modal larger (add class to modal dialog)
        const modalDialog = document.querySelector('#billingDetailsModal .modal-dialog');
        if (modalDialog) {
            modalDialog.classList.add('modal-xl');
            modalDialog.style.maxWidth = '900px';
        }

        // Add icons using FontAwesome (assume already loaded in project)
        billingDetailsDiv.innerHTML = `
            <style>
                .details-icon { width: 1.2em; margin-right: 7px; opacity: 0.85; }
                .details-label { font-weight: 500; color: #495057; letter-spacing: 0.5px; }
                .details-table td { vertical-align: middle; }
                .details-table th { background: #f8f9fa; }
                .details-section-title { font-size: 1.1em; margin-top: 1.2em; margin-bottom: 0.5em; color: #333; font-weight: 600; letter-spacing: 0.5px; }
                .amount-label { font-weight: 500; }
                .amount-value { font-weight: bold; font-size: 1.1em; }
            </style>
            <table class="table table-sm details-table mb-3">
                <tr><td class="details-label"><i class="fas fa-receipt details-icon"></i>Billing ID</td><td>${billing.billing_id || ''}</td></tr>
                <tr><td class="details-label"><i class="fas fa-user details-icon"></i>Guest</td><td>${billing.guest_name || ''}</td></tr>
                <tr><td class="details-label"><i class="fas fa-calendar-check details-icon"></i>Reservation</td><td>${billing.reservation_id || ''}</td></tr>
                <tr><td class="details-label"><i class="fas fa-calendar-day details-icon"></i>Date</td><td>${formatDate(billing.billing_date) || ''}</td></tr>
                <tr><td class="details-label"><i class="fas fa-info-circle details-icon"></i>Status</td><td style="font-weight:bold;text-transform:uppercase;color:${statusColor}"><i style="font-size:0.8em;color:${statusColor};margin-right:6px;"></i>${billingStatus}</td></tr>
            </table>
            <div class="details-section-title"><i class="fas fa-door-open details-icon"></i>Reserved Rooms</div>
            ${roomsHtml}
            <div class="details-section-title"><i class="fas fa-plus-circle details-icon"></i>Addons</div>
            ${addonsHtml}
            <div class="row mb-2 mt-3">
                <div class="col-md-4 col-12 mb-2">
                    <span class="amount-label"><i class="fas fa-file-invoice-dollar details-icon"></i>Total Bill:</span> <span class="amount-value text-primary">₱${parseFloat(totalBill).toFixed(2)}</span>
                </div>
                <div class="col-md-4 col-12 mb-2">
                    <span class="amount-label"><i class="fas fa-coins details-icon"></i>Amount Paid:</span> <span class="amount-value text-success">₱${parseFloat(amountPaid).toFixed(2)}</span>
                </div>
                <div class="col-md-4 col-12 mb-2">
                    <span class="amount-label"><i class="fas fa-wallet details-icon"></i>Remaining Amount:</span> <span class="amount-value text-danger">₱${parseFloat(remainingAmount).toFixed(2)}</span>
                </div>
            </div>
        `;

        // Payment history
        const paymentHistoryBody = document.getElementById("paymentHistoryBody");
        if (!paymentHistoryBody) {
            console.error("[BillingModule] #paymentHistoryBody element not found in DOM.");
        } else {
            paymentHistoryBody.innerHTML = "";
            (billing.payments || []).forEach(p => {
                paymentHistoryBody.innerHTML += `
                    <tr>
                        <td>${formatDate(p.payment_date)}</td>
                        <td>₱${p.amount_paid}</td>
                        <td>${p.method_name || '-'}</td>
                        <td>${p.notes || ''}</td>
                    </tr>
                `;
            });
        }

        modal.show();
    } catch (error) {
        console.error("[BillingModule] Failed to load billing details", error);
        alert("Failed to load billing details");
    }
};

// --- Helper: Get Billing Details ---
export const getBillingDetails = async (billingId) => {
    console.debug("[BillingModule] getBillingDetails called with billingId:", billingId);
    const response = await axios.get(`${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/billing/billing.php`, {
        params: { billing_id: billingId }
    });
    console.debug("[BillingModule] getBillingDetails response:", response.data);
    return response.data;
};

// --- Helper: Populate Reservation Select ---
const populateReservationSelect = async (selectedReservationId = null) => {
    const select = document.getElementById("reservationSelect");
    select.innerHTML = `<option value="">-- Select Reservation --</option>`;
    // FIX: Use the correct reservations API endpoint
    const response = await axios.get(`${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/reservations/reservations.php`, {
        params: { operation: "getAllReservations" }
    });
    console.debug("[BillingModule] Reservations loaded for select:", response.data);
    (response.data || []).forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.reservation_id;
        opt.textContent = `#${r.reservation_id} - ${r.guest_name}`;
        if (selectedReservationId && r.reservation_id == selectedReservationId) opt.selected = true;
        select.appendChild(opt);
    });
    // Disable the dropdown so user cannot change it
    select.disabled = true;
    // On change, update guest/amount fields
    select.onchange = async function () {
        if (this.value) {
            const billing = await getBillingByReservation(this.value);
            console.debug("[BillingModule] Billing loaded for reservation select change:", billing);
            document.getElementById("guestName").value = billing.guest_name;
            document.getElementById("totalAmount").value = billing.total_amount;
            document.getElementById("remainingAmount").value = billing.remaining_amount;
        } else {
            document.getElementById("guestName").value = "";
            document.getElementById("totalAmount").value = "";
            document.getElementById("remainingAmount").value = "";
        }
    };
};

// --- Helper: Get Billing by Reservation ---
const getBillingByReservation = async (reservationId) => {
    console.debug("[BillingModule] getBillingByReservation called with reservationId:", reservationId);
    const response = await axios.get(`${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/billing/billing.php`, {
        params: { reservation_id: reservationId }
    });
    console.debug("[BillingModule] getBillingByReservation response:", response.data);
    return response.data;
};

// --- Helper: Status Color ---
const getStatusColor = (status) => {
    const map = {
        "paid": "success",
        "unpaid": "danger",
        "partial": "warning",
        "overdue": "danger"
    };
    return map[status] || "secondary";
};

// --- Helper: Get sub_method_id dynamically from API ---
const getSubMethodIdByName = async (methodName) => {
    try {
        // Try exact match first
        let response = await axios.get(
            `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/payments/sub-method.php`,
            {
                params: {
                    operation: "getSubMethodByName",
                    name: methodName
                }
            }
        );
        // Accept both array/object response
        if (Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0].sub_method_id;
        }
        if (response.data && typeof response.data === "object" && response.data.sub_method_id) {
            return response.data.sub_method_id;
        }
        // Try fallback: capitalize and replace underscores/hyphens with spaces
        const fallbackName = methodName.replace(/[_-]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        if (fallbackName !== methodName) {
            response = await axios.get(
                `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/payments/sub-method.php`,
                {
                    params: {
                        operation: "getSubMethodByName",
                        name: fallbackName
                    }
                }
            );
            if (Array.isArray(response.data) && response.data.length > 0) {
                return response.data[0].sub_method_id;
            }
            if (response.data && typeof response.data === "object" && response.data.sub_method_id) {
                return response.data.sub_method_id;
            }
        }
        // Try fallback: case-insensitive match from all sub-methods
        const allMethodsResp = await axios.get(
            `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/payments/sub-method.php`,
            { params: { operation: "getAllSubMethods" } }
        );
        const allMethods = Array.isArray(allMethodsResp.data) ? allMethodsResp.data : [];
        const found = allMethods.find(
            m => m.name && m.name.toLowerCase() === methodName.toLowerCase()
        );
        if (found) {
            return found.sub_method_id;
        }
        // Debug: log what was tried
        console.warn("[BillingModule] getSubMethodIdByName: No sub_method_id found for", methodName, "or", fallbackName, response.data, allMethods);
        return null;
    } catch (err) {
        console.error("[BillingModule] Failed to fetch sub_method_id for", methodName, err);
        return null;
    }
};

// --- Helper: Dynamically populate payment method dropdown from API ---
const populatePaymentMethodSelect = async () => {
    const select = document.getElementById("paymentMethod");
    if (!select) return;
    select.innerHTML = `<option value="">-- Select Payment Method --</option>`;
    try {
        // Fetch all sub-methods (with their categories)
        const response = await axios.get(
            `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/payments/sub-method.php`,
            { params: { operation: "getAllSubMethods" } }
        );
        const subMethods = Array.isArray(response.data) ? response.data : [];
        subMethods.forEach(sm => {
            const opt = document.createElement("option");
            opt.value = sm.name; // keep using name for compatibility with getSubMethodIdByName
            opt.textContent = sm.payment_category
                ? `${sm.name} (${sm.payment_category})`
                : sm.name;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("[BillingModule] Failed to load payment methods:", err);
        select.innerHTML = `<option value="">Error loading methods</option>`;
    }
};

// --- Show Payment Modal (Add/Edit Payment) ---
export const showPaymentModal = async (billingId = null, reservationId = null) => {
    try {
        console.debug("[BillingModule] showPaymentModal called with billingId:", billingId, "reservationId:", reservationId);
        // Reset form
        document.getElementById("paymentForm").reset();
        document.getElementById("billingId").value = billingId || "";

        // Dynamically load payment methods
        await populatePaymentMethodSelect();

        let resolvedReservationId = reservationId;
        // If billingId is given but reservationId is not, fetch the billing to get reservation_id
        if (billingId && !reservationId) {
            const billing = await getBillingDetails(billingId);
            resolvedReservationId = billing.reservation_id;
        }

        // Load reservations for dropdown and select the correct one
        await populateReservationSelect(resolvedReservationId);

        // If editing, load billing info
        if (billingId) {
            const billing = await getBillingDetails(billingId);
            console.debug("[BillingModule] Billing for payment modal:", billing);
            document.getElementById("guestName").value = billing.guest_name;
            // --- FIX: Always use total_bill (room + addons) for Total Amount ---
            let totalBill = (typeof billing.total_bill !== 'undefined') ? billing.total_bill : (typeof billing.total_amount !== 'undefined' ? billing.total_amount : 0);
            document.getElementById("totalAmount").value = totalBill;
            document.getElementById("remainingAmount").value = billing.remaining_amount;

            // Set max for paymentAmount input to remainingAmount
            const paymentAmountInput = document.getElementById("paymentAmount");
            if (paymentAmountInput && billing.remaining_amount !== undefined && billing.remaining_amount !== null) {
                paymentAmountInput.max = billing.remaining_amount;
            }
        }
        new bootstrap.Modal(document.getElementById("paymentModal")).show();
    } catch (error) {
        console.error("[BillingModule] Failed to show payment modal", error);
    }
};

// --- Record Payment Logic ---
export const recordPayment = async () => {
    const billingId = document.getElementById("billingId").value;
    const reservationId = document.getElementById("reservationSelect").value;
    const paymentAmount = document.getElementById("paymentAmount").value;
    const paymentMethod = document.getElementById("paymentMethod").value;
    const paymentNotes = document.getElementById("paymentNotes").value;

    // DEBUG: Log all values
    console.debug("[BillingModule] recordPayment values:", {
        billingId, reservationId, paymentAmount, paymentMethod, paymentNotes
    });

    if (!reservationId || !paymentAmount || !paymentMethod) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: 'Please fill in all required fields',
            showConfirmButton: false,
            timer: 1800
        });
        return;
    }

    // --- Prevent overpayment ---
    // Fetch latest billing info to get remaining_amount
    const billing = await getBillingDetails(billingId);
    if (billing && billing.remaining_amount !== undefined && billing.remaining_amount !== null) {
        if (parseFloat(paymentAmount) > parseFloat(billing.remaining_amount)) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Payment exceeds remaining amount!',
                showConfirmButton: false,
                timer: 2200
            });
            return false;
        }
        if (parseFloat(billing.remaining_amount) <= 0) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Bill is already fully paid!',
                showConfirmButton: false,
                timer: 2200
            });
            return false;
        }
        if (billing.billing_status && billing.billing_status.toLowerCase() === "paid") {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Bill is already fully paid!',
                showConfirmButton: false,
                timer: 2200
            });
            return false;
        }
    }

    // Dynamically get sub_method_id from API
    const sub_method_id = await getSubMethodIdByName(paymentMethod);
    console.debug("[BillingModule] Using sub_method_id (dynamic):", sub_method_id, "for paymentMethod:", paymentMethod);

    if (!sub_method_id) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Invalid or missing payment method. Please check payment setup.',
            showConfirmButton: false,
            timer: 2500
        });
        // Extra debug: log all available sub-methods for troubleshooting
        try {
            const allMethods = await axios.get(
                `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/payments/sub-method.php`,
                { params: { operation: "getAllSubMethods" } }
            );
            console.warn("[BillingModule] Available payment methods from API:", allMethods.data);
        } catch (err) {
            console.error("[BillingModule] Could not fetch all payment methods for debug:", err);
        }
        return false;
    }


    // --- Get user_id ---
    let user_id = null;
    if (window.Auth && typeof window.Auth.getUserId === "function") {
        user_id = window.Auth.getUserId();
    }
    if (!user_id) {
        user_id = window.currentUserId;
    }
    if (!user_id) {
        const userInput = document.getElementById("currentUserId");
        if (userInput) user_id = userInput.value;
    }
    if (!user_id) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'User ID not found. Please log in again or reload the page.',
            showConfirmButton: false,
            timer: 3000
        });
        return false;
    }

    // --- Get payment_date as current datetime (YYYY-MM-DD HH:mm:ss) ---
    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const payment_date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const payload = {
        user_id,
        billing_id: billingId,
        reservation_id: reservationId,
        sub_method_id,
        amount_paid: paymentAmount,
        payment_date,
        notes: paymentNotes
    };

    // DEBUG: Log payload
    console.debug("[BillingModule] Payment payload to send:", payload);

    const formData = new FormData();
    formData.append("operation", "insertPayment");
    formData.append("json", JSON.stringify(payload));

    try {
        const response = await axios.post(
            `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/payments/payments.php`,
            formData
        );
        console.debug("[BillingModule] Payment API response:", response.data);

        // DEBUG: If API error, log full response
        if (!response.data || !(response.data === 1 || response.data.success)) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Failed to record payment (API error)',
                showConfirmButton: false,
                timer: 1800
            });
            console.error("[BillingModule] Payment API error:", response.data);
            if (response.data && typeof response.data === "object" && response.data.error) {
                alert("Payment API error: " + response.data.error);
            }
            return false;
        }

        // After payment, update billing status if needed
        // Fetch latest billing info
        const billing = await getBillingDetails(billingId);
        if (billing) {
            if (parseFloat(billing.remaining_amount) === 0) {
                // Fully paid
                await updateBillingStatus(billingId, 2); // 2 = paid
            } else if (parseFloat(billing.amount_paid) > 0) {
                await updateBillingStatus(billingId, 3); // 3 = partial
            }
        }

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Payment recorded!',
            showConfirmButton: false,
            timer: 1800
        });
        bootstrap.Modal.getInstance(document.getElementById("paymentModal")).hide();
        return true;
    } catch (err) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Failed to record payment (network/server error)',
            showConfirmButton: false,
            timer: 1800
        });
        console.error("[BillingModule] Payment API exception:", err);
        if (err.response) {
            console.error("[BillingModule] Payment API error response:", err.response.data);
            alert("Payment API error: " + (err.response.data?.error || JSON.stringify(err.response.data)));
        }
        return false;
    }
};

// --- Delete Billing Logic ---
export const deleteBilling = async (billingId, refreshDisplay) => {
    if (window.Swal) {
        const result = await Swal.fire({
            title: 'Delete Billing?',
            text: 'Are you sure you want to delete this billing record?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33'
        });
        if (!result.isConfirmed) return;
    } else {
        if (!confirm("Are you sure you want to delete this billing record?")) return;
    }
    try {
        const formData = new FormData();
        formData.append("operation", "deleteBilling");
        formData.append("json", JSON.stringify({ billing_id: billingId }));
        const response = await axios.post(`${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/billing/billing.php`, formData);
        if (response.data === 1 || response.data.success) {
            refreshDisplay();
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Billing deleted',
                showConfirmButton: false,
                timer: 1800
            });
        } else {
            throw new Error();
        }
    } catch {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Failed to delete billing',
            showConfirmButton: false,
            timer: 1800
        });
    }
};

export const getBillingStatuses = async () => {
    const response = await axios.get(`${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/billing/status.php`, {
        params: { operation: "getAllBillingStatuses" }
    });
    return response.data || [];
};

export const updateBillingStatus = async (billingId, billing_status_id) => {
    const formData = new FormData();
    formData.append("operation", "updateBillingStatus");
    formData.append("json", JSON.stringify({ billing_id: billingId, billing_status_id }));
    try {
        const response = await axios.post(
            `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/billing/billing.php`,
            formData
        );
        return response.data === 1 || response.data.success;
    } catch {
        return false;
    }
};
