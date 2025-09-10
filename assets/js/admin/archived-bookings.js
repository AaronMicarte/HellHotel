// archived-bookings.js
// Main JS for admin archived bookings page

import ArchivedBookingsModule from '../modules/admin/archived-bookings-module.js';

const BASE_URL = '/Hotel-Reservation-Billing-System/api/admin/reservations/archived_bookings.php';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Loading archived bookings page...');
        // Initial fetch and render
        const bookings = await ArchivedBookingsModule.fetchArchivedBookings('', BASE_URL);
        console.log('Fetched bookings:', bookings);
        ArchivedBookingsModule.renderBookings(bookings);
    } catch (error) {
        console.error('Error loading archived bookings:', error);
        const container = document.getElementById('archived-bookings-list');
        if (container) {
            container.innerHTML = `<div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Error loading archived bookings:</strong> ${error.message}
                <br><small>Please check the console for more details or contact support.</small>
            </div>`;
        }
    }

    // Search functionality
    const searchInput = document.getElementById('search');
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', async () => {
            try {
                const search = searchInput.value.trim();
                const bookings = await ArchivedBookingsModule.fetchArchivedBookings(search, BASE_URL);
                ArchivedBookingsModule.renderBookings(bookings);
            } catch (error) {
                console.error('Error searching archived bookings:', error);
                const container = document.getElementById('archived-bookings-list');
                if (container) {
                    container.innerHTML = `<div class="alert alert-danger">Error searching: ${error.message}</div>`;
                }
            }
        });
        searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                try {
                    const search = searchInput.value.trim();
                    const bookings = await ArchivedBookingsModule.fetchArchivedBookings(search, BASE_URL);
                    ArchivedBookingsModule.renderBookings(bookings);
                } catch (error) {
                    console.error('Error searching archived bookings:', error);
                    const container = document.getElementById('archived-bookings-list');
                    if (container) {
                        container.innerHTML = `<div class="alert alert-danger">Error searching: ${error.message}</div>`;
                    }
                }
            }
        });
    }
});

// Global functions for archived booking actions (called from rendered HTML)
async function viewArchivedBookingDetails(reservationId) {
    try {
        const response = await axios.get('/Hotel-Reservation-Billing-System/api/admin/reservations/reservations.php', {
            params: {
                operation: 'getAllReservations'
            }
        });

        const reservation = Array.isArray(response.data) ?
            response.data.find(r => String(r.reservation_id) === String(reservationId)) : null;

        if (!reservation) {
            Swal.fire('Error', 'Archived booking not found', 'error');
            return;
        }

        // Format dates
        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        const calculateNights = (checkIn, checkOut) => {
            if (!checkIn || !checkOut) return 0;
            const start = new Date(checkIn);
            const end = new Date(checkOut);
            const diffTime = end.getTime() - start.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };

        const getStatusBadge = (status) => {
            status = (status || '').toLowerCase();
            let icon = '<i class="fas fa-question-circle text-secondary"></i>';
            let label = status.charAt(0).toUpperCase() + status.slice(1);

            if (status === 'checked-out') icon = '<i class="fas fa-sign-out-alt text-success"></i>';
            else if (status === 'cancelled') icon = '<i class="fas fa-times-circle text-danger"></i>';
            else if (status === 'overdue') icon = '<i class="fas fa-exclamation-triangle text-warning"></i>';

            return `${icon} ${label}`;
        };

        const html = `
            <div style='text-align:left;'>
                <div class="alert alert-info d-flex align-items-center mb-3">
                    <i class="fas fa-archive fa-lg me-2"></i>
                    <div><strong>Archived Booking</strong> - This booking has been moved to the archive.</div>
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <h5><i class="fas fa-info-circle text-primary"></i> Booking Information</h5>
                        <table class="table table-sm table-borderless">
                            <tr><td><strong>Booking ID:</strong></td><td>#${reservation.reservation_id}</td></tr>
                            <tr><td><strong>Status:</strong></td><td>${getStatusBadge(reservation.reservation_status)}</td></tr>
                            <tr><td><strong>Guest:</strong></td><td>${reservation.guest_name || 'N/A'}</td></tr>
                            <tr><td><strong>Check-in:</strong></td><td>${formatDate(reservation.check_in_date)}</td></tr>
                            <tr><td><strong>Check-out:</strong></td><td>${formatDate(reservation.check_out_date)}</td></tr>
                            <tr><td><strong>Nights:</strong></td><td>${calculateNights(reservation.check_in_date, reservation.check_out_date)}</td></tr>
                            <tr><td><strong>Archived Date:</strong></td><td>${formatDate(reservation.updated_at)}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h5><i class="fas fa-bed text-info"></i> Room Information</h5>
                        ${reservation.rooms_summary ?
                `<p><strong>Rooms:</strong> ${reservation.rooms_summary}</p>` :
                '<p class="text-muted">No room information available</p>'
            }
                    </div>
                </div>
            </div>`;

        Swal.fire({
            title: `<i class="fas fa-archive"></i> Archived Booking Details`,
            html: html,
            showConfirmButton: true,
            confirmButtonText: '<i class="fas fa-times"></i> Close',
            customClass: {
                popup: 'swal2-reservation-details'
            },
            background: '#f8f9fa',
            width: 700,
            showCloseButton: true
        });

    } catch (error) {
        console.error('Error fetching archived booking details:', error);
        Swal.fire('Error', 'Failed to load archived booking details', 'error');
    }
}

async function viewArchivedBookingHistory(reservationId) {
    try {
        const response = await axios.get('/Hotel-Reservation-Billing-System/api/admin/reservations/reservation_history.php', {
            params: {
                operation: 'getHistoryByReservation',
                reservation_id: reservationId
            }
        });

        const history = Array.isArray(response.data.data) ? response.data.data : [];

        let html = '';
        if (!history.length) {
            html = '<p class="text-muted">No status history found for this archived booking.</p>';
        } else {
            html = `<div class="alert alert-info d-flex align-items-center mb-3">
                        <i class="fas fa-archive fa-lg me-2"></i>
                        <div>Status history for <strong>archived booking #${reservationId}</strong></div>
                    </div>
                    <table class="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Changed At</th>
                                <th>Changed By</th>
                                <th>Role</th>
                            </tr>
                        </thead>
                        <tbody>`;

            history.forEach(row => {
                let status = row.reservation_status || '-';
                let changedAt = row.changed_at ?
                    new Date(row.changed_at).toLocaleString('en-US', {
                        year: 'numeric', month: 'short', day: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    }) : '-';
                let changedBy = row.changed_by_username || '-';
                let role = row.changed_by_role || '-';

                html += `<tr>
                    <td>${status}</td>
                    <td>${changedAt}</td>
                    <td>${changedBy}</td>
                    <td>${role}</td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        Swal.fire({
            title: `<i class='fas fa-history'></i> Archived Booking History #${reservationId}`,
            html: html,
            width: 700,
            showCloseButton: true,
            confirmButtonText: 'Close',
            background: '#f8f9fa',
        });

    } catch (error) {
        console.error('Error fetching archived booking history:', error);
        Swal.fire({
            icon: 'error',
            title: 'Failed to load history',
            text: 'Could not fetch history for this archived booking.'
        });
    }
}

// Make functions globally accessible
window.viewArchivedBookingDetails = viewArchivedBookingDetails;
window.viewArchivedBookingHistory = viewArchivedBookingHistory;
