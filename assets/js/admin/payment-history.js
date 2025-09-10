// Payment History JS (shared for admin/frontdesk)
import { fetchPaymentHistory } from '../modules/admin/payment-module.js';

let currentPage = 1;
const limit = 10;

function getCurrentUserRole() {
    if (window.adminAuth && typeof window.adminAuth.getUser === 'function') {
        const user = window.adminAuth.getUser();
        if (user && user.role_type) return user.role_type;
    }
    return 'frontdesk';
}

function getCurrentUserId() {
    if (window.adminAuth && typeof window.adminAuth.getUser === 'function') {
        const user = window.adminAuth.getUser();
        if (user && user.user_id) return user.user_id;
    }
    return null;
}

async function loadPaymentHistory(page = 1) {
    const tableBody = document.getElementById('paymentHistoryTableBody') || document.querySelector('#payment-history-table tbody');
    const search = document.getElementById('paymentHistorySearchInput')?.value || '';
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';
    const role = getCurrentUserRole();
    const user_id = getCurrentUserId();
    const historyRaw = await fetchPaymentHistory({ role, page, limit, search, dateFrom, dateTo, user_id });
    const history = Array.isArray(historyRaw) ? historyRaw : [];
    // Filtering logic
    let filtered = history;
    const searchLower = search.toLowerCase();
    if (searchLower) {
        filtered = filtered.filter(row =>
            (row.payment_id && row.payment_id.toString().includes(searchLower)) ||
            (row.guest_first_name && row.guest_first_name.toLowerCase().includes(searchLower)) ||
            (row.guest_last_name && row.guest_last_name.toLowerCase().includes(searchLower)) ||
            (row.username && row.username.toLowerCase().includes(searchLower)) ||
            (row.billing_id && row.billing_id.toString().includes(searchLower)) ||
            (row.reservation_id && row.reservation_id.toString().includes(searchLower)) ||
            (row.billing_status && row.billing_status.toLowerCase().includes(searchLower))
        );
    }
    // Date filter validation: start cannot be after end
    if (dateFrom && dateTo) {
        if (dateFrom > dateTo) {
            document.getElementById('dateFrom').value = dateTo;
            alert('Start date cannot be after end date. Adjusted automatically.');
        }
    }
    if (dateFrom) {
        filtered = filtered.filter(row => row.changed_at && row.changed_at >= dateFrom);
    }
    if (dateTo) {
        filtered = filtered.filter(row => row.changed_at && row.changed_at <= dateTo + ' 23:59:59');
    }
    tableBody.innerHTML = '';
    if (!filtered.length) {
        tableBody.innerHTML = `<tr><td colspan="13" class="text-center">No payment history found.</td></tr>`;
        return;
    }
    filtered.forEach(row => {
        const date = row.changed_at ? new Date(row.changed_at) : null;
        const formattedDate = date && !isNaN(date) ? date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (row.changed_at || '');
        const guest = `${row.guest_first_name || ''} ${row.guest_middle_name || ''} ${row.guest_last_name || ''}`.replace(/ +/g, ' ').trim();
        const billingTotal = row.billing_total ? `₱${parseFloat(row.billing_total).toFixed(2)}` : '';
        const paymentAmount = row.amount_paid ? `₱${parseFloat(row.amount_paid).toFixed(2)}` : '';
        const moneyGiven = row.money_given ? `₱${parseFloat(row.money_given).toFixed(2)}` : '';
        const changeGiven = row.change_given ? `₱${parseFloat(row.change_given).toFixed(2)}` : '';
        const amounts = `<span class='text-success'>Amount:${paymentAmount}</span><br><span class='text-secondary'>Given: ${moneyGiven}</span><br><span class='text-warning'>Change: ${changeGiven}</span>`;
        const ref = row.reference_number || '';
        let reservationBilling = '';
        if (row.reservation_id && row.billing_id) {
            reservationBilling = `<span class='fw-bold'>#${row.reservation_id}</span> / <span class='fw-bold'>#${row.billing_id}</span>`;
        } else if (row.reservation_id) {
            reservationBilling = `<span class='fw-bold'>#${row.reservation_id}</span>`;
        } else if (row.billing_id) {
            reservationBilling = `<span class='fw-bold'>#${row.billing_id}</span>`;
        }
        const notes = row.notes ? row.notes : '';
        // Payment status (from billing_status or similar)
        let status = row.billing_status || row.payment_status || '';
        let statusIcon = '<i class="fas fa-question-circle text-secondary"></i>';
        if (status.toLowerCase() === 'paid') statusIcon = '<i class="fas fa-check-circle text-success"></i>';
        else if (status.toLowerCase() === 'partial') statusIcon = '<i class="fas fa-hourglass-half text-warning"></i>';
        else if (status.toLowerCase() === 'unpaid') statusIcon = '<i class="fas fa-times-circle text-danger"></i>';
        else if (status.toLowerCase() === 'overdue') statusIcon = '<i class="fas fa-exclamation-circle text-danger"></i>';
        // Changed By (username + role + icon)
        let userIcon = '<i class="fas fa-robot me-1 text-muted"></i>';
        if (row.username) {
            if ((row.user_role || '').toLowerCase().includes('admin')) {
                userIcon = '<i class="fas fa-user-shield me-1" style="color:#0d6efd"></i>';
            } else if ((row.user_role || '').toLowerCase().includes('front')) {
                userIcon = '<i class="fas fa-user-tie me-1" style="color:#fd7e14"></i>';
            } else {
                userIcon = '<i class="fas fa-user-circle me-1 text-primary"></i>';
            }
        }
        const changedBy = row.username ? `${userIcon} <span class='fw-bold'>${row.username}</span> | <span>${row.user_role || ''}</span>` : (row.changed_by_user_id || 'N/A');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="fw-bold">${row.payment_id}</span></td>
            <td>${guest}</td>
            <!-- <td>${statusIcon} ${status}</td> --!>
            <td>${amounts}</td>
            <td>${row.sub_method_name || ''}</td>
            <td>${ref}</td>
            <td>${reservationBilling}</td>
            <td><span class="text-muted">${formattedDate}</span></td>
            <td>${changedBy}</td>
            <td>${notes}</td>
        `;
        tableBody.appendChild(tr);
    });
    // ...existing code...
    renderPagination(page);
}

function renderPagination(page) {
    const paginationContainer = document.getElementById('paymentHistoryPagination');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = `
        <nav aria-label="Payment history pagination">
            <ul class="pagination justify-content-center">
                <li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" id="prevPage">Previous</a></li>
                <li class="page-item"><span class="page-link">Page ${page}</span></li>
                <li class="page-item"><a class="page-link" href="#" id="nextPage">Next</a></li>
            </ul>
        </nav>
    `;
    document.getElementById('prevPage').onclick = (e) => { e.preventDefault(); if (page > 1) { currentPage--; loadPaymentHistory(currentPage); } };
    document.getElementById('nextPage').onclick = (e) => { e.preventDefault(); currentPage++; loadPaymentHistory(currentPage); };
}

document.addEventListener('DOMContentLoaded', () => {
    loadPaymentHistory(currentPage);
    // Search and filter events
    document.getElementById('paymentHistorySearchInput')?.addEventListener('input', () => loadPaymentHistory(1));
    document.getElementById('dateFrom')?.addEventListener('change', () => loadPaymentHistory(1));
    document.getElementById('dateTo')?.addEventListener('change', () => loadPaymentHistory(1));
});
