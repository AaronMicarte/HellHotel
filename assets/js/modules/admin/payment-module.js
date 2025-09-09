// payment-module.js

const BASE_URL = `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/payments/payments.php`;
/**
 * Fetch payment history with filters and pagination
 * @param {Object} options - { role, page, limit, search, dateFrom, dateTo }
 */
export async function fetchPaymentHistory(options = {}) {
    const {
        role = 'admin',
        page = 1,
        limit = 10,
        search = '',
        dateFrom = '',
        dateTo = ''
    } = options;
    try {
        const response = await axios.get(BASE_URL, {
            params: {
                operation: 'getPaymentHistory',
                role,
                page,
                limit,
                search,
                dateFrom,
                dateTo
            }
        });
        return response.data;
    } catch (e) {
        return [];
    }
}
