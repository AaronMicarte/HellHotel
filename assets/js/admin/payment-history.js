// Payment History JS (shared for admin/frontdesk)
import { fetchPaymentHistory } from '../modules/admin/payment-module.js';

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#payment-history-table tbody');
    const history = await fetchPaymentHistory();
    tableBody.innerHTML = '';
    history.forEach(row => {
        const tr = document.createElement('tr');
        // Format date
        const date = row.action_timestamp ? new Date(row.action_timestamp) : null;
        const formattedDate = date && !isNaN(date) ? date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (row.action_timestamp || '');
        tr.innerHTML = `
            <td>${row.payment_id}</td>
            <td>${row.action_type}</td>
            <td>${row.username ? row.username : (row.action_user_id || 'N/A')}</td>
            <td>${formattedDate}</td>
        `;
        tableBody.appendChild(tr);
    });
});
