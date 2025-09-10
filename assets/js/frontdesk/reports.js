/**
 * Enterprise Reports Dashboard - HellHotel
 * Advanced analytics and visualizations for hotel operations
 */

// Global variables for charts and configuration
/**
 * Get current date string in Asia/Manila timezone (YYYY-MM-DD)
 */
function getManilaDateString() {
    // Use toLocaleDateString with Asia/Manila timezone for accurate PH date
    const now = new Date();
    const manilaDateString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // 'YYYY-MM-DD'
    return manilaDateString;
}
let charts = {};
const BASE_URL = "/Hotel-Reservation-Billing-System/api/admin";
const colors = {
    primary: '#0d6efd',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
    secondary: '#6c757d'
};

/**
 * Initialize dashboard when page loads
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log('Enterprise Reports Dashboard initializing...');
    initializeReportsDashboard();
});

/**
 * Main initialization function
 */
async function initializeReportsDashboard() {
    try {
        setupDateDefaults();
        setupEventListeners();
        setupDateConstraints();
        showLoadingStates();
        await loadAllData();
        hideLoadingStates();
        showSuccessToast('Dashboard loaded successfully!');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorToast('Failed to initialize dashboard');
    }
}

/**
 * Setup default dates for inputs
 */
function setupDateDefaults() {
    const today = getManilaDateString();
    const firstDay = today.slice(0, 8) + '01';

    const reportDate = document.getElementById('reportDate');
    const revenueFrom = document.getElementById('revenueFrom');
    const revenueTo = document.getElementById('revenueTo');
    const addonFromDate = document.getElementById('addonFromDate');
    const addonToDate = document.getElementById('addonToDate');

    if (reportDate) reportDate.value = today;
    if (revenueFrom) revenueFrom.value = firstDay;
    if (revenueTo) revenueTo.value = today;
    if (addonFromDate) addonFromDate.value = firstDay;
    if (addonToDate) addonToDate.value = today;
}

/**
 * Setup event listeners for date changes
 */
function setupEventListeners() {
    const reportDate = document.getElementById('reportDate');
    const revenueFrom = document.getElementById('revenueFrom');
    const revenueTo = document.getElementById('revenueTo');
    const addonCategoryFilter = document.getElementById('addonCategoryFilter');
    const addonFromDate = document.getElementById('addonFromDate');
    const addonToDate = document.getElementById('addonToDate');

    if (reportDate) {
        reportDate.addEventListener('change', function () {
            loadCheckInCheckOut();
            updateKPIs();
        });
    }

    if (revenueFrom) {
        revenueFrom.addEventListener('change', function () {
            loadRevenueData();
        });
    }

    if (revenueTo) {
        revenueTo.addEventListener('change', function () {
            loadRevenueData();
        });
    }

    if (addonCategoryFilter) {
        addonCategoryFilter.addEventListener('change', function () {
            console.log('Category changed to:', this.value);
            loadAddonAnalytics();
        });
    }

    if (addonFromDate) {
        addonFromDate.addEventListener('change', function () {
            loadAddonAnalytics();
        });
    }

    if (addonToDate) {
        addonToDate.addEventListener('change', function () {
            loadAddonAnalytics();
        });
    }
}

/**
 * Show loading states
 */
function showLoadingStates() {
    const loadingHtml = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    const elementsToLoad = ['checkInCheckOutDetails', 'occupancyDetails', 'revenueDetails'];
    elementsToLoad.forEach(function (id) {
        const element = document.getElementById(id);
        if (element) element.innerHTML = loadingHtml;
    });
}

/**
 * Hide loading states (replaced by actual content)
 */
function hideLoadingStates() {
    // Loading states are replaced by actual content
}

/**
 * Load all dashboard data
 */
async function loadAllData() {
    try {
        const promises = [
            loadCheckInCheckOut(),
            loadOccupancyStats(),
            loadRevenueData(),
            loadAdvancedAnalytics(),
            loadAddonAnalytics()
        ];

        await Promise.all(promises);
        await updateKPIs();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorToast('Failed to load dashboard data');
    }
}

/**
 * Fetch data from API
 */
