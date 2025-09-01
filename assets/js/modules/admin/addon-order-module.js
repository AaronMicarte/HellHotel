export async function editOrder(addon_order_id, items) {
    if (!addon_order_id || !Array.isArray(items)) return { success: false, message: 'Order ID and items are required.' };
    try {
        const formData = new FormData();
        formData.append('operation', 'editOrder');
        formData.append('json', JSON.stringify({ addon_order_id, items }));
        const res = await axios.post('/Hotel-Reservation-Billing-System/api/admin/addons/order.php', formData);
        if (res.data && res.data.success) {
            return { success: true };
        } else {
            return { success: false, message: res.data && res.data.message ? res.data.message : 'Failed to edit order.' };
        }
    } catch (err) {
        return { success: false, message: 'Failed to edit order.' };
    }
}
export async function deleteOrder(addon_order_id) {
    if (!addon_order_id) return { success: false, message: 'No order ID provided.' };
    try {
        const formData = new FormData();
        formData.append('operation', 'deleteOrder');
        formData.append('json', JSON.stringify({ addon_order_id }));
        const res = await axios.post('/Hotel-Reservation-Billing-System/api/admin/addons/order.php', formData);
        if (res.data && (res.data.success || res.data === 1)) {
            return { success: true };
        } else {
            return { success: false, message: res.data && res.data.message ? res.data.message : 'Failed to delete order.' };
        }
    } catch (err) {
        return { success: false, message: 'Failed to delete order.' };
    }
}
