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
    tableBody.innerHTML = '';
    if (!history.length) {
        tableBody.innerHTML = `<tr><td colspan="13" class="text-center">No payment history found.</td></tr>`;
        return;
    }
    history.forEach(row => {
        const date = row.changed_at ? new Date(row.changed_at) : null;
        const formattedDate = date && !isNaN(date) ? date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (row.changed_at || '');
        const context = row.reservation_id ? 'Reservation' : (row.billing_id ? 'Billing' : '');
        const guest = `${row.guest_first_name || ''} ${row.guest_middle_name || ''} ${row.guest_last_name || ''}`.replace(/ +/g, ' ').trim();
        const billingTotal = row.billing_total ? `₱${parseFloat(row.billing_total).toFixed(2)}` : '';
        const paymentAmount = row.amount_paid ? `₱${parseFloat(row.amount_paid).toFixed(2)}` : '';
        const moneyGiven = row.money_given ? `₱${parseFloat(row.money_given).toFixed(2)}` : '';
        const changeGiven = row.change_given ? `₱${parseFloat(row.change_given).toFixed(2)}` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="fw-bold">${row.payment_id}</span></td>
            <td><span class="badge bg-primary">${row.username ? row.username : (row.changed_by_user_id || 'N/A')}</span></td>
            <td>${guest}</td>
            <td class="text-success">${paymentAmount}</td>
            <td>${moneyGiven}</td>
            <td>${changeGiven}</td>
            <td>${row.sub_method_name || ''}</td>
            <td>${row.reference_number || ''}</td>
            <td>${row.notes || ''}</td>
            <td><span class="badge bg-info text-dark">${context}</span></td>
            <td>${row.reservation_id ? `<span class='fw-bold'>#${row.reservation_id}</span> ${guest}` : ''}</td>
            <td>${row.billing_id ? `<span class='fw-bold'>#${row.billing_id}</span> ${billingTotal}` : ''}</td>
            <td><span class="text-muted">${formattedDate}</span></td>
        `;
        tableBody.appendChild(tr);
    });
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