async function fetchData(operation, params = {}) {
    const url = new URL(`${BASE_URL}/dashboard/frontdesk_reports.php`, window.location.origin);
    url.searchParams.append('operation', operation);

    Object.entries(params).forEach(function ([key, value]) {
        if (value) url.searchParams.append(key, value);
    });

    console.log('Fetching data from:', url.toString());

    try {
        const response = await axios.get(url.toString());
        console.log('Response for', operation, ':', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching', operation, ':', error);
        throw error;
    }
}

/**
 * Load check-in and check-out data
 */
async function loadCheckInCheckOut() {
    try {
        const dateElement = document.getElementById('reportDate');
        const date = dateElement ? dateElement.value : getManilaDateString();
        // Use correct backend operation name
        const data = await fetchData('daily_arrivals_departures', { date });

        renderCheckInCheckOutChart(data);
        renderArrivalsDeparturesDetails(data);

        return data;
    } catch (error) {
        console.error('Error loading check-in/check-out:', error);
        showChartError('checkInCheckOutChart', 'Failed to load check-in/check-out data');
    }
}

/**
 * Load occupancy statistics
 */
async function loadOccupancyStats() {
    try {
        const data = await fetchData('occupancy_stats');

        renderOccupancyChart(data);
        renderOccupancyDetails(data);

        return data;
    } catch (error) {
        console.error('Error loading occupancy stats:', error);
        showChartError('occupancyChart', 'Failed to load occupancy data');
    }
}

/**
 * Load revenue data
 */
async function loadRevenueData() {
    try {
        console.log('Loading revenue data...');

        const fromElement = document.getElementById('revenueFrom');
        const toElement = document.getElementById('revenueTo');
        const from = fromElement ? fromElement.value : '';
        const to = toElement ? toElement.value : '';

        console.log('Revenue params:', { from, to });

        // Always destroy existing chart first
        destroyChart('revenue');

        const data = await fetchData('revenue_summary', { from, to });
        console.log('Revenue data received:', data);

        renderRevenueChart(data);
        renderRevenueDetails(data);

        return data;
    } catch (error) {
        console.error('Error loading revenue data:', error);

        // Even on error, try to render empty chart
        destroyChart('revenue');
        renderRevenueChart({ dailyTrend: [] });

        showErrorToast('Failed to load revenue data. Please check your date range.');
    }
}

/**
 * Load advanced analytics data
 */
async function loadAdvancedAnalytics() {
    try {
        const data = await fetchData('advanced_analytics');

        renderPeakHoursChart(data);
        renderRoomTypeChart(data);

        return data;
    } catch (error) {
        console.error('Error loading advanced analytics:', error);
        showChartError('peakHoursChart', 'Failed to load analytics data');
        showChartError('roomTypeChart', 'Failed to load room type data');
    }
}

/**
 * Render arrivals/departures chart
 */
function renderCheckInCheckOutChart(data) {
    const ctx = document.getElementById('arrivalsDeparturesChart');
    if (!ctx) return;

    destroyChart('arrivals');

    // Support both possible key names from backend
    const checkins = data.checkins || data.arrivals || [];
    const checkouts = data.checkouts || data.departures || [];
    const hasActivity = checkins.length > 0 || checkouts.length > 0;

    charts.arrivals = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: hasActivity ? ['Check-In', 'Check-Out'] : ['No Activity'],
            datasets: [{
                data: hasActivity ? [checkins.length, checkouts.length] : [1],
                backgroundColor: hasActivity ?
                    [colors.success, colors.danger] :
                    [colors.secondary],
                borderWidth: 0,
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            if (!hasActivity) return 'No activity today';
                            const label = context.label;
                            const value = context.parsed;
                            return label + ': ' + value + ' guest' + (value !== 1 ? 's' : '');
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                duration: 1000
            }
        }
    });
}

/**
 * Render arrivals/departures details
 */
