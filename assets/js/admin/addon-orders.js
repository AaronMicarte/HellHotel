import { deleteOrder, editOrder } from '../modules/admin/addon-order-module.js';


if (typeof BASE_URL === 'undefined') {
    var BASE_URL = "/Hotel-Reservation-Billing-System/api/admin";
}

document.addEventListener("DOMContentLoaded", () => {
    // Fetch user info from session via AJAX
    fetchCurrentUser().then(user => {
        window.CURRENT_USER_ID = user && user.user_id ? user.user_id : null;
        window.CURRENT_USER_ROLE = user && user.role_type ? user.role_type : null;
        console.log('CURRENT_USER_ID:', window.CURRENT_USER_ID);
        console.log('CURRENT_USER_ROLE:', window.CURRENT_USER_ROLE);
        loadOrderStatuses();
        loadAddonOrders();
        loadAddonCategories();
    });
    document.getElementById("newOrderBtn").addEventListener("click", showNewOrderModal);
    document.getElementById("orderStatusFilter").addEventListener("change", loadAddonOrders);
    document.getElementById("orderSearchInput").addEventListener("input", loadAddonOrders);
    // Category click event (delegated)
    document.getElementById("addonCategorySidebar").addEventListener("click", function (e) {
        if (e.target.classList.contains("addon-category-item")) {
            document.querySelectorAll(".addon-category-item").forEach(el => el.classList.remove("active"));
            e.target.classList.add("active");
            renderPOS(e.target.dataset.categoryId);
        }
    });
});

async function fetchCurrentUser() {
    try {
        // Get token from localStorage or cookie (adjust as needed)
        let token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
        if (!token) {
            // Try to get from cookie (if used)
            const match = document.cookie.match(/admin_token=([^;]+)/);
            if (match) token = match[1];
        }
        if (!token) {
            Swal && Swal.fire('Session Error', 'No admin token found. Please log in again.', 'error');
            return null;
        }
        const res = await axios.get('/Hotel-Reservation-Billing-System/api/auth/check-session.php', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.data && res.data.success && res.data.user) {
            return res.data.user;
        } else {
            Swal && Swal.fire('Session Error', 'Session invalid or expired. Please log in again.', 'error');
            return null;
        }
    } catch (e) {
        Swal && Swal.fire('Session Error', 'Failed to fetch user info. Please log in again.', 'error');
        return null;
    }
}
// Load categories for sidebar
async function loadAddonCategories() {
    const sidebar = document.getElementById("addonCategorySidebar");
    sidebar.innerHTML = '<div class="text-center py-2">Loading...</div>';
    try {
        const res = await axios.get(`${BASE_URL}/addons/categories.php`, { params: { operation: "getAllCategories" } });
        const cats = res.data && res.data.status === 'success' && Array.isArray(res.data.data) ? res.data.data : [];
        if (!cats.length) {
            sidebar.innerHTML = '<div class="text-center py-2">No categories</div>';
            return;
        }
        let html = '<ul class="list-group list-group-flush">';
        html += `<li class="list-group-item addon-category-item active" data-category-id="">All</li>`;
        cats.forEach(cat => {
            html += `<li class="list-group-item addon-category-item" data-category-id="${cat.category_id}">${cat.category_name}</li>`;
        });
        html += '</ul>';
        sidebar.innerHTML = html;
    } catch {
        sidebar.innerHTML = '<div class="text-danger py-2">Failed to load categories</div>';
    }
}

async function loadOrderStatuses() {
    const select = document.getElementById("orderStatusFilter");
    // Clear all options
    while (select.firstChild) {
        select.removeChild(select.firstChild);
    }
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'All Statuses';
    select.appendChild(defaultOption);
    try {
        const res = await axios.get(`${BASE_URL}/addons/order_status.php`, { params: { operation: "getAllOrderStatuses" } });
        if (Array.isArray(res.data)) {
            const seen = new Set();
            res.data.forEach(s => {
                // Only add if not already seen, not empty/null, and not just whitespace
                const name = (s.order_status_name || '').trim();
                if (name && !seen.has(name)) {
                    seen.add(name);
                    const opt = document.createElement('option');
                    opt.value = name;
                    opt.textContent = name.charAt(0).toUpperCase() + name.slice(1);
                    select.appendChild(opt);
                }
            });
            // Debug: log all dropdown options after population
            const optionValues = Array.from(select.options).map(opt => opt.value);
            console.log('Order Status Filter Options:', optionValues);
        }
    } catch (e) { /* Optionally log error: console.error(e); */ }
}

