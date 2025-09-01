import {
    showBillingDetailsModal,
    showPaymentModal,
    recordPayment,
    deleteBilling,
    updateBillingStatus,
    getBillingStatuses
} from '../modules/admin/billing-module.js';

// API Base URL
const BASE_URL = "http://localhost/Hotel-Reservation-Billing-System/api";

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    loadBillings();
    document.getElementById("refreshBtn")?.addEventListener("click", loadBillings);
    document.getElementById("applyFilters")?.addEventListener("click", filterBillings);
    document.getElementById("searchBtn")?.addEventListener("click", searchBillings);
    document.getElementById("addPaymentBtn")?.addEventListener("click", () => showPaymentModal());
    document.getElementById("savePaymentBtn")?.addEventListener("click", async () => {
        if (await recordPayment()) loadBillings();
    });
    document.getElementById("searchBilling")?.addEventListener("keyup", (e) => {
        if (e.key === "Enter") searchBillings();
    });
    // Add event for reservation filter
    document.getElementById("filterByReservationBtn")?.addEventListener("click", () => {
        const reservationId = document.getElementById("reservationIdFilter").value;
        if (reservationId) {
            loadBillingsByReservation(reservationId);
        } else {
            loadBillings();
        }
    });
    // Receipt print logic - FIXED
    const printBtn = document.getElementById("printReceiptBtn");
    if (printBtn) {
        printBtn.addEventListener("click", async () => {
            // Get billing ID from the modal - IMPROVED SELECTOR
            const billingIdElement = document.querySelector("#billingDetailsModal .modal-body table tr:first-child td:nth-child(2)") ||
                document.querySelector("#billingDetailsModal [data-billing-id]") ||
                document.querySelector("#billingDetailsModal .billing-id");

            const billingId = billingIdElement?.textContent?.trim() || billingIdElement?.dataset?.billingId;

            if (!billingId) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Could not find billing ID. Please close and reopen the billing details.",
                    timer: 3000
                });
                return;
            }

            console.log("Fetching receipt for billing ID:", billingId);
            const billing = await getBillingDetailsForReceipt(billingId);

            if (!billing) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Could not fetch billing details for receipt.",
                    timer: 3000
                });
                return;
            }

            // Check if fully paid before allowing receipt print
            const remainingAmount = parseFloat(billing.remaining_amount || 0);
            const billingStatus = (billing.billing_status || "").toLowerCase();

            if (remainingAmount > 0 || billingStatus !== "paid") {
                Swal.fire({
                    icon: "info",
                    title: "Receipt unavailable",
                    text: "Receipt can only be printed after full payment.",
                    timer: 2000,
                    showConfirmButton: false,
                    toast: true,
                    position: "top-end"
                });
                return;
            }

            printReceipt(billing);
        });
    }
});