function renderArrivalsDeparturesDetails(data) {
    const container = document.getElementById('arrivalsDeparturesDetails');
    if (!container) return;

    const checkins = data.arrivals || [];
    const checkouts = data.departures || [];

    let html = '<div class="mb-3">';
    html += '<h6 class="text-success mb-2">';
    html += '<i class="fas fa-sign-in-alt me-1"></i>Check-In (' + checkins.length + ')';
    html += '</h6>';

    if (checkins.length) {
        checkins.forEach(function (a) {
            html += '<div class="d-flex justify-content-between align-items-center mb-1">';
            html += '<small><strong>#' + a.reservation_id + '</strong> ' + a.first_name + ' ' + a.last_name + '</small>';
            html += '<span class="badge bg-success">' + (a.room_number || 'TBA') + '</span>';
            html += '</div>';
        });
    } else {
        html += '<small class="text-muted">No check-ins scheduled</small>';
    }

    html += '</div><div>';
    html += '<h6 class="text-danger mb-2">';
    html += '<i class="fas fa-sign-out-alt me-1"></i>Check-Out (' + checkouts.length + ')';
    html += '</h6>';

    if (checkouts.length) {
        checkouts.forEach(function (d) {
            html += '<div class="d-flex justify-content-between align-items-center mb-1">';
            html += '<small><strong>#' + d.reservation_id + '</strong> ' + d.first_name + ' ' + d.last_name + '</small>';
            html += '<span class="badge bg-danger">' + (d.room_number || 'N/A') + '</span>';
            html += '</div>';
        });
    } else {
        html += '<small class="text-muted">No check-outs scheduled</small>';
    }

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Render occupancy chart
 */
function renderOccupancyChart(data) {
    const ctx = document.getElementById('occupancyChart');
    if (!ctx) return;

    destroyChart('occupancy');

    const overall = data.overall || {};
    const totalRooms = overall.total_rooms || 0;
    const occupiedRooms = overall.occupied_rooms || 0;
    const reservedRooms = overall.reserved_rooms || 0;
    const maintenanceRooms = overall.maintenance_rooms || 0;
    const availableRooms = Math.max(0, totalRooms - occupiedRooms - reservedRooms - maintenanceRooms);

    charts.occupancy = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Occupied', 'Reserved', 'Available', 'Maintenance'],
            datasets: [{
                data: [occupiedRooms, reservedRooms, availableRooms, maintenanceRooms],
                backgroundColor: [
                    colors.danger,
                    colors.warning,
                    colors.success,
                    colors.secondary
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label;
                            const value = context.parsed;
                            const percentage = totalRooms > 0 ? ((value / totalRooms) * 100).toFixed(1) : 0;
                            return label + ': ' + value + ' rooms (' + percentage + '%)';
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 1500
            }
        }
    });
}

/**
 * Render occupancy details
 */
