// payment-module.js

const BASE_URL = `Hotel-Reservation-Billing-System/api/admin/payments/payments.php`;

export async function fetchPaymentHistory() {
    try {
        const response = await axios.get(BASE_URL, {
            params: { operation: 'getPaymentHistory' }
        });
        return response.data;
    } catch (e) {
        return [];
    }
}
