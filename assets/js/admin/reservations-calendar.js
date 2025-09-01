document.addEventListener('DOMContentLoaded', function () {
    // Helper to (re)initialize the calendar
    // Helper to preserve and restore scroll position for SweetAlert modals
    let lastScrollY = 0;
    function preserveScrollOnSwal() {
        // Save scroll position before opening
        lastScrollY = window.scrollY;
        // Listen for modal close to restore
        const handler = () => {
            window.scrollTo({ top: lastScrollY, behavior: 'auto' });
            document.removeEventListener('keydown', escHandler, true);
            document.removeEventListener('click', clickHandler, true);
        };
        // Handle ESC and close button
        function escHandler(e) {
            if (e.key === 'Escape') setTimeout(handler, 10);
        }
        function clickHandler(e) {
            if (e.target.classList && e.target.classList.contains('swal2-close')) setTimeout(handler, 10);
        }
        document.addEventListener('keydown', escHandler, true);
        document.addEventListener('click', clickHandler, true);
        // Also handle programmatic close
        if (window.Swal) {
            const origClose = Swal.close;
            Swal.close = function () {
                setTimeout(handler, 10);
                return origClose.apply(this, arguments);
            };
        }
    }

    function renderReservationCalendar() {
        const calendarEl = document.getElementById('reservationCalendar');
        if (!calendarEl) {
            console.error('reservationCalendar element not found in DOM');
            return;
        }

        // Remove any previous calendar instance
        if (calendarEl._fullCalendarInstance) {
            calendarEl._fullCalendarInstance.destroy();
            calendarEl._fullCalendarInstance = null;
        }

        // Remove any previous legend (avoid duplicates)
        const prevLegend = calendarEl.parentNode.querySelector('.calendar-legend');
        if (prevLegend) prevLegend.remove();

        // Add a color legend above the calendar
        const legend = document.createElement('div');
        legend.className = 'calendar-legend mb-3';
        legend.innerHTML = `
            <span class="legend-item" style="background:#ff5722"></span> Overdue
            <span class="legend-item" style="background:#28a745"></span> Checked-in
            <span class="legend-item" style="background:#6c757d"></span> Checked-out
            <span class="legend-item" style="background:#0dcaf0"></span> Reserved/Confirmed
            <span class="legend-item" style="background:#ffc107;color:#212529;border:1px solid #ffc107"></span> Pending
            <span class="legend-item" style="background:#dc3545"></span> Cancelled
        `;
        calendarEl.parentNode.insertBefore(legend, calendarEl);

        // Add legend styles
        const legendStyle = document.createElement('style');
        legendStyle.textContent = `
            .calendar-legend {
                font-size: 0.97em;
                margin-bottom: 10px;
                user-select: none;
            }
            .calendar-legend .legend-item {
                display: inline-block;
                width: 18px;
                height: 18px;
                border-radius: 4px;
                margin-right: 6px;
                margin-left: 18px;
                vertical-align: middle;
                border: 1px solid #e9ecef;
            }
            .calendar-legend .legend-item:first-child { margin-left: 0; }
        `;
        document.head.appendChild(legendStyle);

        // Minimal, clean style (no bg colors, no gradients)
        const style = document.createElement('style');
        style.textContent = `
            #reservationCalendar {
                background: none;
                border-radius: 10px;
                border: 1px solid #e9ecef;
                font-family: inherit;
            }
            .fc-toolbar {
                background: none !important;
                color: inherit;
                border-radius: 0;
                padding: 10px 18px !important;
            }
            .fc-toolbar-title {
                color: inherit !important;
                font-weight: 600 !important;
                font-size: 1.1rem !important;
            }
            .fc-button {
                background: #fff !important;
                color: var(--primary-color, #d20707) !important;
                border: 1px solid var(--primary-color, #d20707) !important;
                border-radius: 6px !important;
                font-weight: 500 !important;
                font-size: 0.95rem !important;
                padding: 5px 14px !important;
            }
            .fc-button-active, .fc-button:active {
                background: var(--primary-color, #d20707) !important;
                color: #fff !important;
            }
            .fc-button:hover {
                background: #f8f9fa !important;
                color: var(--primary-color, #d20707) !important;
                border-color: var(--primary-color, #d20707) !important;
            }
            .fc-daygrid-day {
                border-color: #e9ecef !important;
            }
            .fc-day-today {
                background: none !important;
                border: 2px solid var(--primary-color, #d20707) !important;
            }
            .fc-event {
                border-radius: 6px !important;
                font-size: 0.93em !important;
                font-weight: 500 !important;
                padding: 2px 8px !important;
                color: #fff !important;
            }
            .swal2-popup {
                border-radius: 10px !important;
                box-shadow: 0 8px 32px rgba(210, 7, 7, 0.10) !important;
                border: 1px solid #e9ecef !important;
                font-family: inherit;
                padding: 0 !important;
            }
            .swal2-title {
                font-size: 1.1rem !important;
                font-weight: 600 !important;
                padding: 18px 18px 0 18px !important;
            }
            .swal2-html-container {
                color: #222;
                font-size: 1rem;
                padding: 12px 18px 18px 18px !important;
            }
            .swal2-close {
                font-size: 1.5rem !important;
                background: transparent !important;
                border-radius: 50% !important;
            }
            .badge {
                border-radius: 6px !important;
                font-size: 0.95em !important;
                font-weight: 500 !important;
                padding: 6px 14px !important;
            }
            .guest-link {
                color: var(--primary-color, #d20707) !important;
                font-weight: 600 !important;
                text-decoration: underline dotted;
            }
            .guest-link:hover {
                color: var(--secondary-color, #050505) !important;
            }
            .list-group-item {
                border-radius: 8px !important;
                border: 1px solid #f3f3f3 !important;
                margin-bottom: 8px;
                background: #fff;
            }
        `;
        document.head.appendChild(style);

        // Load events from API
        axios.get('/Hotel-Reservation-Billing-System/api/admin/reservations/reservations.php', {
            params: { operation: "getAllReservations" }
        })
            .then(res => {
                const reservations = Array.isArray(res.data) ? res.data : [];
                // Map reservations to FullCalendar event objects, with overdue detection
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const fcEvents = reservations.map(r => {
                    let status = (r.reservation_status || r.room_status || 'pending').toLowerCase();
                    let isOverdue = false;
                    if (status !== 'checked-out' && status !== 'cancelled' && r.check_out_date) {
                        const outDate = new Date(r.check_out_date);
                        outDate.setHours(0, 0, 0, 0);
                        if (today > outDate) isOverdue = true;
                    }
                    let eventStatus = isOverdue ? 'overdue' : (r.reservation_status || r.room_status);
                    return {
                        id: String(r.reservation_id),
                        title: `${getGuestFullName(r) || 'Unknown Guest'}\n` +
                            (r.type_name || r.room_number ? `[` + (r.type_name ? r.type_name : '') + (r.type_name && r.room_number ? ' ' : '') + (r.room_number ? r.room_number : '') + `]` : ''),
                        start: r.check_in_date,
                        end: r.check_out_date ? addOneDay(r.check_out_date) : r.check_in_date,
                        allDay: true,
                        extendedProps: {
                            guest: getGuestFullName(r) || 'Unknown Guest',
                            guest_id: r.guest_id,
                            room: r.room_number,
                            room_number: r.room_number,
                            type_name: r.type_name,
                            status: eventStatus,
                            reservation_id: r.reservation_id,
                            check_in_time: r.check_in_time,
                            check_out_time: r.check_out_time,
                            isOverdue: isOverdue
                        },
                        color: getStatusColor(eventStatus),
                        textColor: (eventStatus && eventStatus.toLowerCase() === 'pending') ? '#212529' : '#fff'
                    };
                });

                // Helper to get full guest name
                function getGuestFullName(r) {
                    let name = '';
                    if (r.first_name || r.last_name || r.middle_name || r.suffix) {
                        name = [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(' ');
                    } else if (r.guest_name) {
                        name = r.guest_name;
                    }
                    return name.trim() || '';
                }

                // Helper to add one day to check-out date for FullCalendar's exclusive end
                function addOneDay(dateStr) {
                    const d = new Date(dateStr);
                    d.setDate(d.getDate() + 1);
                    return d.toISOString().split('T')[0];
                }

                // Initialize FullCalendar
                const calendar = new FullCalendar.Calendar(calendarEl, {
                    initialView: 'dayGridMonth',
                    headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek'
                    },
                    height: 700,
                    selectable: true,
                    events: fcEvents,
                    eventClick: function (info) {
                        showReservationDetailsModal(info.event);
                    },
                    dateClick: function (info) {
                        const dateStr = info.dateStr;
                        const dayEvents = calendar.getEvents().filter(ev =>
                            ev.allDay &&
                            ev.startStr <= dateStr &&
                            ev.endStr > dateStr
                        );
                        showReservationModal(dayEvents, dateStr);
                    }
                });

                calendar.render();
                // Store instance for later destroy
                calendarEl._fullCalendarInstance = calendar;

                function formatDate(dateStr) {
                    if (!dateStr) return "";
                    const d = new Date(dateStr);
                    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
                    return d.toLocaleDateString(undefined, opts);
                }

                function formatDateTime(dateStr, timeStr) {
                    if (!dateStr) return "";
                    let d = (dateStr instanceof Date) ? dateStr : new Date(dateStr + (timeStr ? `T${timeStr}` : ''));
                    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
                    let datePart = d.toLocaleDateString(undefined, opts);
                    let timePart = "";
                    if (timeStr) {
                        let [h, m] = timeStr.split(":");
                        h = parseInt(h, 10);
                        const ampm = h >= 12 ? "pm" : "am";
                        h = h % 12;
                        if (h === 0) h = 12;
                        timePart = `${h}:${m} ${ampm}`;
                    }
                    return timePart ? `${datePart} | ${timePart}` : datePart;
                }

                // Show all reservations for a day
                function showReservationModal(events, dateStr) {
                    let html = `<div class="mb-2 fw-bold text-primary"><i class="fas fa-calendar-alt me-2"></i>${dateStr}</div>`;
                    if (events.length === 0) {
                        html += `<div class="text-center text-muted py-3"><i class="fas fa-calendar-times fa-2x mb-2"></i><br>No reservations for this day.</div>`;
                    } else {
                        html += `<ul class="list-group mb-3">`;
                        events.forEach(ev => {
                            // Subtract 1 day from check-out date for display
                            let checkOutDate = ev.end instanceof Date ? new Date(ev.end.getTime() - 24 * 60 * 60 * 1000) : null;
                            let badgeHtml = '';
                            if (ev.extendedProps.isOverdue) {
                                badgeHtml = `<span class="badge ms-2" style="background:#ff5722;">Overdue</span>`;
                            } else {
                                badgeHtml = `<span class="badge ms-2" style="background:${getStatusColor(ev.extendedProps.status)};color:#fff;">${ev.extendedProps.status || '-'}</span>`;
                            }
                            html += `<li class="list-group-item d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-2" style="border-left: 4px solid ${ev.extendedProps.isOverdue ? '#ff5722' : getStatusColor(ev.extendedProps.status)};">
                                <div>
                                    <b>${ev.extendedProps.guest || 'Unknown Guest'}</b>
                                    ${badgeHtml}
                                    <div class="small text-muted mb-1">
                                        <i class="fas fa-user me-1"></i> <b>Guest:</b>
                                        <span class="guest-link-wrapper" data-guest-id="${ev.extendedProps.guest_id}" data-reservation-id="${ev.extendedProps.reservation_id}">
                                            <a href="#" class="guest-link">${ev.extendedProps.guest || 'Unknown Guest'}</a>
                                        </span>
                                        <span class="mx-2"></span>
                                    </div>
                                    <div class="small">
                                        <i class="fas fa-sign-in-alt me-1"></i> <b>Check-in:</b>
                                        <span class="text-success">${formatDate(ev.start)}</span>
                                        <span class="mx-2">|</span>
                                        <i class="fas fa-sign-out-alt me-1"></i> <b>Check-out:</b>
                                        <span class="text-danger">${formatDate(checkOutDate)}</span>
                                    </div>
                                </div>
                                <div>
                                    ${badgeHtml}
                                </div>
                            </li>`;
                        });
                        html += `</ul>`;
                    }
                    // Prevent reservation for past days
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selected = new Date(dateStr);
                    selected.setHours(0, 0, 0, 0);
                    let addBtnHtml = '';
                    if (selected >= today) {
                        addBtnHtml = `<button class="btn btn-primary btn-sm" id="addReservationOnDayBtn"><i class="fas fa-plus"></i> New Reservation</button>`;
                    } else {
                        addBtnHtml = `<button class="btn btn-primary btn-sm" id="addReservationOnDayBtn" disabled title="Cannot reserve in the past"><i class="fas fa-plus"></i> New Reservation</button>`;
                    }
                    html += `<div class="d-flex justify-content-end mt-3">${addBtnHtml}</div>`;

                    preserveScrollOnSwal();
                    Swal.fire({
                        html: html,
                        width: 900,
                        customClass: { popup: 'text-start' },
                        showCloseButton: true,
                        showConfirmButton: false,
                        didOpen: () => {
                            document.querySelectorAll('.guest-link-wrapper').forEach(wrapper => {
                                wrapper.addEventListener('click', function (e) {
                                    if (e.target.classList.contains('guest-link')) {
                                        e.preventDefault();
                                        const guestId = this.getAttribute('data-guest-id');
                                        const reservationId = this.getAttribute('data-reservation-id');
                                        // Always find the event for this guest/reservation
                                        const ev = events.find(ev => String(ev.extendedProps.reservation_id) === String(reservationId));
                                        showGuestDetailsModal(
                                            guestId,
                                            ev ? {
                                                checkInDate: ev.start,
                                                checkInTime: ev.extendedProps.check_in_time,
                                                checkOutDate: ev.end,
                                                checkOutTime: ev.extendedProps.check_out_time
                                            } : null
                                        );
                                    }
                                });
                            });
                            const addBtn = document.getElementById('addReservationOnDayBtn');
                            if (addBtn && !addBtn.disabled) {
                                addBtn.addEventListener('click', () => {
                                    Swal.close();
                                    setTimeout(() => openAddReservationModal(dateStr), 350);
                                });
                            }
                        }
                    });
                }

                // Show reservation details (single event)
                function showReservationDetailsModal(ev) {
                    // Subtract 1 day from check-out date for display
                    let checkOutDate = ev.end instanceof Date ? new Date(ev.end.getTime() - 24 * 60 * 60 * 1000) : null;
                    let guestName = ev.extendedProps.guest && ev.extendedProps.guest !== '-' ? ev.extendedProps.guest : (ev.title && ev.title !== '-' ? ev.title : 'Unknown Guest');
                    // Show loading SweetAlert first
                    Swal.fire({
                        title: `<i class="fas fa-calendar-check me-2"></i>${guestName}`,
                        html: `<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>`,
                        width: 800,
                        customClass: { popup: 'text-start' },
                        showCloseButton: true,
                        showConfirmButton: false
                    });
                    // Fetch all reserved rooms for this reservation, and show companions per room
                    (async () => {
                        let reservedRooms = [];
                        let companionsByRoom = {};
                        try {
                            // 1. Get all reserved rooms for this reservation
                            const rrRes = await axios.get('/Hotel-Reservation-Billing-System/api/admin/reservations/reserved_rooms.php', {
                                params: { operation: 'getAllReservedRooms' }
                            });
                            if (Array.isArray(rrRes.data)) {
                                reservedRooms = rrRes.data.filter(r => String(r.reservation_id) === String(ev.extendedProps.reservation_id) && r.is_deleted == 0);
                            }
                            // 2. Get all companions for these reserved rooms
                            if (reservedRooms.length > 0) {
                                const compRes = await axios.get('/Hotel-Reservation-Billing-System/api/admin/reservations/companions.php', {
                                    params: { operation: 'getAllCompanions' }
                                });
                                if (Array.isArray(compRes.data)) {
                                    reservedRooms.forEach(room => {
                                        companionsByRoom[room.reserved_room_id] = compRes.data.filter(c => String(c.reserved_room_id) === String(room.reserved_room_id) && c.is_deleted == 0);
                                    });
                                }
                            }
                        } catch (err) {
                            // fallback: no companions
                        }
                        // Build modern card-style SweetAlert content
                        let html = `<div style='text-align:left;font-size:1.08em;'>`;
                        html += `<div style=\"background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;padding:1.2em 1.5em 1.2em 1.5em;\">`;
                        html += `<div style='display:flex;align-items:center;gap:12px;margin-bottom:18px;'>`;
                        html += `<div style='background:#0d6efd1a;border-radius:50%;padding:10px;display:flex;align-items:center;justify-content:center;'><i class='fas fa-calendar-check text-primary' style='font-size:2em;'></i></div>`;
                        html += `<span style='font-size:1.35em;font-weight:700;letter-spacing:0.5px;'>Reservation #${ev.extendedProps.reservation_id || ''}</span>`;
                        html += `</div>`;
                        html += `<div style='display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-bottom:18px;'>`;
                        html += `<div><i class='fas fa-user text-secondary'></i> <span class='label'>Guest</span><br><span class='value'>${guestName}</span></div>`;
                        if (ev.extendedProps.isOverdue) {
                            html += `<div><i class='fas fa-info-circle text-danger'></i> <span class='label'>Status</span><br><span class='value'><span class='badge' style='background:#ff5722;'>Overdue</span></span></div>`;
                        } else {
                            html += `<div><i class='fas fa-info-circle text-warning'></i> <span class='label'>Status</span><br><span class='value'>${ev.extendedProps.status || ''}</span></div>`;
                        }
                        html += `<div><i class='fas fa-sign-in-alt text-success'></i> <span class='label'>Check-in</span><br><span class='value'>${formatDate(ev.start)}</span></div>`;
                        html += `<div><i class='fas fa-sign-out-alt text-danger'></i> <span class='label'>Check-out</span><br><span class='value'>${formatDate(checkOutDate)}</span></div>`;
                        html += `</div>`;
                        // Show all rooms booked for this reservation
                        if (reservedRooms.length > 0) {
                            reservedRooms.forEach(room => {
                                html += `<div style='margin-top:18px;margin-bottom:6px;'><span class='text-dark' style='font-size:1em;'><i class='fas fa-bed me-1'></i> ${room.type_name ? room.type_name : ''}${room.type_name && room.room_number ? ' ' : ''}${room.room_number ? room.room_number : ''}</span></div>`;
                                html += `<div style='margin-left:10px;margin-bottom:10px;'><i class='fas fa-users text-info'></i> <span class='label'>People assigned in room</span><br>`;
                                const companions = companionsByRoom[room.reserved_room_id] || [];
                                if (companions.length > 0) {
                                    html += `<div style='display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:6px;'>`;
                                    companions.forEach((c, i) => {
                                        html += `<div style='background:#f1f3f6;border-radius:8px;padding:9px 18px 9px 12px;display:flex;align-items:center;min-width:0;max-width:calc(50% - 18px);flex:1 1 45%;margin-bottom:6px;font-size:1.05em;box-shadow:0 1px 2px #0001;'>`;
                                        html += `<i class='fas fa-user-friends text-secondary me-2' style='margin-right:9px;'></i> <span style='white-space:normal;text-overflow:ellipsis;overflow:hidden;max-width:220px;display:inline-block;font-weight:500;'>${c.full_name}</span>`;
                                        html += `</div>`;
                                    });
                                    html += `</div>`;
                                } else {
                                    html += `<span class='text-muted'>No people listed.</span>`;
                                }
                                html += `</div>`;
                            });
                        } else {
                            html += `<div class='text-muted'>No rooms found for this reservation.</div>`;
                        }
                        html += `</div>`;
                        html += `</div>`;
                        Swal.update({
                            title: '',
                            html: html,
                            showConfirmButton: true,
                            confirmButtonText: '<i class="fas fa-times"></i> Close',
                            customClass: {
                                popup: 'swal2-reservation-details',
                                htmlContainer: 'swal2-reservation-details-html'
                            },
                            background: '#f8f9fa',
                            width: 860,
                            showCloseButton: true,
                            didOpen: () => {
                                // Ensure FontAwesome icons are loaded
                                if (!document.getElementById('swal-fa-link')) {
                                    const link = document.createElement('link');
                                    link.rel = 'stylesheet';
                                    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
                                    link.id = 'swal-fa-link';
                                    document.head.appendChild(link);
                                }
                            }
                        });
                    })();
                }

                // Show guest details modal, always show check-in/out if possible
                function showGuestDetailsModal(guestId, reservationInfo) {
                    Swal.fire({
                        html: `<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>`,
                        width: 700,
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });
                    axios.get(`/Hotel-Reservation-Billing-System/api/admin/guests/guests.php`, {
                        params: { operation: "getGuestWithLatestReservation", json: JSON.stringify({ guest_id: guestId }) }
                    }).then(res => {
                        let g = Array.isArray(res.data) ? res.data[0] : res.data;
                        if (!g || Object.keys(g).length === 0) {
                            showGuestInfoOnly(guestId);
                            console.log('[DEBUG] showGuestDetailsModal called', { guestId, reservationInfo });
                            return;
                        }
                        let html = `
                            <div class="mb-2"><b>Name:</b> ${g.first_name || ''} ${g.middle_name || ''} ${g.last_name || ''} ${g.suffix || ''}</div>
                            <div class="mb-2"><b>Email:</b> ${g.email || '-'}</div>
                            <div class="mb-2"><b>Phone:</b> ${g.phone_number || '-'}</div>
                            <div class="mb-2"><b>Date of Birth:</b> ${formatDate(g.date_of_birth) || '-'}</div>
                            <div class="mb-2"><b>ID Type:</b> ${g.id_type || '-'}</div>
                            <div class="mb-2"><b>ID Number:</b> ${g.id_number || '-'}</div>
                        `;
                        console.log('[DEBUG] API response for getGuestWithLatestReservation', res.data);
                        console.log('[DEBUG] Parsed guest object', g);
                        let checkInDate = g.check_in_date || (reservationInfo && reservationInfo.checkInDate);
                        let checkOutDate = g.check_out_date || (reservationInfo && reservationInfo.checkOutDate);
                        let room = g.type_name && g.room_number ? `${g.type_name} (${g.room_number})` : (g.room_number || '');
                        let status = g.reservation_status || '';
                        // If reservationInfo is still missing, try to find it from the calendar events
                        if ((!checkInDate && !checkOutDate) && calendar && typeof calendar.getEvents === 'function') {
                            const allEvents = calendar.getEvents();
                            const found = allEvents.find(ev =>
                                ev.extendedProps && String(ev.extendedProps.guest_id) === String(guestId)
                            );
                            if (found) {
                                checkInDate = found.start;
                                checkOutDate = found.end;
                                console.log('[DEBUG] Computed guestName', guestName);
                                room = found.extendedProps.type_name && found.extendedProps.room_number
                                    ? `${found.extendedProps.type_name} (${found.extendedProps.room_number})`
                                    : (found.extendedProps.room_number || '');
                                status = found.extendedProps.status || '';
                            }
                        }
                        // Always subtract 1 day from checkOutDate if present
                        if (checkOutDate) {
                            let d = checkOutDate instanceof Date ? checkOutDate : new Date(checkOutDate);
                            d = new Date(d.getTime());
                            checkOutDate = d;
                        }
                        if (checkInDate || checkOutDate) {
                            html += `<hr>`;
                            if (room) {
                                html += `<div class="mb-2"><b>Room:</b> ${room}</div>`;
                            }
                            if (status) {
                                html += `<div class="mb-2"><b>Status:</b> <span class="badge" style="background:${getStatusColor(status)};color:#fff;">${status}</span></div>`;
                            }
                            html += `
                                <div class="mb-2"><b>Check-in:</b> <span class="text-success">${formatDate(checkInDate)}</span></div>
                                <div class="mb-2"><b>Check-out:</b> <span class="text-danger">${formatDate(checkOutDate)}</span></div>
                            `;
                        }
                        Swal.update({
                            title: `<i class="fas fa-user"></i> Guest Details`,
                            html: html,
                            showCloseButton: true,
                            showConfirmButton: false
                        });
                    }).catch(() => {
                        showGuestInfoOnly(guestId);
                    });
                }

                // Show guest info only (no reservation context)
                function showGuestInfoOnly(guestId) {
                    axios.get(`/Hotel-Reservation-Billing-System/api/admin/guests/guests.php`, {
                        params: { operation: "getGuest", json: JSON.stringify({ guest_id: guestId }) }
                    }).then(res => {
                        let g2 = Array.isArray(res.data) ? res.data[0] : res.data;
                        let html = '';
                        if (!g2 || Object.keys(g2).length === 0) {
                            html = `<div class="text-danger">Guest not found.</div>`;
                        } else {
                            html = `
                                <div class="mb-2"><b>Name:</b> ${g2.first_name || ''} ${g2.middle_name || ''} ${g2.last_name || ''} ${g2.suffix || ''}</div>
                                <div class="mb-2"><b>Email:</b> ${g2.email || '-'} </div>
                                <div class="mb-2"><b>Phone:</b> ${g2.phone_number || '-'} </div>
                                <div class="mb-2"><b>Date of Birth:</b> ${formatDate(g2.date_of_birth) || '-'} </div>
                                <div class="mb-2"><b>ID Type:</b> ${g2.id_type || '-'} </div>
                                <div class="mb-2"><b>ID Number:</b> ${g2.id_number || '-'} </div>
                            `;
                        }
                        Swal.update({
                            title: `<i class="fas fa-user"></i> Guest Details`,
                            html: html,
                            showCloseButton: true,
                            showConfirmButton: false
                        });
                    }).catch(() => {
                        Swal.update({
                            title: 'Guest Details',
                            html: '<div class="text-danger">Failed to load guest details.</div>',
                            showCloseButton: true,
                            showConfirmButton: false
                        });
                    });
                }

                // Open Add Reservation Modal pre-filled for a date
                function openAddReservationModal(dateStr) {
                    Swal.close();
                    setTimeout(() => {
                        const addBtn = document.getElementById('addReservationBtn');
                        if (addBtn) {
                            addBtn.click();
                            setTimeout(() => {
                                const checkInDate = document.getElementById('checkInDate');
                                if (checkInDate) {
                                    checkInDate.value = dateStr;
                                    checkInDate.dispatchEvent(new Event('change'));
                                }
                                const saveBtn = document.getElementById('saveReservationBtn');
                                if (saveBtn) {
                                    saveBtn.addEventListener('click', () => setTimeout(() => window.location.reload(), 500), { once: true });
                                }
                            }, 350);
                        }
                    }, 350);
                }
            })
            .catch(() => {
                calendarEl.innerHTML = `
                    <div class="text-center p-5">
                        <i class="fas fa-exclamation-triangle text-danger fa-2x mb-2"></i>
                        <div class="text-danger">Failed to load calendar events.</div>
                    </div>
                `;
            });

        function getStatusColor(status) {
            status = (status || '').toLowerCase();
            if (status === 'overdue') return '#ff5722';
            if (status === 'checked-in') return '#28a745';
            if (status === 'checked-out') return '#6c757d';
            if (status === 'reserved' || status === 'confirmed') return '#0dcaf0';
            if (status === 'pending') return '#ffc107';
            if (status === 'cancelled') return '#dc3545';
            return 'var(--primary-color, #d20707)';
        }
    }


    // Make the hidden addReservationBtn open the modal
    const addBtn = document.getElementById('addReservationBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function () {
            const modalEl = document.getElementById('reservationModal');
            if (modalEl && window.bootstrap) {
                const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            } else if (modalEl) {
                // fallback for Bootstrap 4
                $(modalEl).modal('show');
            }
        });
    }

    // Initial render
    renderReservationCalendar();

    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tabBtn => {
        tabBtn.addEventListener('shown.bs.tab', function (e) {
            const target = e.target.getAttribute('data-bs-target');
            if (target === '#calendar-content') {
                setTimeout(renderReservationCalendar, 100); // slight delay to ensure DOM is ready
            }
        });
    });
});