function renderOccupancyDetails(data) {
    const container = document.getElementById('occupancyDetails');
    if (!container) return;

    const overall = data.overall || {};
    const analytics = data.analytics || {};

    let html = '<div class="row text-center g-2">';
    html += '<div class="col-6">';
    html += '<div class="p-2 bg-light rounded">';
    html += '<h5 class="text-primary mb-0">' + (overall.total_rooms || 0) + '</h5>';
    html += '<small class="text-muted">Total Rooms</small>';
    html += '</div></div>';
    html += '<div class="col-6">';
    html += '<div class="p-2 bg-light rounded">';
    html += '<h5 class="text-danger mb-0">' + (overall.occupied_rooms || 0) + '</h5>';
    html += '<small class="text-muted">Occupied</small>';
    html += '</div></div>';
    html += '<div class="col-6">';
    html += '<div class="p-2 bg-light rounded">';
    html += '<h5 class="text-success mb-0">' + (analytics.availableRooms || 0) + '</h5>';
    html += '<small class="text-muted">Available</small>';
    html += '</div></div>';
    html += '<div class="col-6">';
    html += '<div class="p-2 bg-light rounded">';
    html += '<h5 class="text-info mb-0">' + (analytics.occupancyRate || 0) + '%</h5>';
    html += '<small class="text-muted">Occupancy</small>';
    html += '</div></div>';
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Render revenue chart
 */
function renderRevenueChart(data) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    destroyChart('revenue');

    const dailyTrend = data.dailyTrend || [];
    let labels, chartData, chartLabel;
    if (dailyTrend.length === 0) {
        labels = ['No data'];
        chartData = [0];
        chartLabel = 'No revenue data';
    } else {
        labels = dailyTrend.map(function (d) {
            return new Date(d.date).toLocaleDateString();
        });
        chartData = dailyTrend.map(function (d) {
            return parseFloat(d.daily_revenue || 0);
        });
        chartLabel = 'Daily Revenue';
    }

    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: chartData,
                borderColor: colors.warning,
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: colors.warning,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            if (dailyTrend.length === 0) return 'No data';
                            return 'Revenue: ₱' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

/**
 * Render revenue details
 */
function renderRevenueDetails(data) {
    const container = document.getElementById('revenueDetails');
    if (!container) return;

    const analytics = data.analytics || {};
    const totalRevenue = parseFloat(data.total_revenue || 0);

    let html = '<div class="row text-center">';
    html += '<div class="col-md-3">';
    html += '<div class="p-3 bg-warning bg-opacity-10 rounded">';
    html += '<h4 class="text-warning mb-1">₱' + totalRevenue.toLocaleString() + '</h4>';
    html += '<small class="text-muted">Total Revenue</small>';
    html += '</div></div>';
    html += '<div class="col-md-3">';
    html += '<div class="p-3 bg-info bg-opacity-10 rounded">';
    html += '<h4 class="text-info mb-1">' + (analytics.totalTransactions || 0) + '</h4>';
    html += '<small class="text-muted">Transactions</small>';
    html += '</div></div>';
    html += '<div class="col-md-3">';
    html += '<div class="p-3 bg-success bg-opacity-10 rounded">';
    html += '<h4 class="text-success mb-1">₱' + parseFloat(analytics.avgTransactionValue || 0).toLocaleString() + '</h4>';
    html += '<small class="text-muted">Avg. Transaction</small>';
    html += '</div></div>';
    html += '<div class="col-md-3">';
    html += '<div class="p-3 bg-primary bg-opacity-10 rounded">';
    html += '<h4 class="text-primary mb-1">₱' + parseFloat(analytics.todayRevenue || 0).toLocaleString() + '</h4>';
    html += '<small class="text-muted">Today\'s Revenue</small>';
    html += '</div></div>';
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Render peak hours chart
 */
function renderPeakHoursChart(data) {
    const ctx = document.getElementById('peakHoursChart');
    if (!ctx) return;

    destroyChart('peakHours');

    const peakHours = data.peakHours || [];
    const hours = [];
    const bookingCounts = [];

    // Create 24-hour array
    for (let i = 0; i < 24; i++) {
        hours.push(i.toString().padStart(2, '0') + ':00');
        const found = peakHours.find(function (p) {
            return parseInt(p.hour) === i;
        });
        bookingCounts.push(found ? parseInt(found.bookings_count) : 0);
    }

    const backgroundColors = bookingCounts.map(function (count) {
        return count > 0 ? colors.secondary : 'rgba(108, 117, 125, 0.3)';
    });

    charts.peakHours = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                label: 'Bookings',
                data: bookingCounts,
                backgroundColor: backgroundColors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: function (context) {
                            return 'Hour: ' + context[0].label;
                        },
                        label: function (context) {
                            return 'Bookings: ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            animation: {
                duration: 1500,
                delay: function (context) {
                    return context.dataIndex * 50;
                }
            }
        }
    });
}

/**
 * Render room type chart
 */
function renderRoomTypeChart(data) {
    const ctx = document.getElementById('roomTypeChart');
    if (!ctx) return;

    destroyChart('roomType');
    const roomTypes = data.roomTypePerformance || [];
    if (!Array.isArray(roomTypes) || roomTypes.length === 0) {
        showChartError('roomTypeChart', 'No room type performance data available');
        return;
    }

    const chartColors = ['#0d6efd', '#6610f2', '#d63384', '#fd7e14', '#20c997'];
    const labels = roomTypes.map(function (rt) {
        return rt.type_name || 'Unknown';
    });
    const chartData = roomTypes.map(function (rt) {
        return parseFloat(rt.total_revenue || 0);
    });

    charts.roomType = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors.slice(0, roomTypes.length),
                borderWidth: 0,
                cutout: '50%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label;
                            const value = context.parsed;
                            return label + ': ₱' + value.toLocaleString();
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 2000
            }
        }
    });
}

/**
 * Update KPI cards
 */