async function loadAddonOrders() {
    const tbody = document.getElementById("addonOrdersTableBody");
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';
    let status = document.getElementById("orderStatusFilter").value;
    let search = document.getElementById("orderSearchInput").value.trim();
    try {
        // Send both search and status to backend for filtering
        const res = await axios.get(`${BASE_URL}/addons/order.php`, { params: { operation: "getAllOrders", search, status } });
        let orders = Array.isArray(res.data) ? res.data : [];
        if (!orders.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        orders.forEach(order => {
            tbody.innerHTML += renderOrderRow(order);
        });
    } catch {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load orders.</td></tr>';
    }
    // Attach event delegation for action icons and view order
    tbody.addEventListener('click', async function (e) {
        // View Order button
        if (e.target.classList.contains('view-order-btn')) {
            const orderId = e.target.getAttribute('data-id');
            viewOrder(orderId);
            return;
        }
        // Status/cancel/delete icons
        if (e.target.classList.contains('action-icon')) {
            const action = e.target.getAttribute('data-action');
            const orderId = e.target.getAttribute('data-id');
            if (action === 'edit') {
                openEditOrderModal(orderId);
                return;
            }
            if (action.startsWith('status-')) {
                const nextStatus = action.replace('status-', '');
                let confirmText = `Change status to '${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}'?`;
                if (window.Swal) {
                    const result = await Swal.fire({
                        title: 'Change Order Status',
                        text: confirmText,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, change it',
                        cancelButtonText: 'Cancel'
                    });
                    if (!result.isConfirmed) return;
                } else {
                    if (!confirm(confirmText)) return;
                }
                try {
                    const formData = new FormData();
                    formData.append('operation', 'updateOrderStatus');
                    const payload = { addon_order_id: orderId, next_status: nextStatus };
                    if (window.CURRENT_USER_ID) payload.changed_by_user_id = window.CURRENT_USER_ID;
                    formData.append('json', JSON.stringify(payload));
                    const res = await axios.post(`${BASE_URL}/addons/order_status.php`, formData);
                    if (res.data && (res.data.success || res.data === 1)) {
                        if (window.Swal) Swal.fire('Success', 'Order status updated.', 'success');
                        loadAddonOrders();
                    } else {
                        if (window.Swal) Swal.fire('Error', 'Failed to update status.', 'error');
                    }
                } catch (err) {
                    if (window.Swal) Swal.fire('Error', 'Failed to update status.', 'error');
                }
            } else if (action === 'cancel') {
                let confirmText = 'Are you sure you want to cancel this order?';
                if (window.Swal) {
                    const result = await Swal.fire({
                        title: 'Cancel Order',
                        text: confirmText,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, cancel it',
                        cancelButtonText: 'No'
                    });
                    if (!result.isConfirmed) return;
                } else {
                    if (!confirm(confirmText)) return;
                }
                try {
                    const formData = new FormData();
                    formData.append('operation', 'updateOrderStatus');
                    const payload = { addon_order_id: orderId, next_status: 'cancelled' };
                    if (window.CURRENT_USER_ID) payload.changed_by_user_id = window.CURRENT_USER_ID;
                    formData.append('json', JSON.stringify(payload));
                    const res = await axios.post(`${BASE_URL}/addons/order_status.php`, formData);
                    if (res.data && (res.data.success || res.data === 1)) {
                        if (window.Swal) Swal.fire('Success', 'Order cancelled.', 'success');
                        loadAddonOrders();
                    } else {
                        if (window.Swal) Swal.fire('Error', 'Failed to cancel order.', 'error');
                    }
                } catch (err) {
                    if (window.Swal) Swal.fire('Error', 'Failed to cancel order.', 'error');
                }
            } else if (action === 'delete') {
                let confirmText = 'Are you sure you want to permanently delete this order? This cannot be undone.';
                if (window.Swal) {
                    const result = await Swal.fire({
                        title: 'Delete Order',
                        text: confirmText,
                        icon: 'error',
                        showCancelButton: true,
                        confirmButtonText: 'Yes, delete it',
                        cancelButtonText: 'No'
                    });
                    if (!result.isConfirmed) return;
                } else {
                    if (!confirm(confirmText)) return;
                }
                const result = await deleteOrder(orderId);
                if (result.success) {
                    if (window.Swal) Swal.fire('Success', 'Order deleted.', 'success');
                    loadAddonOrders();
                } else {
                    if (window.Swal) Swal.fire('Error', result.message || 'Failed to delete order.', 'error');
                }
            }
        }
    });
}

function renderOrderRow(order) {
    let statusIcon = getOrderStatusIcon(order.order_status_name);
    let guestName = (order.first_name || order.last_name) ? `${order.first_name || ''} ${order.last_name || ''}`.trim() : '-';
    // Format date as 'M d, Y h:i A' in Asia/Manila timezone
    let dateStr = '-';
    if (order.order_date) {
        let d;
        if (order.order_date.length > 10) {
            // Has time part
            d = new Date(order.order_date.replace(' ', 'T'));
        } else {
            // Only date part
            d = new Date(order.order_date + 'T00:00:00');
        }
        if (!isNaN(d)) {
            // Optionally adjust for Asia/Manila if needed
            // d = new Date(d.getTime() + 8 * 60 * 60 * 1000); // Only if UTC
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
            dateStr = d.toLocaleString('en-US', options).replace(',', '');
        } else {
            dateStr = order.order_date;
        }
    }
    // Add only the next status action icon
    let statusFlowIcons = renderStatusFlowIcons(order);
    let actionIcons = renderActionIcons(order);
    return `<tr>
        <td>${order.addon_order_id}</td>
        <td>${guestName}</td>
        <!--  <td>${order.reservation_id || '-'}</td> --!>
        <td>${statusIcon}</td>
        <td>${dateStr}</td>
        <td>${statusFlowIcons}</td>
        <td>${actionIcons}</td>
    </tr>`;
    // Helper: Render only status flow icons (status changes)
    function renderStatusFlowIcons(order) {
        const status = (order.order_status_name || '').toLowerCase();
        const id = order.addon_order_id;
        let icons = [];
        if (status === 'pending') {
            icons.push(`<i class="fas fa-utensils action-icon" style="cursor:pointer; color:#6f42c1; margin-right:8px;" title="Mark as Preparing" data-action="status-preparing" data-id="${id}"></i>`);
        } else if (status === 'preparing') {
            icons.push(`<i class="fas fa-bell action-icon" style="cursor:pointer; color:#17a2b8; margin-right:8px;" title="Mark as Ready" data-action="status-ready" data-id="${id}"></i>`);
        } else if (status === 'ready') {
            icons.push(`<i class="fas fa-concierge-bell action-icon" style="cursor:pointer; color:#28a745; margin-right:8px;" title="Mark as Delivered" data-action="status-delivered" data-id="${id}"></i>`);
        }
        // Cancel icon (if not already cancelled or delivered)
        if (status !== 'cancelled' && status !== 'delivered') {
            icons.push(`<i class="fas fa-times-circle action-icon" style="cursor:pointer; color:#dc3545;" title="Cancel Order" data-action="cancel" data-id="${id}"></i>`);
        }
        return icons.join(' ');
    }

    // Helper: Render only non-status actions (view, edit, delete, cancel)
    function renderActionIcons(order) {
        const status = (order.order_status_name || '').toLowerCase();
        const id = order.addon_order_id;
        let actions = [];
        // View icon (always)
        actions.push(`<i class='fas fa-eye text-info view-order-btn' style='cursor:pointer;' title='View Order' data-id='${id}'></i>`);
        // Edit icon (admin only, not for cancelled/delivered)
        if (typeof window.CURRENT_USER_ROLE !== 'undefined' && window.CURRENT_USER_ROLE === 'admin' && !order.is_deleted && status !== 'cancelled' && status !== 'delivered') {
            actions.push(`<i class="fas fa-edit action-icon text-primary" style="cursor:pointer; margin-left:8px;" title="Edit Order" data-action="edit" data-id="${id}"></i>`);
        }
        // Delete icon (admin only, show for all except deleted)
        if (typeof window.CURRENT_USER_ROLE !== 'undefined' && window.CURRENT_USER_ROLE === 'admin' && !order.is_deleted) {
            actions.push(`<i class="fas fa-trash action-icon text-primary" style="cursor:pointer; margin-left:8px;" title="Delete Order" data-action="delete" data-id="${id}"></i>`);
        }
        return actions.join(' ');
    }
}

// Helper: Get status icon for add-on order status
function getOrderStatusIcon(status) {
    status = (status || '').toLowerCase();
    let icon = '<i class="fas fa-question-circle text-secondary"></i>';
    let label = status.charAt(0).toUpperCase() + status.slice(1);
    if (status === 'pending') icon = '<i class="fas fa-hourglass-half" style="color:#ffc107"></i>'; // Yellow
    else if (status === 'preparing') icon = '<i class="fas fa-utensils" style="color:#6f42c1"></i>'; // Purple
    else if (status === 'ready') icon = '<i class="fas fa-bell" style="color:#17a2b8"></i>'; // Teal
    else if (status === 'delivered') icon = '<i class="fas fa-concierge-bell" style="color:#28a745"></i>'; // Green
    else if (status === 'cancelled') icon = '<i class="fas fa-times-circle" style="color:#dc3545"></i>'; // Red
    return `${icon} <span class="ms-1">${label}</span>`;
}

// Helper: Render only the next status action icon for add-on order row
function renderNextStatusAction(order) {
    const status = (order.order_status_name || '').toLowerCase();
    const id = order.addon_order_id;
    let actions = [];
    // Status flow icons
    if (status === 'pending') {
        actions.push({ next: 'preparing', icon: 'fa-utensils', color: '', style: 'color:#6f42c1', label: 'Mark as Preparing', type: 'status' }); // Purple
    } else if (status === 'preparing') {
        actions.push({ next: 'ready', icon: 'fa-bell', color: '', style: 'color:#17a2b8', label: 'Mark as Ready', type: 'status' }); // Teal
    } else if (status === 'ready') {
        actions.push({ next: 'delivered', icon: 'fa-concierge-bell', color: '', style: 'color:#28a745', label: 'Mark as Delivered', type: 'status' }); // Green
    }
    // Cancel icon (if not already cancelled or delivered)
    if (status !== 'cancelled' && status !== 'delivered') {
        actions.push({ next: 'cancelled', icon: 'fa-times-circle', color: '', style: 'color:#dc3545', label: 'Cancel Order', type: 'cancel' }); // Red
    }
    // Edit icon (admin only, not for cancelled/delivered)
    if (typeof window.CURRENT_USER_ROLE !== 'undefined' && window.CURRENT_USER_ROLE === 'admin' && !order.is_deleted && order.order_status_name !== 'cancelled' && order.order_status_name !== 'delivered') {
        actions.push({ next: 'edit', icon: 'fa-pen', color: 'text-primary', label: 'Edit Order', type: 'edit' });
    }
    // Delete icon (admin only, show for all except deleted)
    if (typeof window.CURRENT_USER_ROLE !== 'undefined' && window.CURRENT_USER_ROLE === 'admin' && !order.is_deleted) {
        actions.push({ next: 'delete', icon: 'fa-trash', color: 'text-primary', label: 'Delete Order', type: 'delete' });
    }
    return actions.map(action =>
        `<i class="fas ${action.icon} action-icon ${action.color || ''}" style="cursor:pointer; margin-left:8px;${action.style || ''}" title="${action.label}" data-action="${action.type === 'status' ? 'status-' + action.next : action.type}" data-id="${id}"></i>`
    ).join(' ');
}

// --- Edit Order Modal Logic (POS style) ---
let editOrderState = { orderId: null, items: [], allAddons: [], categoryId: '' };
async function openEditOrderModal(orderId) {
    editOrderState = { orderId, items: [], allAddons: [], categoryId: '' };
    // Fetch order items
    try {
        const res = await axios.get(`${BASE_URL}/addons/order-item.php`, { params: { operation: 'getOrderItemsByOrderId', addon_order_id: orderId } });
        editOrderState.items = Array.isArray(res.data) ? res.data : [];
    } catch { editOrderState.items = []; }
    // Fetch all add-ons
    try {
        const res = await axios.get(`${BASE_URL}/addons/addons.php`, { params: { operation: 'getAllAddons' } });
        editOrderState.allAddons = Array.isArray(res.data) ? res.data.filter(a => a.is_available) : [];
    } catch { editOrderState.allAddons = []; }
    // Fetch categories
    let categories = [];
    try {
        const res = await axios.get(`${BASE_URL}/addons/categories.php`, { params: { operation: 'getAllCategories' } });
        categories = res.data && res.data.status === 'success' && Array.isArray(res.data.data) ? res.data.data : [];
    } catch { categories = []; }
    // Render sidebar
    let sidebarHtml = '<ul class="list-group list-group-flush">';
    sidebarHtml += `<li class="list-group-item edit-addon-category-item active" data-category-id="">All</li>`;
    categories.forEach(cat => {
        sidebarHtml += `<li class="list-group-item edit-addon-category-item" data-category-id="${cat.category_id}">${cat.category_name}</li>`;
    });
    sidebarHtml += '</ul>';
    document.getElementById('editAddonCategorySidebar').innerHTML = sidebarHtml;
    // Category click event
    document.querySelectorAll('.edit-addon-category-item').forEach(el => {
        el.onclick = function () {
            document.querySelectorAll('.edit-addon-category-item').forEach(e => e.classList.remove('active'));
            this.classList.add('active');
            editOrderState.categoryId = this.dataset.categoryId;
            renderEditPOS();
        };
    });
    editOrderState.categoryId = '';
    renderEditPOS();
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editAddonOrderModal'));
    modal.show();
}

function renderEditPOS() {
    const container = document.getElementById('editAddonOrderPOS');
    let addons = editOrderState.allAddons;
    if (editOrderState.categoryId) {
        addons = addons.filter(a => String(a.category_id) === String(editOrderState.categoryId));
    }
    // Map current order items by addon_id
    const itemMap = {};
    editOrderState.items.forEach(i => { itemMap[i.name] = i.quantity; });
    let html = `<div class='row'>`;
    if (addons.length === 0) {
        html += `<div class='col-12 text-center text-muted py-5'>No add-ons found for this category.</div>`;
    }
    addons.forEach(addon => {
        let imgSrc = addon.image_url ? `../../assets/images/uploads/addon-images/${addon.image_url}` : '../../assets/images/no-image.png';
        const qty = itemMap[addon.name] || 0;
        html += `<div class='col-lg-4 col-md-6 mb-4'>
            <div class='card h-100 shadow-sm'>
                <img src='${imgSrc}' class='card-img-top' style='height:220px;object-fit:cover;border-radius:12px 12px 0 0;'>
                <div class='card-body'>
                    <h5 class='card-title mb-1'>${addon.name}</h5>
                    <div class='mb-2 text-muted fw-bold'>₱${parseFloat(addon.price).toFixed(2)}</div>
                    <input type='number' min='0' value='${qty}' class='form-control edit-addon-qty' data-addon-id='${addon.addon_id}' data-addon-name='${addon.name}' data-addon-price='${addon.price}' placeholder='Qty'>
                </div>
            </div>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
    // Attach input listeners
    container.querySelectorAll('.edit-addon-qty').forEach(input => {
        input.addEventListener('input', updateEditOrderSummary);
    });
    updateEditOrderSummary();
}

function updateEditOrderSummary() {
    const qtyInputs = document.querySelectorAll('.edit-addon-qty');
    let items = [];
    let total = 0;
    let summaryHtml = '';
    qtyInputs.forEach(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
            const name = input.getAttribute('data-addon-name');
            const price = parseFloat(input.getAttribute('data-addon-price'));
            items.push({ addon_id: input.getAttribute('data-addon-id'), quantity: qty, name, price });
            total += price * qty;
            summaryHtml += `<li class='list-group-item d-flex justify-content-between align-items-center'>
                <span>${name} <span class='badge bg-primary ms-2'>x${qty}</span></span>
                <span>₱${(price * qty).toFixed(2)}</span>
            </li>`;
        }
    });
    document.getElementById('editOrderSummaryList').innerHTML = summaryHtml;
    document.getElementById('editOrderSummaryTotal').textContent = `₱${total.toFixed(2)}`;
    const box = document.getElementById('editOrderSummaryBox');
    const saveBtn = document.getElementById('saveEditOrderBtn');
    if (items.length > 0) {
        box.classList.remove('d-none');
        saveBtn.classList.remove('d-none');
    } else {
        box.classList.add('d-none');
        saveBtn.classList.add('d-none');
    }
    // Save items for submit
    editOrderState.items = items;
}

// Save button logic
document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveEditOrderBtn');
    if (saveBtn) {
        saveBtn.onclick = async function () {
            if (!editOrderState.items.length) {
                Swal && Swal.fire('Error', 'Please select at least one add-on item.', 'error');
                return;
            }
            const result = await editOrder(editOrderState.orderId, editOrderState.items.map(i => ({ addon_id: i.addon_id, quantity: i.quantity })));
            if (result.success) {
                Swal && Swal.fire('Success', 'Order updated.', 'success');
                bootstrap.Modal.getInstance(document.getElementById('editAddonOrderModal')).hide();
                loadAddonOrders();
            } else {
                Swal && Swal.fire('Error', result.message || 'Failed to update order.', 'error');
            }
        };
    }
});
function showNewOrderModal() {
    const modal = new bootstrap.Modal(document.getElementById('addonOrderModal'));
    document.getElementById('addonOrderModalLabel').textContent = 'New Add-on Order';
    // Reset reservation search
    document.getElementById('reservationSearchInput').value = '';
    document.getElementById('reservationSearchResults').innerHTML = '';
    document.getElementById('selectedReservationSummary').classList.add('d-none');
    document.getElementById('selectedReservationSummary').innerHTML = '';
    window.selectedReservation = null;
    renderPOS();
    // Reset order summary
    document.getElementById('orderSummaryBox').classList.add('d-none');
    document.getElementById('orderSummaryList').innerHTML = '';
    document.getElementById('orderSummaryTotal').textContent = '₱0.00';
    modal.show();
}

// Reservation search logic
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('reservationSearchInput');
    if (!input) return;
    let searchTimeout;
    input.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        const val = this.value.trim();
        if (!val) {
            document.getElementById('reservationSearchResults').innerHTML = '';
            return;
        }
        searchTimeout = setTimeout(async () => {
            const res = await axios.get(`${BASE_URL}/reservations/reservations.php`, { params: { search: val } });
            const results = Array.isArray(res.data) ? res.data : [];
            let html = '';
            results.forEach(r => {
                html += `<button type="button" class="list-group-item list-group-item-action reservation-result-item" data-reservation-id="${r.reservation_id}">
                    <b>#${r.reservation_id}</b> - ${r.guest_name || '-'} | ${r.check_in_date} to ${r.check_out_date} | ${r.rooms_summary || ''}
                </button>`;
            });
            document.getElementById('reservationSearchResults').innerHTML = html || '<div class="text-muted px-2">No results</div>';
        }, 300);
    });
    document.getElementById('reservationSearchResults').addEventListener('click', function (e) {
        if (e.target.classList.contains('reservation-result-item')) {
            const id = e.target.getAttribute('data-reservation-id');
            selectReservationForOrder(id, e.target.textContent);
        }
    });
});

async function selectReservationForOrder(reservationId, summaryText) {
    window.selectedReservation = reservationId;
    document.getElementById('selectedReservationSummary').classList.remove('d-none');
    document.getElementById('selectedReservationSummary').innerHTML = `<b>Selected Reservation:</b> ${summaryText}`;
    document.getElementById('reservationSearchResults').innerHTML = '';
    document.getElementById('reservationSearchInput').value = '';
}
async function renderPOS(categoryId = "") {
    const container = document.getElementById('addonOrderPOS');
    container.innerHTML = '<div class="text-center">Loading add-ons...</div>';
    // Fetch available add-ons
    let addons = [];
    try {
        const params = { operation: "getAllAddons" };
        if (categoryId) params.category = categoryId;
        const res = await axios.get(`${BASE_URL}/addons/addons.php`, { params });
        addons = Array.isArray(res.data) ? res.data.filter(a => a.is_available) : [];
    } catch {
        container.innerHTML = '<div class="text-danger">Failed to load add-ons.</div>';
        return;
    }
    // Render POS UI
    let html = `<div class='row'>`;
    if (addons.length === 0) {
        html += `<div class='col-12 text-center text-muted py-5'>No add-ons found for this category.</div>`;
    }
    addons.forEach(addon => {
        // Use correct path for add-on images
        let imgSrc = addon.image_url ? `../../assets/images/uploads/addon-images/${addon.image_url}` : '../../assets/images/no-image.png';
        html += `<div class='col-lg-4 col-md-6 mb-4'>
            <div class='card h-100 shadow-sm'>
                <img src='${imgSrc}' class='card-img-top' style='height:220px;object-fit:cover;border-radius:12px 12px 0 0;'>
                <div class='card-body'>
                    <h5 class='card-title mb-1'>${addon.name}</h5>
                    <div class='mb-2 text-muted fw-bold'>₱${parseFloat(addon.price).toFixed(2)}</div>
                    <input type='number' min='0' value='0' class='form-control addon-qty-input' data-addon-id='${addon.addon_id}' data-addon-name='${addon.name}' data-addon-price='${addon.price}' placeholder='Qty'>
                </div>
            </div>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
    // The Review Order button is now outside the scrollable area, so just set up its handler once
    const reviewBtn = document.getElementById('showOrderSummaryBtn');
    if (reviewBtn) reviewBtn.onclick = showOrderSummary;
    // Wire up submit button (only once)
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn && !submitBtn.dataset.bound) {
        submitBtn.addEventListener('click', async function () {
            submitBtn.disabled = true;
            await submitOrder();
            submitBtn.disabled = false;
        });
        submitBtn.dataset.bound = '1';
    }
}

function showOrderSummary() {
    // Gather selected quantities
    const qtyInputs = document.querySelectorAll('.addon-qty-input');
    let items = [];
    let total = 0;
    let summaryHtml = '';
    qtyInputs.forEach(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
            const name = input.getAttribute('data-addon-name');
            const price = parseFloat(input.getAttribute('data-addon-price'));
            items.push({ addon_id: input.getAttribute('data-addon-id'), quantity: qty, name, price });
            total += price * qty;
            summaryHtml += `<li class='list-group-item d-flex justify-content-between align-items-center'>
                <span>${name} <span class='badge bg-primary ms-2'>x${qty}</span></span>
                <span>₱${(price * qty).toFixed(2)}</span>
            </li>`;
        }
    });
    if (!items.length) {
        Swal.fire('No add-ons selected', 'Please select at least one add-on.', 'warning');
        return;
    }
    document.getElementById('orderSummaryList').innerHTML = summaryHtml;
    document.getElementById('orderSummaryTotal').textContent = `₱${total.toFixed(2)}`;
    document.getElementById('orderSummaryBox').classList.remove('d-none');
    // Show submit button
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) submitBtn.classList.remove('d-none');
}

