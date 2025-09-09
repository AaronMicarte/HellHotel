// Download All Dashboard Data as Excel (SheetJS)
// Place in assets/js/frontdesk/download-all.js

// Requires SheetJS (xlsx) via CDN
// <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>

async function fetchAllDashboardData() {
    // Fetch all dashboard data in parallel
    const today = new Date().toISOString().slice(0, 10);
    const [arrivals, occupancy, revenue, advanced, addon] = await Promise.all([
        window.frontdeskReports.fetchDailyArrivalsDepartures(today),
        window.frontdeskReports.fetchOccupancyStats(),
        window.frontdeskReports.fetchRevenueSummary(today, today),
        fetchData('advanced_analytics'),
        fetchData('addon_analytics')
    ]);
    return { arrivals, occupancy, revenue, advanced, addon };
}

function jsonToSheet(json, sheetName) {
    return XLSX.utils.json_to_sheet(json, { header: Object.keys(json[0] || {}) });
}

function buildWorkbook(data) {
    const wb = XLSX.utils.book_new();
    // Arrivals/Departures
    if (data.arrivals.arrivals && data.arrivals.arrivals.length)
        XLSX.utils.book_append_sheet(wb, jsonToSheet(data.arrivals.arrivals, 'Check-Ins'), 'Check-Ins');
    if (data.arrivals.departures && data.arrivals.departures.length)
        XLSX.utils.book_append_sheet(wb, jsonToSheet(data.arrivals.departures, 'Check-Outs'), 'Check-Outs');
    // Occupancy
    if (data.occupancy.overall)
        XLSX.utils.book_append_sheet(wb, jsonToSheet([data.occupancy.overall], 'Occupancy'), 'Occupancy');
    // Revenue
    if (data.revenue.dailyTrend && data.revenue.dailyTrend.length)
        XLSX.utils.book_append_sheet(wb, jsonToSheet(data.revenue.dailyTrend, 'Revenue Trend'), 'Revenue Trend');
    // Addons
    if (data.addon.topAddons && data.addon.topAddons.length)
        XLSX.utils.book_append_sheet(wb, jsonToSheet(data.addon.topAddons, 'Top Addons'), 'Top Addons');
    if (data.addon.dailyTrend && data.addon.dailyTrend.length)
        XLSX.utils.book_append_sheet(wb, jsonToSheet(data.addon.dailyTrend, 'Addon Sales Trend'), 'Addon Sales Trend');
    return wb;
}

async function downloadAllDashboardData() {
    try {
        const data = await fetchAllDashboardData();
        const wb = buildWorkbook(data);
        XLSX.writeFile(wb, 'HellHotel-Dashboard-Report.xlsx');
    } catch (err) {
        alert('Failed to export dashboard data. Please try again.');
        console.error('Export error:', err);
    }
}

// Add button to dashboard
function addDownloadAllButton() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;
    if (document.getElementById('downloadAllBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'downloadAllBtn';
    btn.className = 'btn btn-sm btn-success ms-2';
    btn.innerHTML = '<i class="fas fa-file-excel me-1"></i>Download All Data';
    btn.onclick = downloadAllDashboardData;
    navRight.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', addDownloadAllButton);