async function updateKPIs() {
    try {
        const today = getManilaDateString();
        const promises = [
            fetchData('daily_arrivals_departures', { date: today }),
            fetchData('occupancy_stats'),
            fetchData('revenue_summary', { from: today, to: today })
        ];

        const [arrivals, occupancy, revenue] = await Promise.all(promises);

        // Use correct KPI IDs for check-in/check-out
        setKPI('kpi-checkin', (arrivals.arrivals || []).length);
        setKPI('kpi-checkout', (arrivals.departures || []).length);
        // Occupancy rate is always current, not historical
        setKPI('kpi-occupancy', (occupancy.analytics && occupancy.analytics.occupancyRate || 0) + '%');
        // Use today's revenue from backend analytics
        setKPI('kpi-revenue', '₱' + parseFloat(revenue.analytics && revenue.analytics.todayRevenue || 0).toLocaleString());
    } catch (error) {
        console.error('Error updating KPIs:', error);
    }
}

/**
 * Set KPI value with animation
 */
function setKPI(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = 'pulse 0.5s ease-in-out';
    }
}

/**
 * Destroy chart if it exists
 */
function destroyChart(chartName) {
    if (charts[chartName]) {
        charts[chartName].destroy();
        delete charts[chartName];
    }
}

/**
 * Show chart error message
 */
function showChartError(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const container = canvas.parentElement;
        let html = '<div class="text-center text-muted p-4">';
        html += '<i class="fas fa-exclamation-triangle fa-2x mb-2"></i>';
        html += '<p>' + message + '</p>';
        html += '</div>';
        container.innerHTML = html;
    }
}

/**
 * Refresh all charts (global function for refresh button)
 */
async function refreshAllCharts() {
    showLoadingStates();

    // Destroy all existing charts
    Object.keys(charts).forEach(function (chartName) {
        destroyChart(chartName);
    });

    await loadAllData();
    showSuccessToast('All charts refreshed successfully!');
}

/**
 * Show success toast notification
 */
function showSuccessToast(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
}

/**
 * Show error toast notification
 */
function showErrorToast(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: message,
            showConfirmButton: false,
            timer: 4000
        });
    }
}

// Export functions for backward compatibility
window.frontdeskReports = {
    fetchDailyArrivalsDepartures: function (date) {
        return fetchData('daily_arrivals_departures', { date: date });
    },
    fetchOccupancyStats: function () {
        return fetchData('occupancy_stats');
    },
    fetchRevenueSummary: function (from, to) {
        return fetchData('revenue_summary', { from: from, to: to });
    }
};

// Add custom CSS animations

/**
 * Validate date range - ensure 'from' date is not after 'to' date
 */
function validateDateRange(fromId, toId) {
    const fromElement = document.getElementById(fromId);
    const toElement = document.getElementById(toId);

    if (!fromElement || !toElement) return false;

    const fromDate = new Date(fromElement.value);
    const toDate = new Date(toElement.value);

    if (fromDate > toDate) {
        // If 'from' date is after 'to' date, adjust the 'from' date
        fromElement.value = toElement.value;
        showErrorToast('Start date cannot be after end date. Adjusted automatically.');
        return false;
    }

    return true;
}

/**
 * Setup dynamic date constraints
 */
function setupDateConstraints() {
    // Revenue date constraints
    const revenueFrom = document.getElementById('revenueFrom');
    const revenueTo = document.getElementById('revenueTo');

    if (revenueFrom && revenueTo) {
        // Initial enforcement
        revenueFrom.max = revenueTo.value;
        revenueTo.min = revenueFrom.value;

        revenueFrom.addEventListener('change', function () {
            revenueTo.min = this.value;
            if (new Date(revenueTo.value) < new Date(this.value)) {
                revenueTo.value = this.value;
                showErrorToast('End date updated to match start date.');
            }
            // Always enforce max on start date
            revenueFrom.max = revenueTo.value;
        });

        revenueTo.addEventListener('change', function () {
            revenueFrom.max = this.value;
            if (new Date(revenueFrom.value) > new Date(this.value)) {
                revenueFrom.value = this.value;
                showErrorToast('Start date updated to match end date.');
            }
            // Always enforce min on end date
            revenueTo.min = revenueFrom.value;
        });
    }

    // Addon date constraints
    const addonFromDate = document.getElementById('addonFromDate');
    const addonToDate = document.getElementById('addonToDate');

    if (addonFromDate && addonToDate) {
        // Initial enforcement
        addonFromDate.max = addonToDate.value;
        addonToDate.min = addonFromDate.value;

        addonFromDate.addEventListener('change', function () {
            addonToDate.min = this.value;
            if (new Date(addonToDate.value) < new Date(this.value)) {
                addonToDate.value = this.value;
                showErrorToast('End date updated to match start date.');
            }
            // Always enforce max on start date
            addonFromDate.max = addonToDate.value;
        });

        addonToDate.addEventListener('change', function () {
            addonFromDate.max = this.value;
            if (new Date(addonFromDate.value) > new Date(this.value)) {
                addonFromDate.value = this.value;
                showErrorToast('Start date updated to match end date.');
            }
            // Always enforce min on end date
            addonToDate.min = addonFromDate.value;
        });
    }
}

