document.addEventListener('DOMContentLoaded', function () {
    fetch('../../api/admin/billing/billing_history.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.querySelector('#billing-history-table tbody');
                tbody.innerHTML = '';
                data.data.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${row.id}</td>
                        <td>${row.guest_name}</td>
                        <td>${row.amount}</td>
                        <td>${row.status}</td>
                        <td>${row.created_at}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                alert('Error fetching billing history: ' + data.error);
            }
        })
        .catch(err => {
            alert('Network error: ' + err);
        });
});
