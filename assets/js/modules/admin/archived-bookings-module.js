// archived-bookings-module.js
// Handles fetching and displaying archived bookings for admin/frontdesk

const ArchivedBookingsModule = {
    fetchArchivedBookings: async function (search = '', baseUrl) {
        if (!baseUrl) {
            throw new Error('Base URL is required for API calls.');
        }
        try {
            console.log('Fetching archived bookings from:', baseUrl);
            const response = await axios.get(baseUrl, {
                params: {
                    action: 'fetch',
                    search: search
                }
            });
            console.log('API Response:', response.data);
            const result = response.data;
            if (result && result.success) {
                return result.data || [];
            } else {
                console.error('API returned error:', result);
                throw new Error(result?.message || 'Failed to fetch archived bookings');
            }
        } catch (err) {
            console.error('Error fetching archived bookings:', err);
            console.error('Error details:', err.response?.data);
            if (err.response?.status === 404) {
                throw new Error('API endpoint not found. Please check the URL.');
            }
            throw new Error(err.response?.data?.message || err.message || 'Failed to fetch archived bookings');
        }
    },

    renderBookings: function (bookings, containerId = 'archived-bookings-list') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!bookings.length) {
            container.innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>No archived bookings found.</div>';
            return;
        }

        let html = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5><i class="fas fa-archive"></i> Archived Bookings</h5>
                    <span class="badge bg-secondary">${bookings.length} booking(s)</span>
                </div>
                <div class="card-body text-dark">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th style="color:#212529;background:#fff;">Booking ID</th>
                                    <th style="color:#212529;background:#fff;">Guest Details</th>
                                    <th style="color:#212529;background:#fff;">Check-in</th>
                                    <th style="color:#212529;background:#fff;">Check-out</th>
                                    <th style="color:#212529;background:#fff;">Status</th>
                                    <th style="color:#212529;background:#fff;">Archived Info</th>
                                    <th style="color:#212529;background:#fff;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>`;

        bookings.forEach(booking => {
            const guestName = `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'Unknown Guest';
            const statusBadge = this.getStatusBadge(booking.reservation_status || 'Unknown');
            const checkInDate = this.formatDate(booking.check_in_date);
            const checkOutDate = this.formatDate(booking.check_out_date);
            const archivedDate = this.formatDate(booking.updated_at || booking.created_at);
            const nights = this.calculateNights(booking.check_in_date, booking.check_out_date);
            const roomsSummary = booking.rooms_summary || 'No rooms assigned';

            html += `
                <tr>
                    <td style="color:#212529;background:#fff;"><strong>#${booking.reservation_id}</strong></td>
                    <td style="color:#212529;background:#fff;">
                        <div>
                            <strong>${guestName}</strong>
                            <br>
                            <small class="text-muted">Email: ${booking.email || 'N/A'}</small>
                        </div>
                    </td>
                    <td style="color:#212529;background:#fff;"><strong>${checkInDate}</strong></td>
                    <td style="color:#212529;background:#fff;">
                        <strong>${checkOutDate}</strong>
                        <br>
                        <small class="text-muted">${nights} night(s)</small>
                    </td>
                    <td style="color:#212529;background:#fff;">${statusBadge}</td>
                    <td style="color:#212529;background:#fff;">
                        <strong class="text-dark">${archivedDate}</strong>
                        <br>
                        <small class="text-muted">${roomsSummary}</small>
                    </td>
                    <td style="color:#212529;background:#fff;">
                        <i class="fas fa-eye me-3 text-primary" style="cursor:pointer;" onclick="viewArchivedBookingDetails(${booking.reservation_id})" title="View Details"></i>
                        <i class="fas fa-history text-warning" style="cursor:pointer;" onclick="viewArchivedBookingHistory(${booking.reservation_id})" title="View History"></i>
                    </td>
                </tr>`;
        });

        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

        container.innerHTML = html;
    },

    formatDate: function (dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    calculateNights: function (checkIn, checkOut) {
        if (!checkIn || !checkOut) return 0;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = end.getTime() - start.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    getStatusBadge: function (status) {
        status = (status || '').toLowerCase();
        let icon = '<i class="fas fa-question-circle text-secondary"></i>';
        let label = status.charAt(0).toUpperCase() + status.slice(1);

        if (status === 'checked-out') {
            icon = '<i class="fas fa-sign-out-alt text-success"></i>';
        } else if (status === 'cancelled') {
            icon = '<i class="fas fa-times-circle text-danger"></i>';
        } else if (status === 'overdue') {
            icon = '<i class="fas fa-exclamation-triangle text-warning"></i>';
        }

        return `${icon} ${label}`;
    }
};

export default ArchivedBookingsModule;