/**
 * Load addon analytics data
 */
async function loadAddonAnalytics() {
    try {
        console.log('Loading addon analytics...');

        const categoryFilter = document.getElementById('addonCategoryFilter');
        const fromElement = document.getElementById('addonFromDate');
        const toElement = document.getElementById('addonToDate');

        const category = categoryFilter ? categoryFilter.value : 'all';
        const from = fromElement ? fromElement.value : '';
        const to = toElement ? toElement.value : '';

        console.log('Addon analytics params:', { category, from, to });

        // Always destroy existing charts first
        destroyChart('topAddons');
        destroyChart('categoryPerformance');
        destroyChart('addonTrend');

        const data = await fetchData('addon_analytics', { category, from, to });
        console.log('Addon analytics data received:', data);

        // Populate category filter if not already done
        populateAddonCategoryFilter(data.categories || []);

        // Update KPIs (with fallbacks)
        updateAddonKPIs(data.overallStats || {});

        // Always render charts (they will show "no data" if empty)
        renderTopAddonsChart(data.topAddons || []);
        renderCategoryPerformanceChart(data.categorySales || []);
        renderAddonTrendChart(data.dailyTrend || []);
        renderTopAddonsTable(data.topAddons || []);

        return data;
    } catch (error) {
        console.error('Error loading addon analytics:', error);

        // Even on error, render empty charts to clear previous data
        destroyChart('topAddons');
        destroyChart('categoryPerformance');
        destroyChart('addonTrend');

        renderTopAddonsChart([]);
        renderCategoryPerformanceChart([]);
        renderAddonTrendChart([]);
        renderTopAddonsTable([]);

        // Reset KPIs
        updateAddonKPIs({});

        showErrorToast('Failed to load addon analytics');
    }
}

/**
 * Populate addon category filter
 */
function populateAddonCategoryFilter(categories) {
    const select = document.getElementById('addonCategoryFilter');
    if (!select || select.children.length > 1) return; // Already populated

    categories.forEach(function (category) {
        const option = document.createElement('option');
        option.value = category.category_id;
        option.textContent = category.category_name;
        select.appendChild(option);
    });
}

/**
 * Update addon KPIs
 */
function updateAddonKPIs(stats) {
    setKPI('addon-total-orders', stats.totalAddonOrders || 0);
    setKPI('addon-total-items', stats.totalItemsSold || 0);
    setKPI('addon-total-revenue', '₱' + parseFloat(stats.totalAddonRevenue || 0).toLocaleString());
    setKPI('addon-avg-order', '₱' + parseFloat(stats.avgOrderValue || 0).toLocaleString());
}

/**
 * Render top addons chart
 */
function renderTopAddonsChart(topAddons) {
    const ctx = document.getElementById('topAddonsChart');
    if (!ctx) return;

    destroyChart('topAddons');

    let labels, data, chartLabel;
    if (!topAddons || topAddons.length === 0) {
        labels = ['No data'];
        data = [0];
        chartLabel = 'No addon sales data';
    } else {
        labels = topAddons.slice(0, 10).map(function (addon) {
            return addon.addon_name;
        });
        data = topAddons.slice(0, 10).map(function (addon) {
            return parseFloat(addon.total_revenue || 0);
        });
        chartLabel = 'Revenue (₱)';
    }

    charts.topAddons = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: data,
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            },
            onClick: function (event, activeElements) {
                if (activeElements.length > 0 && topAddons && topAddons.length > 0) {
                    const index = activeElements[0].index;
                    const addon = topAddons[index];
                    showAddonDetails(addon);
                }
            }
        }
    });
}

/**
 * Render category performance chart
 */
