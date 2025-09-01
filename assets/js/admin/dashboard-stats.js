// /*
//   Dashboard Statistics
//   Fetches and displays statistics on the admin dashboard
//  */
(function () {
    let revenueChartInstance = null;

    // ### LOAD DASHBOARD STATS ###
    async function loadDashboardStats() {
        try {
            // Fetch dashboard data from API
            const response = await axios.get('../../api/admin/dashboard/dashboard.php');
            const data = response.data;

            if (data.status === 'success') {
                // ### ROOM STATS ###
                // Update room statistics
                document.getElementById('totalRooms').textContent = data.stats.totalRooms || 0;
                document.getElementById('availableRooms').textContent = data.stats.availableRooms || 0;

                // ### GUEST STATS ###
                // Update guest count
                document.getElementById('totalGuests').textContent = data.stats.totalGuests || 0;

                // ### RESERVATION STATS ###
                // Update active reservations
                document.getElementById('activeReservations').textContent = data.stats.activeReservations || 0;

                // ### REVENUE STATS ###
                // Update total revenue with proper formatting
                const revenue = parseFloat(data.stats.totalRevenue || 0).toLocaleString('en-PH', {
                    style: 'currency',
                    currency: 'PHP'
                });
                document.getElementById('totalRevenue').textContent = revenue;

                // Show revenue date (new)
                const revenueDateElem = document.getElementById('revenueDate');
                if (revenueDateElem) {
                    // Use data.stats.revenueDateRange if available, else fallback to today
                    revenueDateElem.textContent = data.stats.revenueDateRange
                        ? data.stats.revenueDateRange
                        : `as of ${new Date().toLocaleDateString()}`;
                }

                // Show revenue change (fake demo)
                const revenueChange = data.stats.revenueChange || 0;
                const revenueChangeElem = document.getElementById('revenueChange');
                if (revenueChangeElem) {
                    revenueChangeElem.textContent = (revenueChange >= 0 ? '+' : '') + revenueChange + '%';
                    revenueChangeElem.className = 'badge ' + (revenueChange >= 0 ? 'bg-success' : 'bg-danger');
                }

                // --- Render revenue chart with real data ---
                renderRevenueChart(
                    data.stats.revenuePerDay || [],
                    data.stats.revenuePerMonth || []
                );

                // ### RECENT RESERVATIONS ###
                // Load recent reservations into table
                loadRecentReservations(data.reservations || []);

                // ### ROOM STATUS CHART ###
                renderRoomStatusChart(data.stats.roomStatus || []);

                console.log('Dashboard stats loaded successfully');
            } else {
                console.error('Error loading dashboard stats:', data);
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    }

    // ### RECENT RESERVATIONS TABLE ###
    function loadRecentReservations(reservations) {
        const tbody = document.getElementById('recentReservationsBody');
        if (!tbody) return;

        if (!reservations || reservations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No recent reservations found</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        reservations.forEach(res => {
            // Generate avatar (first letter of guest name)
            const avatar = `<span class="avatar-circle bg-primary text-white me-2">${(res.guest_name || '?').charAt(0).toUpperCase()}</span>`;
            // Status icon
            const statusIcon = getStatusIcon(res.status);
            tbody.innerHTML += `
                <tr>
                    <td>${res.reservation_id}</td>
                    <td class="d-flex align-items-center">${avatar}<span>${res.guest_name}</span></td>
                    <td>${res.check_in_date}</td>
                    <td>${res.check_out_date}</td>
                    <td>
                        <span class="${getStatusColor(res.status)}">${statusIcon} ${res.status} </span>
                    </td>
                </tr>
            `;
        });
    }

    // Helper to get status color
    function getStatusColor(status) {
        status = (status || '').toLowerCase();
        if (status === 'confirmed') return 'info';
        if (status === 'pending') return 'warning';
        if (status === 'checked-in') return 'success';
        if (status === 'checked-out') return 'primary';
        if (status === 'cancelled') return 'danger';
        return 'secondary';
    }

    // Helper to get status icon
    function getStatusIcon(status) {
        status = (status || '').toLowerCase();
        if (status === 'confirmed') return '<i class="fas fa-check-circle text-info"></i>';
        if (status === 'pending') return '<i class="fas fa-hourglass-half text-warning"></i>';
        if (status === 'checked-in') return '<i class="fas fa-door-open text-success"></i>';
        if (status === 'checked-out') return '<i class="fas fa-sign-out-alt text-primary"></i>';
        if (status === 'cancelled') return '<i class="fas fa-times-circle text-danger"></i>';
        return '<i class="fas fa-question-circle text-secondary"></i>';
    }

    // ### ROOM STATUS CHART ###
    function renderRoomStatusChart(statusData) {
        const chartDiv = document.getElementById('roomStatusChart');
        if (!chartDiv) return;
        if (!statusData || statusData.length === 0) {
            chartDiv.innerHTML = '<div class="text-muted text-center">No data</div>';
            return;
        }
        // Bootstrap color mapping
        const colorMap = {
            'available': 'success',
            'occupied': 'danger',
            'maintenance': 'warning',
            'reserved': 'info'
        };
        // Calculate total for percentage
        const total = statusData.reduce((sum, s) => sum + parseInt(s.count), 0);
        chartDiv.innerHTML = `
            <div class="d-flex flex-column gap-3">
                ${statusData.map(s => `
                    <div>
                        <span class="fw-bold text-capitalize">${s.status}</span>
                        <div class="progress rounded-pill" style="height: 18px;">
                            <div class="progress-bar bg-${colorMap[s.status] || 'secondary'}" 
                                 role="progressbar" 
                                 style="width: ${(total ? (s.count / total * 100) : 0).toFixed(1)}%;" 
                                 aria-valuenow="${s.count}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="${total}">
                                ${s.count} (${total ? ((s.count / total * 100).toFixed(1)) : 0}%)
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // --- Render Chart.js revenue chart ---
    function renderRevenueChart(revenuePerDay, revenuePerMonth) {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        // Prefer per day if enough data, else per month
        let labels = [];
        let values = [];
        let labelType = '';
        if (revenuePerDay && revenuePerDay.length >= 7) {
            labels = revenuePerDay.map(r => r.day);
            values = revenuePerDay.map(r => parseFloat(r.revenue));
            labelType = 'day';
        } else if (revenuePerMonth && revenuePerMonth.length > 0) {
            labels = revenuePerMonth.map(r => r.month);
            values = revenuePerMonth.map(r => parseFloat(r.revenue));
            labelType = 'month';
        } else {
            // fallback demo
            labels = [];
            values = [];
        }

        // Format labels for display
        if (labelType === 'day') {
            labels = labels.map(d => {
                const date = new Date(d);
                return `${date.getMonth() + 1}/${date.getDate()}`;
            });
        } else if (labelType === 'month') {
            labels = labels.map(m => {
                const [year, month] = m.split('-');
                return `${year}-${month}`;
            });
        }

        // Destroy previous chart if exists
        if (revenueChartInstance) {
            revenueChartInstance.destroy();
        }

        revenueChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: labelType === 'day' ? 'Revenue (Daily)' : 'Revenue (Monthly)',
                    data: values,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40,167,69,0.08)',
                    pointBackgroundColor: '#28a745',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.35,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `₱${ctx.parsed.y.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        title: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#e9ecef' },
                        ticks: {
                            callback: v => '₱' + v.toLocaleString('en-PH', { maximumFractionDigits: 0 })
                        }
                    }
                }
            }
        });

        // Show date range under chart
        const labelDiv = document.getElementById('revenueSparklineLabel');
        if (labelDiv) {
            if (labels.length > 1) {
                labelDiv.textContent = `From ${labels[0]} to ${labels[labels.length - 1]}`;
            } else {
                labelDiv.textContent = '';
            }
        }
    }

    // ### INITIALIZE DASHBOARD ###
    function initDashboard() {
        // Load stats when page loads
        loadDashboardStats();

        // Set up refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadDashboardStats);
        }
    }

    // Run on page load
    document.addEventListener('DOMContentLoaded', initDashboard);
})();
