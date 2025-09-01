const API_BASE = '/Hotel-Reservation-Billing-System/api';
let selectedFeatureIds = [];

document.addEventListener('DOMContentLoaded', () => {
    loadRoomTypes();
    loadFeatures();
    fetchAndRenderRoomTypes();

    document.getElementById('roomSearchForm').addEventListener('submit', function (e) {
        e.preventDefault();
        fetchAndRenderRoomTypes();
    });
});

// Fetch and render all room types (not rooms), with guest/capacity/date filtering
async function fetchAndRenderRoomTypes() {
    showLoading(true);

    const features = selectedFeatureIds;
    const capacity = document.getElementById('filterCapacity').value;
    const checkin = document.getElementById('filterCheckin').value;
    const checkout = document.getElementById('filterCheckout').value;
    const roomTypeId = document.getElementById('filterRoomType').value;

    try {
        // Fetch all room types
        const { data } = await axios.get('/Hotel-Reservation-Billing-System/api/admin/rooms/room-type.php');
        let roomTypes = Array.isArray(data) ? data : [];

        // Room type filter (fix: filter by room_type_id)
        if (roomTypeId) {
            roomTypes = roomTypes.filter(type => String(type.room_type_id) === String(roomTypeId));
        }

        // Multi-feature filter (if needed)
        if (features.length > 0) {
            roomTypes = roomTypes.filter(type => {
                if (!Array.isArray(type.features)) return false;
                const typeFeatureIds = type.features.map(f => String(f.feature_id));
                return features.every(fid => typeFeatureIds.includes(String(fid)));
            });
        }

        // Filter by guest capacity (show types with max_capacity >= selected value)
        if (capacity) {
            roomTypes = roomTypes.filter(type =>
                Number(type.max_capacity) >= Number(capacity)
            );
        }

        // If check-in/check-out is set, filter types with at least one available room for those dates
        if (checkin && checkout) {
            // For each type, check if there is at least one available room for the dates
            const filteredTypes = [];
            for (const type of roomTypes) {
                try {
                    const res = await axios.get('/Hotel-Reservation-Billing-System/api/admin/rooms/rooms.php', {
                        params: {
                            operation: 'getAvailableRooms',
                            room_type_id: type.room_type_id,
                            check_in_date: checkin,
                            check_out_date: checkout
                        }
                    });
                    const availableRooms = Array.isArray(res.data) ? res.data : [];
                    if (availableRooms.length > 0) {
                        filteredTypes.push(type);
                    }
                } catch {
                    // If API fails, skip this type
                }
            }
            roomTypes = filteredTypes;
        }

        renderRoomTypes(roomTypes);
    } catch (err) {
        renderRoomTypes([]);
    } finally {
        showLoading(false);
    }
}

// Render all room types as hero sections (image left, content right, full width)
function renderRoomTypes(roomTypes) {
    const grid = document.getElementById('roomsGrid');
    const noRooms = document.getElementById('noRoomsMsg');
    grid.innerHTML = '';

    if (!roomTypes.length) {
        noRooms.classList.remove('d-none');
        return;
    }
    noRooms.classList.add('d-none');

    roomTypes.forEach(type => {
        let img = '';
        if (type.image_url) {
            img = type.image_url.startsWith('http')
                ? type.image_url
                : `/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/${type.image_url.replace(/^.*[\\\/]/, '')}`;
        } else {
            img = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop';
        }

        // Compose features
        let featuresHtml = '';
        if (Array.isArray(type.features) && type.features.length) {
            featuresHtml = type.features.map(f =>
                `<span class="feature-tag">${f.feature_name}</span>`
            ).join('');
        }
        // Description fallback
        let desc = type.description || '';

        grid.innerHTML += `
            <section class="room-hero-section d-flex flex-column flex-md-row align-items-stretch mb-5" style="min-height:340px;">
                <div class="room-hero-image flex-shrink-0" style="background-image: url('${img}'); min-width:340px; min-height:260px; background-size:cover; background-position:center; border-radius:20px 0 0 20px;"></div>
                <div class="room-hero-content d-flex flex-column flex-grow-1 p-4" style="background:rgba(26,26,26,0.93); border-radius:0 20px 20px 0;">
                    <h3 class="mb-2" style="color:var(--hell-red);font-weight:700;">${type.type_name}</h3>
                    <div class="badge-container mb-2">
                        <span class="custom-badge badge-info">${type.room_size_sqm ? type.room_size_sqm + ' sqm' : 'Spacious'}</span>
                        <span class="custom-badge badge-dark">${type.max_capacity || '2'} guests</span>
                    </div>
                    <p class="room-description mb-3">${desc}</p>
                    <div class="features-container mb-4">
                        ${featuresHtml}
                    </div>
                    <div class="room-footer mt-auto d-flex align-items-center justify-content-between">
                        <span class="price">₱${type.price_per_stay ? Number(type.price_per_stay).toLocaleString() : '0'}/night</span>
                        <a href="./selected-room.html?type=${encodeURIComponent(type.type_name)}" class="book-btn" style="font-size:1.1rem;">
                            <i class="fas fa-arrow-right"></i>
                            View Details
                        </a>
                    </div>
                </div>
            </section>
        `;
    });
}

async function loadRoomTypes() {
    try {
        const { data } = await axios.get('/Hotel-Reservation-Billing-System/api/admin/rooms/room-type.php');
        const select = document.getElementById('filterRoomType');
        select.innerHTML = `<option value="">All Room Types</option>` +
            (Array.isArray(data) ? data : []).map(t =>
                `<option value="${t.room_type_id}">${t.type_name}</option>`
            ).join('');
    } catch (error) {
        console.log('Error loading room types:', error);
    }
}

async function loadFeatures() {
    try {
        const { data } = await axios.get('/Hotel-Reservation-Billing-System/api/admin/rooms/feature.php');
        renderFeatureChips(Array.isArray(data) ? data : []);
    } catch {
        renderFeatureChips([]);
    }
}

function renderFeatureChips(features) {
    const container = document.getElementById('featureChipsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!features.length) {
        container.innerHTML = '<span class="text-muted">No features available</span>';
        return;
    }

    features.forEach(f => {
        if (f.is_deleted && (f.is_deleted === true || f.is_deleted === 1 || f.is_deleted === "1")) return;

        const isActive = selectedFeatureIds.includes(String(f.feature_id));
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `feature-chip ${isActive ? 'active' : ''}`;
        chip.setAttribute('data-feature-id', f.feature_id);
        chip.innerHTML = `<i class="fas fa-check-circle me-1"></i>${f.feature_name}`;
        chip.onclick = () => toggleFeatureChip(f.feature_id);

        container.appendChild(chip);
    });
}

function toggleFeatureChip(featureId) {
    featureId = String(featureId);
    const idx = selectedFeatureIds.indexOf(featureId);

    if (idx === -1) {
        selectedFeatureIds.push(featureId);
    } else {
        selectedFeatureIds.splice(idx, 1);
    }

    loadFeatures();
    fetchAndRenderRoomTypes();
}

function showLoading(show) {
    const loader = document.getElementById('loadingSpinner');
    const grid = document.getElementById('roomsGrid');

    if (show) {
        loader.classList.remove('d-none');
        grid.style.opacity = '0.3';
    } else {
        loader.classList.add('d-none');
        grid.style.opacity = '1';
    }
}