async function submitOrder() {
    // Gather selected quantities from summary
    const summaryItems = document.querySelectorAll('#orderSummaryList .list-group-item');
    let items = [];
    summaryItems.forEach(li => {
        const name = li.querySelector('span').textContent.split(' x')[0].trim();
        const qty = parseInt(li.querySelector('.badge').textContent.replace('x', ''));
        const addon = Array.from(document.querySelectorAll('.addon-qty-input')).find(input => input.getAttribute('data-addon-name') === name);
        if (addon) {
            items.push({ addon_id: addon.getAttribute('data-addon-id'), quantity: qty });
        }
    });
    if (!items.length) {
        Swal.fire('No add-ons selected', 'Please select at least one add-on.', 'warning');
        return;
    }
    // Use selected reservation
    const reservation_id = window.selectedReservation;
    if (!reservation_id) {
        Swal.fire('No reservation selected', 'Please select a reservation for this order.', 'warning');
        return;
    }
    // Optionally, get user_id if you have session info
    let user_id = null;
    if (window.CURRENT_USER_ID) {
        user_id = window.CURRENT_USER_ID;
        console.log('Order placed by user_id:', user_id);
    } else {
        console.warn('No CURRENT_USER_ID found when placing order!');
    }
    // Submit order
    try {
        const formData = new FormData();
        formData.append('operation', 'insertOrder');
        formData.append('json', JSON.stringify({ reservation_id, items, user_id }));
        const res = await axios.post(`${BASE_URL}/addons/order.php`, formData);
        if (res.data && res.data.success) {
            Swal.fire('Order placed!', '', 'success');
            loadAddonOrders();
            bootstrap.Modal.getInstance(document.getElementById('addonOrderModal')).hide();
        } else {
            Swal.fire('Failed to place order', res.data && res.data.message ? res.data.message : '', 'error');
        }
    } catch {
        Swal.fire('Failed to place order', '', 'error');
    }
    // Hide submit button after order
    const submitBtn = document.getElementById('submitOrderBtn');
    if (submitBtn) submitBtn.classList.add('d-none');
}