function renderCategoryPerformanceChart(categorySales) {
    const ctx = document.getElementById('categoryPerformanceChart');
    if (!ctx) return;

    destroyChart('categoryPerformance');

    let labels, data, chartLabel;
    if (!categorySales || categorySales.length === 0) {
        labels = ['No data'];
        data = [0];
        chartLabel = 'No category data';
    } else {
        labels = categorySales.map(function (category) {
            return category.category_name;
        });
        data = categorySales.map(function (category) {
            return parseFloat(category.category_revenue || 0);
        });
        chartLabel = 'Category Revenue';
    }

    const backgroundColors = [
        colors.primary, colors.success, colors.warning,
        colors.danger, colors.info, colors.secondary
    ];

    charts.categoryPerformance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            if (!categorySales || categorySales.length === 0) return 'No data';
                            const label = context.label;
                            const value = context.parsed;
                            return label + ': ₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render addon trend chart
 */
function renderAddonTrendChart(dailyTrend) {
    const ctx = document.getElementById('addonTrendChart');
    if (!ctx) return;

    destroyChart('addonTrend');

    let labels, revenueData, ordersData, chartLabelRevenue, chartLabelOrders;
    if (!dailyTrend || dailyTrend.length === 0) {
        labels = ['No data'];
        revenueData = [0];
        ordersData = [0];
        chartLabelRevenue = 'No addon revenue data';
        chartLabelOrders = 'No addon orders data';
    } else {
        labels = dailyTrend.map(function (day) {
            return new Date(day.sale_date).toLocaleDateString();
        });
        revenueData = dailyTrend.map(function (day) {
            return parseFloat(day.daily_revenue || 0);
        });
        ordersData = dailyTrend.map(function (day) {
            return parseInt(day.daily_orders || 0);
        });
        chartLabelRevenue = 'Daily Revenue (₱)';
        chartLabelOrders = 'Daily Orders';
    }

    charts.addonTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabelRevenue,
                data: revenueData,
                borderColor: colors.success,
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                tension: 0.4,
                yAxisID: 'y'
            }, {
                label: chartLabelOrders,
                data: ordersData,
                borderColor: colors.info,
                backgroundColor: 'rgba(13, 202, 240, 0.1)',
                tension: 0.4,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        callback: function (value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

/**
 * Render top addons table
 */
function renderTopAddonsTable(topAddons) {
    const container = document.getElementById('topAddonsTable');
    if (!container) return;

    if (!topAddons || topAddons.length === 0) {
        container.innerHTML = '<p class="text-muted">No addon sales data available</p>';
        return;
    }

    const tableHTML = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Addon Name</th>
                        <th>Category</th>
                        <th>Times Ordered</th>
                        <th>Total Quantity</th>
                        <th>Current Price</th>
                        <th>Avg Price</th>
                        <th>Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${topAddons.map(function (addon) {
        return `
                            <tr>
                                <td><strong>${addon.addon_name}</strong></td>
                                <td><span class="badge bg-secondary">${addon.category_name}</span></td>
                                <td>${addon.times_ordered}</td>
                                <td>${addon.total_quantity}</td>
                                <td>₱${parseFloat(addon.current_price || 0).toFixed(2)}</td>
                                <td>₱${parseFloat(addon.avg_price || 0).toFixed(2)}</td>
                                <td><strong>₱${parseFloat(addon.total_revenue || 0).toLocaleString()}</strong></td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHTML;
}

/**
 * Show addon details modal
 */
function showAddonDetails(addon) {
    showInfoToast(`${addon.addon_name}: ₱${parseFloat(addon.total_revenue || 0).toLocaleString()} revenue from ${addon.times_ordered} orders`);
}

/**
 * Refresh addon analytics
 */
function refreshAddonAnalytics() {
    loadAddonAnalytics();
}

// Additional styles for animations
const customStyles = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .chart-container {
        position: relative;
    }
    
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
`;

// Inject custom styles
const styleSheet = document.createElement('style');
styleSheet.textContent = customStyles;
document.head.appendChild(styleSheet);

/**
 * Initialize dashboard - load all data
 */
function initializeDashboard() {
    console.log('Initializing reports dashboard...');

    // Load all data sections
    loadCheckInCheckOut();
    loadOccupancyStats();
    loadRevenueData();
    loadAddonAnalytics();

}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeDashboard);