async function loadBillings() {
    const tbody = document.getElementById("billingTableBody");
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">Loading billing data...</td></tr>`;
    try {
        const response = await axios.get(`${BASE_URL}/admin/billing/billing.php`, {
            params: { operation: 'getAllBillings' }
        });
        console.debug("[Billing] API response:", response.data);
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
            console.warn("[Billing] No billing data returned from API.");
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-warning">No billing records found.</td></tr>`;
            document.getElementById("totalBillings").textContent = "0";
            document.getElementById("paidBillings").textContent = "0";
            document.getElementById("unpaidBillings").textContent = "0";
            document.getElementById("partialBillings").textContent = "0";
            return;
        }
        displayBillings(response.data);
    } catch (err) {
        console.error("[Billing] Error loading billings:", err);
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error loading billings</td></tr>`;
    }
}

function displayBillings(billings) {
    const tbody = document.getElementById("billingTableBody");
    tbody.innerHTML = "";
    console.debug("[Billing] Displaying billings:", billings);
    let paid = 0, unpaid = 0, partial = 0, total = billings.length;
    if (!Array.isArray(billings) || billings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-warning">No billing records found.</td></tr>`;
        document.getElementById("totalBillings").textContent = "0";
        document.getElementById("paidBillings").textContent = "0";
        document.getElementById("unpaidBillings").textContent = "0";
        document.getElementById("partialBillings").textContent = "0";
        return;
    }
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

    billings.forEach(b => {
        if (b.billing_status === "paid") paid++;
        else if (b.billing_status === "unpaid") unpaid++;
        else if (b.billing_status === "partial") partial++;
        // Show all reserved rooms as a comma-separated list of 'type (number)'
        let roomInfo = "-";
        if (Array.isArray(b.rooms) && b.rooms.length > 0) {
            roomInfo = b.rooms.map(r => `${r.type_name} (${r.room_number})`).join(", ");
        }
        const totalBill = b.total_bill !== undefined
            ? parseFloat(b.total_bill)
            : (b.total_amount !== undefined ? parseFloat(b.total_amount) : 0);

        // --- FIX: Disable add payment if remaining_amount <= 0 OR status is paid ---
        let canAddPayment = true;
        if (
            (typeof b.remaining_amount !== "undefined" && b.remaining_amount !== null && parseFloat(b.remaining_amount) <= 0) ||
            (b.billing_status && b.billing_status.toLowerCase() === "paid")
        ) {
            canAddPayment = false;
        }

        // Status color (same as modal)
        let statusColor = '#6c757d';
        if ((b.billing_status || '').toLowerCase() === 'paid') statusColor = '#198754';
        else if ((b.billing_status || '').toLowerCase() === 'unpaid' || (b.billing_status || '').toLowerCase() === 'overdue') statusColor = '#dc3545';
        else if ((b.billing_status || '').toLowerCase() === 'partial') statusColor = '#fd7e14';

        tbody.innerHTML += `
            <tr>
                <td>${b.billing_id || ''}</td>
                <td>${b.guest_name || "-"}</td>
                <td>${b.reservation_id || "-"}</td>
                <td>${formatDate(b.billing_date) || "-"}</td>
                <td>${roomInfo}</td>
                <td>₱${totalBill.toFixed(2)}</td>
                <td>₱${b.amount_paid ? parseFloat(b.amount_paid).toFixed(2) : "0.00"}</td>
                <td>
                    <span style="font-weight:bold;text-transform:uppercase;color:${statusColor}">${b.billing_status || "-"}</span>
                    <i class="fas fa-edit text-primary btn-edit-status" data-billing-id="${b.billing_id}" title="Edit Status" style="cursor:pointer;margin-left:6px;"></i>
                </td>
                <td class="text-center">
                    <i class="fas fa-eye text-info btn-view-billing" data-billing-id="${b.billing_id}" title="View" style="cursor:pointer;margin-right:8px;"></i>
                    <i class="fas fa-money-bill-wave text-success btn-add-payment" data-billing-id="${b.billing_id}" title="Add Payment" style="cursor:pointer;margin-right:8px;${canAddPayment ? '' : 'opacity:0.3;pointer-events:none;'}"></i>
                    <i class="fas fa-trash text-danger btn-delete-billing" data-billing-id="${b.billing_id}" title="Delete" style="cursor:pointer;"></i>
                </td>
            </tr>
        `;
    });
    document.getElementById("totalBillings").textContent = total;
    document.getElementById("paidBillings").textContent = paid;
    document.getElementById("unpaidBillings").textContent = unpaid;
    document.getElementById("partialBillings").textContent = partial;

    // Event binding
    tbody.querySelectorAll('.btn-view-billing').forEach(btn => {
        btn.addEventListener('click', () => {
            console.debug("[Billing] View billing clicked:", btn.dataset.billingId);
            showBillingDetailsModal(btn.dataset.billingId);
        });
    });
    tbody.querySelectorAll('.btn-add-payment').forEach(btn => {
        btn.addEventListener('click', () => {
            console.debug("[Billing] Add payment clicked:", btn.dataset.billingId);
            showPaymentModal(btn.dataset.billingId);
        });
    });
    tbody.querySelectorAll('.btn-delete-billing').forEach(btn => {
        btn.addEventListener('click', () => {
            console.debug("[Billing] Delete billing clicked:", btn.dataset.billingId);
            deleteBilling(btn.dataset.billingId, loadBillings);
        });
    });
    tbody.querySelectorAll('.btn-edit-status').forEach(btn => {
        btn.addEventListener('click', async () => {
            const billingId = btn.dataset.billingId;
            await showEditStatusModal(billingId);
        });
    });
}

function getStatusColor(status) {
    const map = {
        "paid": "success",
        "unpaid": "danger",
        "partial": "warning",
        "overdue": "danger"
    };
    return map[status] || "secondary";
}

async function filterBillings() {
    const status = document.getElementById("statusFilter").value;
    const dateFrom = document.getElementById("dateFrom").value;
    const dateTo = document.getElementById("dateTo").value;
    let params = [];
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    if (dateFrom) params.push(`date_from=${encodeURIComponent(dateFrom)}`);
    if (dateTo) params.push(`date_to=${encodeURIComponent(dateTo)}`);
    let url = `${BASE_URL}/admin/billing/billing.php`;
    if (params.length) url += "?" + params.join("&");
    try {
        const response = await axios.get(url);
        displayBillings(response.data || []);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: `Filtered ${response.data.length} billing${response.data.length === 1 ? '' : 's'}`,
            showConfirmButton: false,
            timer: 1800
        });
    } catch {
        displayBillings([]);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'No billings found',
            showConfirmButton: false,
            timer: 1800
        });
    }
}

