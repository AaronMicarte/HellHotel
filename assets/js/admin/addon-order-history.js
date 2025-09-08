document.addEventListener("DOMContentLoaded", async () => {
    // Get current user role (try shared auth module, fallback to window)
    let currentUserRole = null;
    if (window.adminAuth && typeof window.adminAuth.getUser === 'function') {
        const user = window.adminAuth.getUser();
        if (user && user.role_type) currentUserRole = user.role_type.toLowerCase();
    } else if (window.CURRENT_USER_ROLE) {
        currentUserRole = window.CURRENT_USER_ROLE.toLowerCase();
    }
    const tbody = document.getElementById("historyTableBody");
    const searchInput = document.getElementById("historySearchInput");

    let allHistory = [];

    async function fetchAllStatusHistory() {
        try {
            const resp = await axios.get("/Hotel-Reservation-Billing-System/api/admin/addons/order_status.php", {
                params: { operation: "getAllAddonOrderStatusHistory" }
            });
            allHistory = Array.isArray(resp.data) ? resp.data : [];
            renderTable(allHistory);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Failed to load status history.</td></tr>`;
        }
    }

    function renderTable(data) {
        let filteredData = data;
        if (currentUserRole && currentUserRole.includes('frontdesk')) {
            filteredData = data.filter(row => (row.changed_by_role || '').toLowerCase().includes('frontdesk'));
        }
        if (!filteredData.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center">No audit history found.</td></tr>`;
            return;
        }
        tbody.innerHTML = "";
        filteredData.forEach(row => {
            // Hotel-appropriate status icons
            let status = (row.order_status_name || '').toLowerCase();
            let icon = '<i class="fas fa-question-circle text-secondary"></i>';
            let label = status.charAt(0).toUpperCase() + status.slice(1);
            if (status === 'pending') icon = '<i class="fas fa-hourglass-half" style="color:#ffc107"></i>'; // Yellow
            else if (status === 'confirmed') icon = '<i class="fas fa-check-circle" style="color:#28a745"></i>'; // Green
            else if (status === 'preparing') icon = '<i class="fas fa-utensils" style="color:#6f42c1"></i>'; // Purple
            else if (status === 'ready') icon = '<i class="fas fa-bell" style="color:#17a2b8"></i>'; // Teal
            else if (status === 'delivered') icon = '<i class="fas fa-concierge-bell" style="color:#28a745"></i>'; // Green
            else if (status === 'completed') icon = '<i class="fas fa-check-circle" style="color:#28a745"></i>'; // Green
            else if (status === 'cancelled') icon = '<i class="fas fa-times-circle" style="color:#dc3545"></i>'; // Red
            let statusIcon = `${icon} <span class=\"ms-1\">${label}</span>`;


            // Changed by user icon (different for admin/front desk)
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
                    <td>${row.addon_order_id || 'N/A'}</td>
                    <td>${row.reservation_id || '-'}</td>
                    <td>${row.guest_name || '-'}</td>
                    <td>${statusIcon}</td>
                    <td>${changedAtStr}</td>
                    <td>${userIcon} ${row.changed_by_username || '-'}</td>
                    <td>${row.changed_by_role || '-'}</td>
                </tr>
            `;
        });
    }

    // Filter table by search and date
    function filterTable() {
        const q = (document.getElementById("historySearchInput")?.value || "").toLowerCase();
        const dateFrom = document.getElementById("dateFrom")?.value;
        const dateTo = document.getElementById("dateTo")?.value;
        let filtered = allHistory;
        if (q) {
            filtered = filtered.filter(r =>
                (r.addon_order_id && r.addon_order_id.toString().includes(q)) ||
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