async function viewOrder(orderId) {
    try {
        const statusRes = await axios.get(`${BASE_URL}/addons/order_status.php`, { params: { operation: 'getAllOrderStatuses' } });
        const statusList = Array.isArray(statusRes.data) ? statusRes.data : [];
        const res = await axios.get(`${BASE_URL}/addons/order.php`, { params: { operation: 'getOrder', json: JSON.stringify({ addon_order_id: orderId }) } });
        const order = Array.isArray(res.data) ? res.data[0] : res.data;
        let itemsHtml = '';
        let total = 0;
        if (order && order.addon_order_id) {
            // Fetch only current (not deleted) items for this order, and get up-to-date price from Addon table
            const itemsRes = await axios.get(`${BASE_URL}/addons/order-item.php`, { params: { operation: 'getOrderItemsByOrderId', addon_order_id: orderId } });
            let items = Array.isArray(itemsRes.data) ? itemsRes.data : [];
            // Group by addon_id and get latest price
            const grouped = {};
            for (const item of items) {
                if (!grouped[item.name]) grouped[item.name] = { ...item, quantity: 0 };
                grouped[item.name].quantity += parseInt(item.quantity);
            }
            // Fetch all add-ons for price lookup
            let allAddons = [];
            try {
                const addonsRes = await axios.get(`${BASE_URL}/addons/addons.php`, { params: { operation: 'getAllAddons' } });
                allAddons = Array.isArray(addonsRes.data) ? addonsRes.data : [];
            } catch { }
            items = Object.values(grouped).map(i => {
                const addon = allAddons.find(a => a.addon_id == i.addon_id);
                return {
                    ...i,
                    price: addon ? addon.price : i.price
                };
            });
            if (items.length) {
                itemsHtml = '<ul class="list-group mb-2">' + items.map(i => {
                    total += parseFloat(i.price) * parseInt(i.quantity);
                    return `<li class='list-group-item d-flex justify-content-between align-items-center'><span>${i.name} <span class='text-muted small'>(₱${parseFloat(i.price).toFixed(2)} each)</span></span><span class='badge bg-primary rounded-pill'>x${i.quantity}</span></li>`;
                }).join('') + '</ul>';
            } else {
                itemsHtml = '<div class="text-muted">No items found for this order.</div>';
            }
        } else {
            itemsHtml = '<div class="text-danger">Order not found.</div>';
        }
        // Format date in Asia/Manila timezone
        let dateStr = '-';
        if (order.order_date) {
            let d = new Date(order.order_date + 'T00:00:00Z');
            if (order.order_date.length > 10) d = new Date(order.order_date.replace(' ', 'T') + 'Z');
            if (!isNaN(d)) {
                d = new Date(d.getTime() + 8 * 60 * 60 * 1000);
                const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
                dateStr = d.toLocaleString('en-US', options).replace(',', '');
            } else {
                dateStr = order.order_date;
            }
        }
        // Status badge color mapping
        const statusColorMap = {
            pending: 'bg-secondary',
            processing: 'bg-warning text-dark',
            delivered: 'bg-success',
            completed: 'bg-success',
            cancelled: 'bg-danger',
            ready: 'bg-info',
        };
        const statusName = (order.order_status_name || '').toLowerCase();
        const badgeClass = statusColorMap[statusName] || 'bg-info';
        // Status dropdown (disabled, just for display)
        let statusOptions = statusList.map(s => `<option value="${s.order_status_name}"${s.order_status_name === order.order_status_name ? ' selected' : ''}>${s.order_status_name.charAt(0).toUpperCase() + s.order_status_name.slice(1)}</option>`).join('');
        Swal.fire({
            title: `Order #${orderId}`,
            html: `<div class='text-start'>
                <div class='mb-2'><b>Guest:</b> ${order.first_name || ''} ${order.last_name || ''}</div>
                <div class='mb-2'><b>Reservation:</b> ${order.reservation_id || '-'}</div>
                <div class='mb-2'><b>Status:</b> <span class='badge ${badgeClass}'>${order.order_status_name || 'pending'}</span></div>
                <div class='mb-2'><b>Date:</b> ${dateStr}</div>
                <div><b>Items:</b></div>
                ${itemsHtml}
                <div class='fw-bold mt-2'>Total: <span class='text-success'>₱${total.toFixed(2)}</span></div>
            </div>`,
            width: 666,
            showConfirmButton: true,
            confirmButtonText: 'Close',
            customClass: { popup: 'px-2' }
        });
    } catch (e) {
        Swal.fire('Error', 'Failed to load order details.', 'error');
    }

}
