document.addEventListener("DOMContentLoaded", async () => {
    const tbody = document.getElementById("historyTableBody");
    const searchInput = document.getElementById("historySearchInput");
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'd-flex justify-content-center my-3';
    tbody.parentElement.appendChild(paginationContainer);

    let currentPage = 1;
    let totalPages = 1;
    let totalRows = 0;
    const limitPerPage = 10;
    let lastQuery = '';

    // Log current user role using shared auth module
    if (window.adminAuth && typeof window.adminAuth.getUser === 'function') {
        const user = window.adminAuth.getUser();
        if (user && user.role_type) {
            console.log('[AUTH] Current user role:', user.role_type);
        } else {
            console.log('[AUTH] No user role found in session');
        }
    } else {
        console.log('[AUTH] adminAuth not initialized');
    }

    let allHistory = [];

    async function fetchAllStatusHistory(page = 1, query = '') {
        try {
            const params = { operation: "getAllHistory", page, limit: limitPerPage };
            const resp = await axios.get("/Hotel-Reservation-Billing-System/api/admin/reservations/reservation_history.php", { params });
            const result = resp.data;
            allHistory = Array.isArray(result.data) ? result.data : [];
            totalRows = result.total || allHistory.length;
            totalPages = Math.max(1, Math.ceil(totalRows / limitPerPage));
            currentPage = result.page || page;
            renderTable(allHistory);
            renderPagination();
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load reservation history.</td></tr>`;
            paginationContainer.innerHTML = '';
        }
    }

    function renderTable(data) {
        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">No status history found.</td></tr>`;
            return;
        }
        tbody.innerHTML = "";
        data.forEach(row => {
            // Status icon
            let status = (row.reservation_status || '').toLowerCase();
            let statusIcon = '<i class="fas fa-question-circle text-secondary"></i>';
            if (status === 'confirmed') statusIcon = '<i class="fas fa-check-circle text-info"></i>';
            else if (status === 'pending') statusIcon = '<i class="fas fa-hourglass-half text-warning"></i>';
            else if (status === 'checked-in') statusIcon = '<i class="fas fa-door-open text-success"></i>';
            else if (status === 'checked-out') statusIcon = '<i class="fas fa-sign-out-alt text-primary"></i>';
            else if (status === 'cancelled') statusIcon = '<i class="fas fa-times-circle text-danger"></i>';

            // Changed by user icon (admin/front desk distinction)
            let userIcon = '<i class="fas fa-robot me-1 text-muted"></i>';
            if (row.changed_by_username) {
                if ((row.changed_by_role || '').toLowerCase().includes('admin')) {
                    userIcon = '<i class="fas fa-user-shield me-1" style="color:#0d6efd"></i>'; // Admin: shield icon, blue
                } else if ((row.changed_by_role || '').toLowerCase().includes('front')) {
                    userIcon = '<i class="fas fa-user-tie me-1" style="color:#fd7e14"></i>'; // Front desk: tie icon, orange
                } else {
                    userIcon = '<i class="fas fa-user-circle me-1 text-primary"></i>';
                }
            }

            // Format date/time
            let changedAt = row.changed_at ? new Date(row.changed_at) : null;
            let changedAtStr = changedAt ? changedAt.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';

            tbody.innerHTML += `
                <tr>
                    <td>${row.reservation_id || 'N/A'}</td>
                    <td>${row.guest_name || '-'}</td>
                    <td>${statusIcon} ${row.reservation_status || '-'}</td>
                    <td>${changedAtStr}</td>
                    <td>${userIcon} ${row.changed_by_username || '-'}</td>
                    <td>${row.changed_by_role || '-'}</td>
                </tr>
            `;
        });
    }

    function renderPagination() {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        let html = '<nav><ul class="pagination">';
        html += `<li class="page-item${currentPage === 1 ? ' disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">Prev</a></li>`;
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        html += `<li class="page-item${currentPage === totalPages ? ' disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">Next</a></li>`;
        html += '</ul></nav>';
        paginationContainer.innerHTML = html;

        // Add click listeners
        paginationContainer.querySelectorAll('a.page-link').forEach(a => {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                const page = parseInt(this.getAttribute('data-page'));
                if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
                    fetchAllStatusHistory(page);
                }
            });
        });
    }

    // Filter table by search and date (client-side for current page)
    function filterTable() {
        const q = (document.getElementById("historySearchInput")?.value || "").toLowerCase();
        const dateFrom = document.getElementById("dateFrom")?.value;
        const dateTo = document.getElementById("dateTo")?.value;
        let filtered = allHistory;
        if (q) {
            filtered = filtered.filter(r =>
                (r.reservation_id && r.reservation_id.toString().includes(q)) ||
                (r.guest_name && r.guest_name.toLowerCase().includes(q))
            );
        }
        if (dateFrom) {
            filtered = filtered.filter(r => r.changed_at && r.changed_at >= dateFrom);
        }
        if (dateTo) {
            filtered = filtered.filter(r => r.changed_at && r.changed_at <= dateTo + ' 23:59:59');
        }
        renderTable(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterTable);
    }
    document.getElementById("dateFrom")?.addEventListener("change", filterTable);
    document.getElementById("dateTo")?.addEventListener("change", filterTable);

    // Attach search input event (now possibly dynamically created)
    document.addEventListener("input", function (e) {
        if (e.target && e.target.id === "historySearchInput") {
            filterTable();
        }
    });

    await fetchAllStatusHistory();
});