async function searchBillings() {
    const searchTerm = document.getElementById("searchBilling").value.trim();
    if (!searchTerm) {
        await loadBillings();
        return;
    }
    try {
        const response = await axios.get(`${BASE_URL}/admin/billing/billing.php?search=${encodeURIComponent(searchTerm)}`);
        displayBillings(response.data || []);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: `Found ${response.data.length} billing${response.data.length === 1 ? '' : 's'}`,
            showConfirmButton: false,
            timer: 1800
        });
    } catch {
        displayBillings([]);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'No billings found',
            showConfirmButton: false,
            timer: 1800
        });
    }
}

// Load billings for a specific reservation
export async function loadBillingsByReservation(reservationId) {
    const tbody = document.getElementById("billingTableBody");
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">Loading billing data...</td></tr>`;
    try {
        const response = await axios.get(`${BASE_URL}/admin/billing/billing.php`, {
            params: { operation: 'getBillingByReservation', json: JSON.stringify({ reservation_id: reservationId }) }
        });
        // The API returns a single billing object, so wrap in array for display
        let billings = [];
        if (response.data && typeof response.data === "object" && !Array.isArray(response.data) && Object.keys(response.data).length > 0) {
            billings = [response.data];
        }
        displayBillings(billings);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Error loading billings</td></tr>`;
    }
}

// --- Edit Billing Status Modal ---
async function showEditStatusModal(billingId) {
    const statuses = await getBillingStatuses();
    const { value: statusId } = await Swal.fire({
        title: 'Update Billing Status',
        input: 'select',
        inputOptions: statuses.reduce((acc, s) => {
            acc[s.billing_status_id] = s.billing_status;
            return acc;
        }, {}),
        inputPlaceholder: 'Select status',
        showCancelButton: true,
        confirmButtonText: 'Update',
        inputValidator: (value) => {
            if (!value) return 'Please select a status';
        }
    });
    if (statusId) {
        const result = await updateBillingStatus(billingId, statusId);
        if (result) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Billing status updated!',
                showConfirmButton: false,
                timer: 1800
            });
            loadBillings();
        } else {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Failed to update status',
                showConfirmButton: false,
                timer: 1800
            });
        }
    }
}

// FIXED: Helper to fetch billing details for receipt with comprehensive data
async function getBillingDetailsForReceipt(billingId) {
    try {
        console.log("Fetching billing details for ID:", billingId);

        // Try multiple API endpoints to get complete data
        let billing = null;

        // Method 1: Try the same endpoint as billing details modal
        try {
            const response = await axios.get(`${BASE_URL}/admin/billing/billing.php`, {
                params: {
                    operation: 'getBillingDetails',
                    billing_id: billingId
                }
            });
            billing = response.data;
            console.log("Method 1 response:", billing);
        } catch (e) {
            console.log("Method 1 failed:", e.message);
        }

        // Method 2: Try with just billing_id parameter
        if (!billing || Object.keys(billing).length === 0) {
            try {
                const response = await axios.get(`${BASE_URL}/admin/billing/billing.php`, {
                    params: { billing_id: billingId }
                });
                billing = response.data;
                console.log("Method 2 response:", billing);
            } catch (e) {
                console.log("Method 2 failed:", e.message);
            }
        }

        // Method 3: Try with getAllBillings and filter
        if (!billing || Object.keys(billing).length === 0) {
            try {
                const response = await axios.get(`${BASE_URL}/admin/billing/billing.php`, {
                    params: { operation: 'getAllBillings' }
                });
                if (Array.isArray(response.data)) {
                    billing = response.data.find(b => b.billing_id == billingId);
                }
                console.log("Method 3 response:", billing);
            } catch (e) {
                console.log("Method 3 failed:", e.message);
            }
        }

        // Handle array response
        if (Array.isArray(billing) && billing.length > 0) {
            billing = billing[0];
        }

        if (!billing || Object.keys(billing).length === 0) {
            console.error("No billing data found for ID:", billingId);
            return null;
        }

        // Fetch additional details if needed (addons and payments)
        try {
            // Get addons
            const addonsResponse = await axios.get(`${BASE_URL}/admin/billing/billing.php`, {
                params: {
                    operation: 'getBillingAddons',
                    billing_id: billingId
                }
            });
            billing.addons = Array.isArray(addonsResponse.data) ? addonsResponse.data : [];
        } catch (e) {
            console.log("Could not fetch addons:", e.message);
            billing.addons = [];
        }

        try {
            // Get payments
            const paymentsResponse = await axios.get(`${BASE_URL}/admin/billing/billing.php`, {
                params: {
                    operation: 'getBillingPayments',
                    billing_id: billingId
                }
            });
            billing.payments = Array.isArray(paymentsResponse.data) ? paymentsResponse.data : [];
        } catch (e) {
            console.log("Could not fetch payments:", e.message);
            billing.payments = [];
        }

        console.log("Final billing data:", billing);
        return billing;

    } catch (error) {
        console.error("Error fetching billing details for receipt:", error);
        return null;
    }
}

// FIXED: Print receipt function with better data handling and fallbacks
function printReceipt(billing) {
    console.log("Printing receipt with data:", billing);

    // Enhanced safe function with more validation
    const safe = (val, fallback = "-") => {
        if (val === undefined || val === null || val === "" || val === "undefined" || val === "null") {
            return fallback;
        }
        if (typeof val === "string" && (val.toLowerCase() === "nan" || val.trim() === "")) {
            return fallback;
        }
        return val;
    };

    // Enhanced numeric safe function
    const safeNum = (val, fallback = 0) => {
        if (val === undefined || val === null || val === "" || val === "undefined" || val === "null") {
            return fallback;
        }
        const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return isNaN(num) ? fallback : num;
    };

    // Extract data with multiple fallback field names
    const billingId = safe(billing.billing_id || billing.id);
    const guestName = safe(billing.guest_name || billing.customer_name || billing.name);
    const reservationId = safe(billing.reservation_id || billing.res_id);
    const billingDate = safe(billing.billing_date || billing.date || billing.created_at);
    const roomType = safe(billing.type_name || billing.room_type || billing.room_type_name);
    const roomNumber = safe(billing.room_number || billing.room_no);

    // Handle different field names for amounts
    const roomPrice = safeNum(billing.room_price || billing.room_cost || billing.room_rate);
    const totalBill = safeNum(billing.total_bill || billing.total_amount || billing.total);
    const amountPaid = safeNum(billing.amount_paid || billing.paid_amount || billing.total_paid);
    const remainingAmount = safeNum(billing.remaining_amount || billing.balance || (totalBill - amountPaid));
    const billingStatus = safe(billing.billing_status || billing.status);

    // Handle addons and payments arrays
    const addons = Array.isArray(billing.addons) ? billing.addons : [];
    const payments = Array.isArray(billing.payments) ? billing.payments : [];

    // Calculate addon total for verification
    const addonTotal = addons.reduce((sum, addon) => {
        return sum + safeNum(addon.subtotal || (safeNum(addon.price) * safeNum(addon.quantity)));
    }, 0);

    // Verify total bill calculation
    const calculatedTotal = roomPrice + addonTotal;
    const finalTotal = totalBill > 0 ? totalBill : calculatedTotal;

    console.log("Receipt calculation:", {
        roomPrice,
        addonTotal,
        calculatedTotal,
        finalTotal,
        amountPaid,
        remainingAmount
    });

    // Build room info string
    const roomInfo = roomType !== "-" && roomNumber !== "-"
        ? `${roomType} (Room ${roomNumber})`
        : roomType !== "-"
            ? roomType
            : roomNumber !== "-"
                ? `Room ${roomNumber}`
                : "Standard Room";

    // Compose HTML for receipt
    const html = `
        <html>
        <head>
            <title>Payment Receipt - ${billingId}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 40px;
                    line-height: 1.4;
                }
                h2 { 
                    text-align: center; 
                    color: #333;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                }
                .header-table {
                    width: 100%;
                    margin: 20px 0;
                    border-collapse: collapse;
                }
                .header-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid #eee;
                }
                .header-table td:first-child {
                    font-weight: bold;
                    width: 150px;
                }
                .receipt-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px; 
                }
                .receipt-table th, .receipt-table td { 
                    border: 1px solid #ddd; 
                    padding: 10px 8px; 
                    text-align: left;
                }
                .receipt-table th { 
                    background: #f8f9fa; 
                    font-weight: bold;
                }
                .totals { 
                    margin-top: 20px; 
                    border-collapse: collapse;
                    width: 100%;
                }
                .totals td { 
                    padding: 8px 12px; 
                    border-bottom: 1px solid #eee;
                }
                .totals td:first-child {
                    font-weight: bold;
                    width: 150px;
                }
                .text-end { text-align: right; }
                .text-center { text-align: center; }
                .total-row {
                    background: #f8f9fa;
                    font-weight: bold;
                    border-top: 2px solid #333 !important;
                }
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    border-top: 1px solid #ccc;
                    padding-top: 20px;
                }
                @media print {
                    body { margin: 20px; }
                }
            </style>
        </head>
        <body>
            <h2>HellHotel Payment Receipt</h2>
            
            <table class="header-table">
                <tr><td>Billing ID:</td><td>${billingId}</td></tr>
                <tr><td>Guest Name:</td><td>${guestName}</td></tr>
                <tr><td>Reservation ID:</td><td>${reservationId}</td></tr>
                <tr><td>Room:</td><td>${roomInfo}</td></tr>
                <tr><td>Billing Date:</td><td>${billingDate}</td></tr>
                <tr><td>Status:</td><td><span style="text-transform:uppercase;font-weight:bold;">${billingStatus}</span></td></tr>
            </table>

            <h3>Charges Breakdown</h3>
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="width:80px;" class="text-end">Qty</th>
                        <th style="width:100px;" class="text-end">Unit Price</th>
                        <th style="width:100px;" class="text-end">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Room Charge (${roomType})</td>
                        <td class="text-end">1</td>
                        <td class="text-end">₱${roomPrice.toFixed(2)}</td>
                        <td class="text-end">₱${roomPrice.toFixed(2)}</td>
                    </tr>
                    ${addons.length > 0 ? addons.map(addon => {
        const addonName = safe(addon.addon_name || addon.name, "Addon");
        const addonQty = safeNum(addon.quantity, 1);
        const addonPrice = safeNum(addon.price || addon.unit_price);
        const addonSubtotal = safeNum(addon.subtotal || (addonPrice * addonQty));
        return `
                        <tr>
                            <td>Add-on: ${addonName}</td>
                            <td class="text-end">${addonQty}</td>
                            <td class="text-end">₱${addonPrice.toFixed(2)}</td>
                            <td class="text-end">₱${addonSubtotal.toFixed(2)}</td>
                        </tr>
                        `;
    }).join('') : ''}
                    <tr class="total-row">
                        <td colspan="3"><strong>TOTAL AMOUNT</strong></td>
                        <td class="text-end"><strong>₱${finalTotal.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>

            <h3>Payment History</h3>
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Payment Date</th>
                        <th>Payment Method</th>
                        <th class="text-end">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments.length > 0 ? payments.map(payment => {
        const paymentDate = safe(payment.payment_date || payment.date);
        const paymentMethod = safe(payment.method_name || payment.payment_method || payment.method, "Cash");
        const paymentAmount = safeNum(payment.amount_paid || payment.amount);
        return `
                        <tr>
                            <td>${paymentDate}</td>
                            <td>${paymentMethod}</td>
                            <td class="text-end">₱${paymentAmount.toFixed(2)}</td>
                        </tr>
                        `;
    }).join('') : `
                        <tr>
                            <td colspan="3" class="text-center">No payment records found</td>
                        </tr>
                    `}
                    ${amountPaid > 0 && payments.length === 0 ? `
                        <tr>
                            <td>${billingDate}</td>
                            <td>Payment</td>
                            <td class="text-end">₱${amountPaid.toFixed(2)}</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>

            <table class="totals">
                <tr>
                    <td>Total Bill Amount:</td>
                    <td class="text-end">₱${finalTotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Total Amount Paid:</td>
                    <td class="text-end">₱${amountPaid.toFixed(2)}</td>
                </tr>
                <tr style="border-bottom: 2px solid #333;">
                    <td><strong>Remaining Balance:</strong></td>
                    <td class="text-end"><strong>₱${Math.max(0, remainingAmount).toFixed(2)}</strong></td>
                </tr>
            </table>

            <div class="footer">
                <strong>Thank you for choosing HellHotel!</strong><br>
                <small>Receipt generated on ${new Date().toLocaleString()}</small>
            </div>

            <script>
                window.onload = function() {
                    // Small delay to ensure content is fully rendered
                    setTimeout(() => {
                        window.print();
                        // Close window after printing (optional)
                        setTimeout(() => {
                            if (window.opener) {
                                window.close();
                            }
                        }, 1000);
                    }, 500);
                };
            </script>
        </body>
        </html>
    `;

    // Open print window and inject HTML
    const printWindow = window.open('', '_blank', 'width=800,height=1000,scrollbars=yes,resizable=yes');
    if (!printWindow) {
        Swal.fire({
            icon: 'error',
            title: 'Print Error',
            text: 'Could not open print window. Please check if pop-ups are blocked.',
        });
        return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
}