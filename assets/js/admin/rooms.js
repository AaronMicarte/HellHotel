import {
    updateRoomModal,
    deleteRoomModal,
    updateRoomTypeModal,
    deleteRoomTypeModal
} from '../modules/admin/rooms-module.js';

// ====================================================================
// CONFIGURATION & GLOBALS
// ====================================================================
const BASE_URL = "http://localhost/Hotel-Reservation-Billing-System/api";
const ROOM_STATUSES = ['available', 'occupied', 'maintenance', 'reserved'];

let cachedRoomTypes = [];
let cachedRoomImages = {};
let cachedFeatures = [];
let cachedRooms = []; // For stats
let selectedFeatureIds = []; // For chips/tags selection

// ====================================================================
// INITIALIZATION
// ====================================================================
document.addEventListener("DOMContentLoaded", () => {
    loadRoomTypes();
    loadRooms();
    loadFeaturesForFilter(); // New: populate feature filter
    initializeEventListeners();
});

function initializeEventListeners() {
    // Room Management Events
    const addRoomBtn = document.getElementById("addRoomBtn");
    if (addRoomBtn) addRoomBtn.addEventListener("click", openRoomModal);

    const saveRoomBtn = document.getElementById("saveRoomBtn");
    if (saveRoomBtn) saveRoomBtn.addEventListener("click", saveRoom);

    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) searchBtn.addEventListener("click", searchRooms);

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", loadRooms);

    const searchRoom = document.getElementById("searchRoom");
    if (searchRoom) {
        searchRoom.addEventListener("keyup", (e) => {
            if (e.key === "Enter") searchRooms();
        });
    }

    // Room Type Management Events
    const addRoomTypeBtn = document.getElementById("addRoomTypeBtn");
    if (addRoomTypeBtn) addRoomTypeBtn.addEventListener("click", openRoomTypeModal);

    const saveRoomTypeBtn = document.getElementById("saveRoomTypeBtn");
    if (saveRoomTypeBtn) saveRoomTypeBtn.addEventListener("click", saveRoomType);

    const roomTypesTab = document.getElementById("roomtypes-tab");
    if (roomTypesTab) roomTypesTab.addEventListener("click", loadRoomTypes);

    const roomImage = document.getElementById("roomImage");
    if (roomImage) roomImage.addEventListener("change", previewImage);

    // Filter Events
    const applyFilters = document.getElementById("applyFilters");
    if (applyFilters) applyFilters.addEventListener("click", filterRooms);

    // Feature Management Events
    const addFeatureBtn = document.getElementById("addFeatureBtn");
    if (addFeatureBtn) {
        addFeatureBtn.addEventListener("click", () => {
            const newFeatureName = document.getElementById("newFeatureName");
            if (newFeatureName) newFeatureName.value = "";
            const featureModal = document.getElementById("featureModal");
            if (featureModal) {
                new bootstrap.Modal(featureModal).show();
            }
        });
    }

    const saveFeatureBtn = document.getElementById("saveFeatureBtn");
    if (saveFeatureBtn) {
        saveFeatureBtn.addEventListener("click", saveFeature);
    }

    // Room Image Events
    const roomsTableBody = document.getElementById("roomsTableBody");
    if (roomsTableBody) {
        roomsTableBody.addEventListener("click", async (e) => {
            if (e.target.classList.contains("btn-add-photo")) {
                const roomId = e.target.dataset.roomId;
                if (roomId) {
                    await showRoomImagesModal(roomId);
                }
            }
        });
    }

    // Compact filter form events
    const filterForm = document.getElementById("roomsFilterForm");
    if (filterForm) {
        filterForm.addEventListener("submit", (e) => {
            e.preventDefault();
            filterRooms();
        });
        document.getElementById("applyFilters")?.addEventListener("click", filterRooms);
        document.getElementById("searchRoom")?.addEventListener("keyup", (e) => {
            if (e.key === "Enter") filterRooms();
        });
        document.getElementById("featureFilter")?.addEventListener("change", filterRooms);
        document.getElementById("typeFilter")?.addEventListener("change", filterRooms);
        document.getElementById("statusFilter")?.addEventListener("change", filterRooms);
    }
}

// ====================================================================
// ROOM MANAGEMENT
// ====================================================================
async function loadRooms() {
    const roomsTableBody = document.getElementById("roomsTableBody");
    if (!roomsTableBody) return;

    roomsTableBody.innerHTML = `<tr><td colspan="7" class="text-center">Loading rooms...</td></tr>`;
    try {
        const response = await axios.get(`${BASE_URL}/admin/rooms/rooms.php`, {
            params: { operation: 'getAllRooms' }
        });
        cachedRooms = response.data || [];
        displayRooms(cachedRooms);
        updateRoomStatsOverview(cachedRooms); // Update stats
    } catch (error) {
        roomsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error loading rooms</td></tr>`;
        console.error("Error loading rooms:", error);
    }
}

function displayRooms(rooms) {
    const tableBody = document.getElementById("roomsTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    if (!Array.isArray(rooms) || rooms.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No rooms found.</td></tr>`;
        return;
    }


    rooms.forEach(room => {
        // Features column: plain text, comma separated, no badge
        let featuresHtml = "-";
        if (Array.isArray(room.features) && room.features.length) {
            featuresHtml = room.features
                .filter(f => !f.is_deleted || f.is_deleted === 0 || f.is_deleted === false || f.is_deleted === "0")
                .map(f => f.feature_name).join(', ');
        } else if (room.key_features) {
            featuresHtml = room.key_features
                .split(',')
                .filter(f => !!f.trim())
                .map(f => f.trim()).join(', ');
        }

        tableBody.innerHTML += `
            <tr>
            <td>${room.room_number || ''}</td>
            <td>${room.type_name || ''}</td>
            <td>${featuresHtml || ''}</td>
            <td>
                <span class="badge bg-${getStatusColor(room.room_status)}">
                ${room.room_status || 'unknown'}
                </span>
            </td>
            <td>${room.max_capacity || ''}</td>
            <td>₱${room.price_per_stay || ''}</td>
            <td>${formatDate(room.updated_at)}</td>
            <td class="text-center">
                <i class="fas fa-eye text-info btn-view-room" data-room-id="${room.room_id}" title="View" style="cursor:pointer;margin-right:10px;"></i>
                <i class="fas fa-edit text-primary btn-edit-room" data-room-id="${room.room_id}" title="Edit" style="cursor:pointer;margin-right:10px;"></i>
                <i class="fas fa-trash text-danger btn-delete-room" data-room-id="${room.room_id}" title="Delete" style="cursor:pointer;"></i>
            </td>
            </tr>
        `;
    });

    const totalRooms = document.getElementById("totalRooms");
    if (totalRooms) totalRooms.textContent = rooms.length;

    attachRoomEventListeners(tableBody);
    updateRoomStatsOverview(rooms); // Always update stats on display
}

function attachRoomEventListeners(tableBody) {
    tableBody.querySelectorAll('.btn-edit-room').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = parseInt(btn.dataset.roomId);
            if (!isNaN(roomId)) {
                updateRoomModal(roomId, cachedRoomTypes, loadRooms);
            }
        });
    });

    tableBody.querySelectorAll('.btn-delete-room').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = parseInt(btn.dataset.roomId);
            if (!isNaN(roomId)) {
                deleteRoomModal(roomId, loadRooms);
            }
        });
    });

    tableBody.querySelectorAll('.btn-view-room').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = parseInt(btn.dataset.roomId);
            if (!isNaN(roomId)) {
                showRoomDetailsModal(roomId);
            }
        });
    });
}

function openRoomModal() {
    const form = document.getElementById("roomForm");
    const roomId = document.getElementById("roomId");
    const roomModalLabel = document.getElementById("roomModalLabel");
    const roomModal = document.getElementById("roomModal");

    if (!form || !roomId || !roomModalLabel || !roomModal) return;

    form.reset();
    roomId.value = "";
    roomModalLabel.textContent = "Add New Room";
    populateRoomTypeSelect();
    new bootstrap.Modal(roomModal).show();
}

async function saveRoom() {
    const roomNumber = document.getElementById("roomNumber");
    const roomTypeId = document.getElementById("roomType");
    const roomId = document.getElementById("roomId");

    if (!roomNumber || !roomTypeId || !roomId) {
        console.error("Required form elements not found");
        return;
    }

    const roomNumberValue = roomNumber.value.trim();
    const roomTypeIdValue = roomTypeId.value;
    const roomIdValue = roomId.value;

    if (!roomNumberValue || !roomTypeIdValue) {
        showToast('warning', 'Please fill in all required fields');
        return;
    }

    const typeObj = cachedRoomTypes.find(t => t.room_type_id == roomTypeIdValue);
    const typeName = typeObj ? typeObj.type_name : '';

    const roomData = {
        room_number: roomNumberValue,
        room_type_id: parseInt(roomTypeIdValue)
    };

    if (!roomIdValue) {
        roomData.room_status_id = 1;
    } else {
        roomData.room_id = parseInt(roomIdValue);
    }

    try {
        let response;
        if (roomIdValue) {
            response = await axios.put(`${BASE_URL}/admin/rooms/rooms.php`, {
                operation: 'updateRoom',
                json: JSON.stringify(roomData)
            });
        } else {
            const formData = new FormData();
            formData.append('operation', 'insertRoom');
            formData.append('json', JSON.stringify(roomData));
            response = await axios.post(`${BASE_URL}/admin/rooms/rooms.php`, formData);
        }

        if (response.data == 1 || (response.data && response.data.message)) {
            const roomModal = document.getElementById("roomModal");
            if (roomModal) {
                const modalInstance = bootstrap.Modal.getInstance(roomModal);
                if (modalInstance) modalInstance.hide();
            }

            await loadRooms();
            showToast('success', roomIdValue
                ? `Room ${roomNumberValue} updated successfully`
                : `Room ${roomNumberValue} ${typeName} added`
            );
        } else {
            throw new Error('API did not return success');
        }
    } catch (error) {
        console.error("Error saving room:", error);
        showToast('error', 'Failed to save room');
    }
}

// --- Room Stats Overview ---
function updateRoomStatsOverview(rooms) {
    // Count by status
    let total = rooms.length;
    let available = 0, occupied = 0, maintenance = 0, reserved = 0;
    rooms.forEach(r => {
        switch ((r.room_status || '').toLowerCase()) {
            case "available": available++; break;
            case "occupied": occupied++; break;
            case "maintenance": maintenance++; break;
            case "reserved": reserved++; break;
        }
    });
    document.getElementById("statTotalRooms").textContent = total;
    document.getElementById("statAvailableRooms").textContent = available;
    document.getElementById("statOccupiedRooms").textContent = occupied;
    document.getElementById("statMaintenanceRooms").textContent = maintenance;
    document.getElementById("statReservedRooms").textContent = reserved;
}

// --- Feature Chips/Tags UI ---
function renderFeatureChips() {
    const container = document.getElementById("featureChipsContainer");
    if (!container) return;
    container.innerHTML = '';
    if (!cachedFeatures.length) {
        container.innerHTML = '<span class="text-muted">No features available</span>';
        return;
    }
    // Remove deleted features from selectedFeatureIds
    const validFeatureIds = cachedFeatures
        .filter(f => !f.is_deleted || f.is_deleted === 0 || f.is_deleted === false || f.is_deleted === "0")
        .map(f => String(f.feature_id));
    selectedFeatureIds = selectedFeatureIds.filter(fid => validFeatureIds.includes(fid));
    // Sort features alphabetically
    const sorted = [...cachedFeatures].sort((a, b) => (a.feature_name || '').localeCompare(b.feature_name || ''));
    sorted.forEach(f => {
        if (!f.is_deleted || f.is_deleted === 0 || f.is_deleted === false || f.is_deleted === "0") {
            const isActive = selectedFeatureIds.includes(String(f.feature_id));
            const chip = document.createElement('span');
            chip.className = `badge rounded-pill me-2 mb-2 feature-chip ${isActive ? 'bg-primary text-white' : 'bg-light text-dark'}`
                + ' d-inline-flex align-items-center';
            chip.style.cursor = 'pointer';
            chip.setAttribute('data-feature-id', f.feature_id);
            chip.innerHTML = `<i class="fas fa-tag me-1"></i>${f.feature_name}`;
            chip.onclick = () => {
                toggleFeatureChip(f.feature_id);
            };
            container.appendChild(chip);
        }
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
    renderFeatureChips();
    filterRooms();
}

// --- Feature Filter Dropdown (now only loads features and renders chips) ---
async function loadFeaturesForFilter() {
    try {
        const res = await axios.get(`${BASE_URL}/admin/rooms/feature.php`);
        cachedFeatures = Array.isArray(res.data) ? res.data : [];
        renderFeatureChips();
    } catch (e) {
        cachedFeatures = [];
        renderFeatureChips();
    }
}

// --- Filter Rooms (with chips/tags feature filter) ---
async function filterRooms() {
    const typeFilter = document.getElementById("typeFilter");
    const statusFilter = document.getElementById("statusFilter");
    const searchRoom = document.getElementById("searchRoom");

    const typeId = typeFilter?.value || "";
    const status = statusFilter?.value || "";
    const featureIds = selectedFeatureIds || [];
    const searchTerm = searchRoom?.value.trim() || "";

    // If no filter, just reload all
    if (!typeId && !status && (!featureIds || featureIds.length === 0) && !searchTerm) {
        await loadRooms();
        return;
    }

    let url = `${BASE_URL}/admin/rooms/rooms.php?operation=getAllRooms`;
    const params = [];
    if (typeId) params.push(`type_id=${encodeURIComponent(typeId)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
    // For backend, only send one feature_id (for optimization), but do full multi-feature filtering on frontend
    if (featureIds && featureIds.length === 1) params.push(`feature_id=${encodeURIComponent(featureIds[0])}`);
    if (params.length > 0) url += "&" + params.join("&");

    try {
        const response = await axios.get(url);
        let rooms = response.data || [];
        // Multi-feature filter: only show rooms that have ALL selected features
        if (featureIds && featureIds.length > 0) {
            rooms = rooms.filter(r => {
                if (!Array.isArray(r.features)) return false;
                const roomFeatureIds = r.features.map(f => String(f.feature_id));
                // Must have ALL selected features
                return featureIds.every(fid => roomFeatureIds.includes(String(fid)));
            });
        }
        displayRooms(rooms);
        updateRoomStatsOverview(rooms);

        let toastMsg = `Found ${rooms.length} room${rooms.length === 1 ? '' : 's'}`;
        if (status) toastMsg += ` (${status})`;
        if (typeId) {
            const typeObj = cachedRoomTypes.find(t => t.room_type_id == typeId);
            if (typeObj) toastMsg += ` (${typeObj.type_name})`;
        }
        if (featureIds && featureIds.length > 0) {
            const featNames = cachedFeatures
                .filter(f => featureIds.includes(String(f.feature_id)))
                .map(f => f.feature_name)
                .join(', ');
            toastMsg += ` (with: ${featNames})`;
        }
        showToast('info', toastMsg);
    } catch (error) {
        console.error("Error filtering rooms:", error);
        displayRooms([]);
        updateRoomStatsOverview([]);
        showToast('error', 'No rooms found');
    }
}

async function searchRooms() {
    const searchRoom = document.getElementById("searchRoom");
    if (!searchRoom) return;

    const searchTerm = searchRoom.value.trim();
    if (!searchTerm) {
        await loadRooms();
        return;
    }

    try {
        const response = await axios.get(`${BASE_URL}/admin/rooms/rooms.php?search=${encodeURIComponent(searchTerm)}`);
        const rooms = response.data || [];
        displayRooms(rooms);

        const toastMsg = `Found ${rooms.length} room${rooms.length === 1 ? '' : 's'}`;
        showToast('info', toastMsg);
    } catch (error) {
        console.error("Error searching rooms:", error);
        displayRooms([]);
        showToast('error', 'No rooms found');
    }
}

// ====================================================================
// ROOM TYPE MANAGEMENT
// ====================================================================
async function loadRoomTypes() {
    const tableBody = document.getElementById("roomTypesTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8" class="text-center">Loading room types...</td></tr>`;
    try {
        const response = await axios.get(`${BASE_URL}/admin/rooms/room-type.php`);
        let types = response.data || [];
        if (Array.isArray(types)) {
            types = types.filter(t => t.is_deleted === false || t.is_deleted === 0 || t.is_deleted === "0" || t.is_deleted === "FALSE" || t.is_deleted === "false");
        }
        cachedRoomTypes = types;
        displayRoomTypes(cachedRoomTypes);
        populateTypeFilter();
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error loading room types</td></tr>`;
        console.error("Error loading room types:", error);
    }
}

function displayRoomTypes(types) {
    const tableBody = document.getElementById("roomTypesTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    if (!Array.isArray(types) || types.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center">No room types found.</td></tr>`;
        return;
    }

    types.forEach(type => {
        let featuresHtml = "-";
        if (Array.isArray(type.features) && type.features.length) {
            featuresHtml = type.features
                .filter(f => !f.is_deleted || f.is_deleted === 0 || f.is_deleted === false || f.is_deleted === "0")
                .map(f => `<span class="badge bg-secondary me-1 mb-1">${f.feature_name}</span>`).join('');
        }

        let imgSrc = '';
        if (typeof type.image_url === 'string' && type.image_url.trim() !== '') {
            if (type.image_url.startsWith('http')) {
                imgSrc = type.image_url;
            } else {
                imgSrc = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/" + type.image_url.replace(/^.*[\\\/]/, '');
            }
        } else {
            imgSrc = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/placeholder-room.jpg";
        }

        tableBody.innerHTML += `
            <tr>
                <td>
                    <img src="${imgSrc}" class="img-thumbnail" style="max-width:80px;max-height:80px;" onerror="this.onerror=null;this.src='../../assets/images/uploads/room-types/placeholder-room.jpg';">
                </td>
                <td>${type.type_name || '-'}</td>
                <td>${type.description || '-'}</td>
                <td>${featuresHtml}</td>
                <td>${type.max_capacity || '-'}</td>
                <td>₱${type.price_per_stay || '0.00'}</td>
                <td>${type.room_size_sqm || '-'} sqm</td>
                <td class="text-center">
                    <i class="fas fa-images text-success btn-manage-roomtype-images" data-roomtype-id="${type.room_type_id}" title="Manage Images" style="cursor:pointer;margin-right:10px;"></i>
                    <i class="fas fa-cogs text-success btn-manage-features" data-roomtype-id="${type.room_type_id}" title="Manage Features" style="cursor:pointer;margin-right:10px;"></i>
                    <i class="fas fa-edit text-primary btn-edit-roomtype" data-roomtype-id="${type.room_type_id}" title="Edit" style="cursor:pointer;margin-right:10px;"></i>
                    <i class="fas fa-trash text-danger btn-delete-roomtype" data-roomtype-id="${type.room_type_id}" title="Delete" style="cursor:pointer;"></i>
                </td>
            </tr>
        `;
        tableBody.querySelectorAll('.btn-manage-roomtype-images').forEach(btn => {
            btn.addEventListener('click', () => {
                const roomTypeId = parseInt(btn.dataset.roomtypeId);
                if (!isNaN(roomTypeId)) {
                    showRoomTypeImagesModal(roomTypeId);
                }
            });
        });
    });

    attachRoomTypeEventListeners(tableBody);
}

function attachRoomTypeEventListeners(tableBody) {
    tableBody.querySelectorAll('.btn-edit-roomtype').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomTypeId = parseInt(btn.dataset.roomtypeId);
            if (!isNaN(roomTypeId)) {
                updateRoomTypeModal(roomTypeId, loadRoomTypes);
            }
        });
    });

    tableBody.querySelectorAll('.btn-delete-roomtype').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomTypeId = parseInt(btn.dataset.roomtypeId);
            if (!isNaN(roomTypeId)) {
                deleteRoomTypeModal(roomTypeId, loadRoomTypes);
            }
        });
    });

    tableBody.querySelectorAll('.btn-manage-features').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomTypeId = parseInt(btn.dataset.roomtypeId);
            if (!isNaN(roomTypeId)) {
                showManageFeaturesModal(roomTypeId);
            }
        });
    });
}

function openRoomTypeModal(roomType = null) {
    const form = document.getElementById("roomTypeForm");
    const roomTypeId = document.getElementById("roomTypeId");
    const imagePreview = document.getElementById("imagePreview");
    const roomTypeModal = document.getElementById("roomTypeModal");
    const roomTypeModalLabel = document.getElementById("roomTypeModalLabel");

    if (!form || !roomTypeId || !imagePreview || !roomTypeModal || !roomTypeModalLabel) return;

    form.reset();
    roomTypeId.value = "";
    imagePreview.innerHTML = "";

    if (roomType) {
        roomTypeId.value = roomType.room_type_id;

        const typeName = document.getElementById("typeName");
        const typeDescription = document.getElementById("typeDescription");
        const maxCapacity = document.getElementById("maxCapacity");
        const pricePerStay = document.getElementById("pricePerStay");
        const roomSize = document.getElementById("roomSize");

        if (typeName) typeName.value = roomType.type_name || "";
        if (typeDescription) typeDescription.value = roomType.description || "";
        if (maxCapacity) maxCapacity.value = roomType.max_capacity || "";
        if (pricePerStay) pricePerStay.value = roomType.price_per_stay || "";
        if (roomSize) roomSize.value = roomType.room_size_sqm || "";

        roomTypeModalLabel.textContent = "Edit Room Type";

        let imgSrc = '';
        if (roomType.image_url) {
            if (roomType.image_url.startsWith('http')) {
                imgSrc = roomType.image_url;
            } else {
                imgSrc = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/" + roomType.image_url.replace(/^.*[\\\/]/, '');
            }
        } else {
            imgSrc = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/placeholder-room.jpg";
        }

        const img = document.createElement("img");
        img.src = imgSrc;
        img.classList.add("img-thumbnail", "mt-2");
        img.style.maxHeight = "150px";
        imagePreview.appendChild(img);
    } else {
        roomTypeModalLabel.textContent = "Add New Room Type";

        const typeName = document.getElementById("typeName");
        const typeDescription = document.getElementById("typeDescription");
        const maxCapacity = document.getElementById("maxCapacity");
        const pricePerStay = document.getElementById("pricePerStay");
        const roomSize = document.getElementById("roomSize");

        if (typeName) typeName.value = "";
        if (typeDescription) typeDescription.value = "";
        if (maxCapacity) maxCapacity.value = "";
        if (pricePerStay) pricePerStay.value = "";
        if (roomSize) roomSize.value = "";

        const img = document.createElement("img");
        img.src = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/placeholder-room.jpg";
        img.classList.add("img-thumbnail", "mt-2");
        img.style.maxHeight = "150px";
        imagePreview.appendChild(img);
    }

    new bootstrap.Modal(roomTypeModal).show();
}

async function saveRoomType() {
    const typeName = document.getElementById("typeName");
    const description = document.getElementById("typeDescription");
    const maxCapacity = document.getElementById("maxCapacity");
    const pricePerStay = document.getElementById("pricePerStay");
    const roomSize = document.getElementById("roomSize");
    const roomImage = document.getElementById("roomImage");

    if (!typeName) {
        console.error("Type name element not found");
        return;
    }

    const typeNameValue = typeName.value.trim();

    if (!typeNameValue) {
        showToast('warning', 'Type name is required');
        return;
    }

    const formData = new FormData();
    formData.append('type_name', typeNameValue);
    if (description) formData.append('description', description.value || '');
    if (maxCapacity) formData.append('max_capacity', maxCapacity.value || '');
    if (pricePerStay) formData.append('price_per_stay', pricePerStay.value || '');
    if (roomSize) formData.append('room_size_sqm', roomSize.value || '');
    if (roomImage && roomImage.files[0]) formData.append('room_image', roomImage.files[0]);
    formData.append('operation', 'createRoomType');

    try {
        const response = await axios.post(`${BASE_URL}/admin/rooms/room-type.php`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data && response.data.error) {
            throw new Error(response.data.error);
        }

        await loadRoomTypes();

        if (response.data && (response.data.message || response.data === 1)) {
            const roomTypeModal = document.getElementById("roomTypeModal");
            if (roomTypeModal) {
                const modalInstance = bootstrap.Modal.getInstance(roomTypeModal);
                if (modalInstance) modalInstance.hide();
            }

            showToast('success', 'Room type added!');
        } else {
            throw new Error('API did not return success');
        }
    } catch (err) {
        console.error("Error saving room type:", err);
        showToast('error', 'Failed to save room type', err?.message || '');
    }
}

function populateRoomTypeSelect(selectedId = "") {
    const select = document.getElementById("roomType");
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Room Type --</option>';
    cachedRoomTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type.room_type_id;
        option.textContent = type.type_name;
        if (selectedId && selectedId == type.room_type_id) option.selected = true;
        select.appendChild(option);
    });
}

function populateTypeFilter() {
    const typeFilter = document.getElementById("typeFilter");
    if (!typeFilter) return;

    typeFilter.innerHTML = '<option value="">All Types</option>';
    cachedRoomTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type.room_type_id;
        option.textContent = type.type_name;
        typeFilter.appendChild(option);
    });
}

// ====================================================================
// FEATURE MANAGEMENT
// ====================================================================
async function loadFeatures(roomTypeId = null) {
    try {
        const res = await axios.get(`${BASE_URL}/admin/rooms/feature.php`);
        cachedFeatures = Array.isArray(res.data) ? res.data : [];
        const select = document.getElementById("featuresSelect");
        if (select) {
            select.disabled = false;
        }

        if (roomTypeId) {
            const featuresRes = await axios.get(`${BASE_URL}/admin/rooms/room-type-feature.php`, {
                params: { operation: "getFeaturesForRoomType", room_type_id: roomTypeId }
            });
            const selected = Array.isArray(featuresRes.data)
                ? featuresRes.data.map(f => String(f.feature_id))
                : [];
            populateFeaturesSelect(selected);
        } else {
            populateFeaturesSelect();
        }
    } catch (e) {
        console.error("Error loading features:", e);
        cachedFeatures = [];
        const select = document.getElementById("featuresSelect");
        if (select) {
            select.innerHTML = "";
            select.disabled = true;
        }
    }
}

function populateFeaturesSelect(selected = []) {
    const selectDiv = document.getElementById("featuresSelect");
    if (!selectDiv) return;

    if (selectDiv.tagName === "SELECT") {
        const parent = selectDiv.parentNode;
        const newDiv = document.createElement("div");
        newDiv.id = "featuresSelect";
        newDiv.className = "form-check-group";
        parent.replaceChild(newDiv, selectDiv);
    }

    const container = document.getElementById("featuresSelect");
    container.innerHTML = "";
    cachedFeatures.forEach(f => {
        if (f.is_deleted && (f.is_deleted === true || f.is_deleted === 1 || f.is_deleted === "1")) return;
        const id = `feature-checkbox-${f.feature_id}`;
        const checked = selected.includes(String(f.feature_id)) || selected.includes(f.feature_id);
        container.innerHTML += `
            <span class="badge bg-secondary me-2 mb-2 d-inline-flex align-items-center" style="font-size:1em;">
                <input class="form-check-input me-1" type="checkbox" id="${id}" value="${f.feature_id}" ${checked ? "checked" : ""} style="vertical-align:middle;">
                <label class="form-check-label me-2" for="${id}" style="cursor:pointer;">${f.feature_name}</label>
                <i class="fas fa-trash text-danger ms-1 feature-delete-btn" data-feature-id="${f.feature_id}" style="cursor:pointer;" title="Delete Feature"></i>
            </span>
        `;
    });

    container.querySelectorAll('.feature-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const featureId = btn.getAttribute('data-feature-id');
            if (!featureId) return;

            const result = await showConfirmDialog('Delete Feature?', 'This will remove this feature from ALL room types. Are you sure?', 'warning');
            if (!result) return;

            await deleteFeatureGlobally(featureId);
            await loadFeatures();
            await loadRoomTypes(); // Refresh to show updated features
        });
    });
}

async function deleteFeatureGlobally(featureId) {
    try {
        const formData = new FormData();
        formData.append('operation', 'deleteFeature');
        formData.append('json', JSON.stringify({ feature_id: featureId }));
        await axios.post(`${BASE_URL}/admin/rooms/feature.php`, formData);
        showToast('success', 'Feature deleted from all room types');
    } catch (e) {
        showToast('error', 'Failed to delete feature');
    }
}

async function saveFeature() {
    const newFeatureName = document.getElementById("newFeatureName");
    if (!newFeatureName) {
        console.error("Feature name input not found");
        return;
    }

    const featureName = newFeatureName.value.trim();
    if (!featureName) {
        showToast('warning', 'Feature name is required');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('operation', 'createFeature');
        formData.append('feature_name', featureName);

        const res = await axios.post(`${BASE_URL}/admin/rooms/feature.php`, formData);

        if (res.data && (res.data.success || res.data.message || res.data === 1)) {
            const roomTypeId = document.getElementById("roomTypeId")?.value;
            if (roomTypeId) {
                let featureId = null;
                if (res.data.feature_id) {
                    featureId = res.data.feature_id;
                } else {
                    await loadFeatures();
                    const found = cachedFeatures.find(f => f.feature_name === featureName);
                    featureId = found ? found.feature_id : null;
                }
                if (featureId) {
                    const connectForm = new FormData();
                    connectForm.append('operation', 'addFeatureToRoomType');
                    connectForm.append('room_type_id', roomTypeId);
                    connectForm.append('feature_id', featureId);
                    await axios.post(`${BASE_URL}/admin/rooms/room-type-feature.php`, connectForm);
                }
            }
            showToast('success', 'Feature added!');

            const featureModal = document.getElementById("featureModal");
            if (featureModal) {
                const modalInstance = bootstrap.Modal.getInstance(featureModal);
                if (modalInstance) modalInstance.hide();
            }

            if (roomTypeId) {
                await loadFeatures(roomTypeId);
            } else {
                await loadFeatures();
            }
        } else {
            throw new Error('Failed to add feature');
        }
    } catch (err) {
        console.error("Error saving feature:", err);
        showToast('error', 'Failed to add feature', err?.message || '');
    }
}

// Enhanced Manage Features Modal with Simple UI
async function showManageFeaturesModal(roomTypeId) {
    // Always fetch latest features and assignments from backend
    let allFeatures = [];
    try {
        const res = await axios.get(`${BASE_URL}/admin/rooms/feature.php`);
        allFeatures = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
        allFeatures = [];
    }

    // Always fetch latest assigned features from backend
    let assignedFeatures = [];
    try {
        // Use POST to avoid caching issues and always get fresh assignments
        const res = await axios.post(`${BASE_URL}/admin/rooms/room-type-feature.php`, new URLSearchParams({
            operation: "getFeaturesForRoomType",
            json: JSON.stringify({ room_type_id: roomTypeId })
        }));
        assignedFeatures = Array.isArray(res.data)
            ? res.data.map(f => String(f.feature_id))
            : [];
    } catch (e) {
        assignedFeatures = [];
    }

    const roomType = cachedRoomTypes.find(rt => rt.room_type_id == roomTypeId);
    const roomTypeName = roomType ? roomType.type_name : 'Room Type';

    let html = `
        <div class="container-fluid">
            <div class="alert alert-info mb-3">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Managing features for: ${roomTypeName}</strong>
                <br><small>Check to assign, uncheck to remove from this room type.</small>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header" style="background: #8B0000; color: #fff;">
                            <i class="fas fa-list me-2"></i>Available Features
                        </div>
                        <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                            <div id="available-features-list">
                                ${allFeatures.length === 0
            ? `<div class="text-muted text-center py-3"><i class="fas fa-info-circle me-2"></i>No features available</div>`
            : allFeatures
                .filter(f => !f.is_deleted || f.is_deleted === 0 || f.is_deleted === false || f.is_deleted === "0")
                .map(f => `
                    <div class="form-check mb-2 p-2 border rounded d-flex align-items-center justify-content-center ${assignedFeatures.includes(String(f.feature_id)) ? 'bg-light border-success' : ''}">
                        <input class="form-check-input feature-checkbox mx-2" type="checkbox"
                               value="${f.feature_id}" id="feature-${f.feature_id}"
                               ${assignedFeatures.includes(String(f.feature_id)) ? 'checked' : ''}
                               style="width: 1.5em; height: 1.5em; accent-color: #198754; box-shadow: 0 0 0 2px #198754;">
                        <label class="form-check-label flex-grow-1 ms-3 fw-bold text-center" for="feature-${f.feature_id}" style="font-size:1.1em;">
                            ${f.feature_name}
                        </label>
                        <button class="btn btn-sm btn-outline-danger ms-2 delete-feature-btn"
                                data-feature-id="${f.feature_id}" title="Delete from ALL room types">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('')
        }
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header" style="background: #8B0000; color: #fff;">
                            <i class="fas fa-plus me-2"></i>Add New Feature
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="quickFeatureName" class="form-label">Feature Name</label>
                                <input type="text" class="form-control" id="quickFeatureName"
                                       placeholder="Enter feature name..." maxlength="100">
                            </div>
                            <button type="button" class="btn btn-success w-100" id="quickAddFeatureBtn">
                                <i class="fas fa-plus me-2"></i>Add Feature
                            </button>
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header" style="background: #8B0000; color: #fff;">
                            <i class="fas fa-check-circle me-2"></i>Currently Assigned
                        </div>
                        <div class="card-body" style="max-height: 250px; overflow-y: auto;">
                            <div id="assigned-features-preview">
                                ${assignedFeatures.length === 0
            ? '<div class="text-muted text-center py-2">No features assigned</div>'
            : allFeatures
                .filter(f => assignedFeatures.includes(String(f.feature_id)))
                .map(f => `<span class="badge bg-info me-1 mb-1">${f.feature_name}</span>`)
                .join('')
        }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const blankModalTitle = document.getElementById("blank-modal-title");
    const blankMainDiv = document.getElementById("blank-main-div");
    const blankModal = document.getElementById("blank-modal");
    const blankModalFooter = document.getElementById("blank-modal-footer");

    if (!blankModalTitle || !blankMainDiv || !blankModal || !blankModalFooter) {
        console.error("Required modal elements not found");
        return;
    }

    blankModalTitle.innerText = `Manage Features - ${roomTypeName}`;
    blankMainDiv.innerHTML = html;
    const modalDialog = blankModal.querySelector('.modal-dialog');
    if (modalDialog) modalDialog.classList.add('modal-xl');
    blankModalFooter.innerHTML = `
        <button type="button" class="btn btn-primary" id="saveAllFeaturesBtn">
            <i class="fas fa-save me-2"></i>Save Changes
        </button>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            <i class="fas fa-times me-2"></i>Cancel
        </button>
    `;
    const myModal = bootstrap.Modal.getOrCreateInstance(blankModal);
    myModal.show();

    setupFeatureModalEventListeners(roomTypeId, myModal, allFeatures, assignedFeatures);
}

function setupFeatureModalEventListeners(roomTypeId, modal, allFeatures, assignedFeatures = []) {
    // Quick add feature
    const quickAddBtn = document.getElementById("quickAddFeatureBtn");
    const quickFeatureName = document.getElementById("quickFeatureName");

    if (quickAddBtn && quickFeatureName) {
        quickAddBtn.addEventListener("click", async () => {
            const featureName = quickFeatureName.value.trim();
            if (!featureName) {
                showToast('warning', 'Please enter a feature name');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('operation', 'createFeature');
                formData.append('feature_name', featureName);

                const res = await axios.post(`${BASE_URL}/admin/rooms/feature.php`, formData);

                if (res.data && (res.data.success || res.data.message || res.data === 1)) {
                    showToast('success', 'Feature added successfully!');
                    quickFeatureName.value = "";
                    modal.hide();
                    await showManageFeaturesModal(roomTypeId); // Refresh modal
                } else {
                    throw new Error('Failed to add feature');
                }
            } catch (error) {
                console.error("Error adding feature:", error);
                showToast('error', 'Failed to add feature');
            }
        });

        // Enter key support for quick add
        quickFeatureName.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                quickAddBtn.click();
            }
        });
    }

    // Feature assignment/unassignment with live preview update
    const checkboxes = document.querySelectorAll('.feature-checkbox');

    function updateAssignedPreviewLive() {
        // Get all checked feature ids
        const checkedIds = Array.from(document.querySelectorAll('.feature-checkbox:checked')).map(cb => cb.value);
        const previewDiv = document.getElementById('assigned-features-preview');
        if (!previewDiv) return;

        if (checkedIds.length === 0) {
            previewDiv.innerHTML = '<div class="text-muted text-center py-2">No features assigned</div>';
            return;
        }

        let html = '';
        allFeatures.forEach(f => {
            if (checkedIds.includes(String(f.feature_id))) {
                html += `<span class="badge bg-success me-1 mb-1">${f.feature_name}</span>`;
            }
        });
        previewDiv.innerHTML = html;
    }

    checkboxes.forEach(checkbox => {
        // IMPORTANT: Set initial checked state based on current assignments
        const isAssigned = assignedFeatures.includes(String(checkbox.value));
        checkbox.checked = isAssigned;

        console.log(`Feature ${checkbox.value}: assigned=${isAssigned}, checkbox.checked=${checkbox.checked}`);

        // Update the parent div styling to show current state
        const parentDiv = checkbox.closest('.form-check');
        if (parentDiv) {
            if (isAssigned) {
                parentDiv.classList.add('bg-light', 'border-success');
            } else {
                parentDiv.classList.remove('bg-light', 'border-success');
            }
        }

        // Handle checkbox change events
        checkbox.addEventListener('change', async function () {
            const featureId = this.value;
            const parentDiv = this.closest('.form-check');
            this.disabled = true;

            try {
                if (this.checked) {
                    // ASSIGN feature to room type
                    const addForm = new FormData();
                    addForm.append('operation', 'addFeatureToRoomType');
                    addForm.append('room_type_id', roomTypeId);
                    addForm.append('feature_id', featureId);

                    await axios.post(`${BASE_URL}/admin/rooms/room-type-feature.php`, addForm);

                    // Always re-fetch assigned features after change
                    const res = await axios.post(`${BASE_URL}/admin/rooms/room-type-feature.php`, new URLSearchParams({
                        operation: "getFeaturesForRoomType",
                        json: JSON.stringify({ room_type_id: roomTypeId })
                    }));
                    assignedFeatures = Array.isArray(res.data)
                        ? res.data.map(f => String(f.feature_id))
                        : [];

                    if (parentDiv) {
                        parentDiv.classList.add('bg-light', 'border-success');
                    }
                    showToast('success', 'Feature assigned successfully');
                } else {
                    // UNASSIGN feature from room type
                    const removeForm = new FormData();
                    removeForm.append('operation', 'removeFeatureFromRoomType');
                    removeForm.append('json', JSON.stringify({
                        room_type_id: roomTypeId,
                        feature_id: featureId
                    }));

                    await axios.post(`${BASE_URL}/admin/rooms/room-type-feature.php`, removeForm);

                    // Always re-fetch assigned features after change
                    const res = await axios.post(`${BASE_URL}/admin/rooms/room-type-feature.php`, new URLSearchParams({
                        operation: "getFeaturesForRoomType",
                        json: JSON.stringify({ room_type_id: roomTypeId })
                    }));
                    assignedFeatures = Array.isArray(res.data)
                        ? res.data.map(f => String(f.feature_id))
                        : [];

                    if (parentDiv) {
                        parentDiv.classList.remove('bg-light', 'border-success');
                    }
                    showToast('success', 'Feature unassigned successfully');
                }

                // Update the live preview
                updateAssignedPreviewLive();

                // Refresh the main room types table to show updated features
                await loadRoomTypes();

            } catch (error) {
                console.error('Error updating feature assignment:', error);

                // Revert checkbox state on error
                this.checked = !this.checked;

                if (this.checked) {
                    showToast('error', 'Failed to assign feature');
                } else {
                    showToast('error', 'Failed to unassign feature');
                }
            } finally {
                this.disabled = false;
            }
        });
    });

    // Set initial preview state
    updateAssignedPreviewLive();

    // Delete feature buttons (global deletion)
    document.querySelectorAll('.delete-feature-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const featureId = btn.getAttribute('data-feature-id');
            if (!featureId) return;

            const feature = allFeatures.find(f => f.feature_id == featureId);
            const featureName = feature ? feature.feature_name : 'this feature';

            const result = await showConfirmDialog(
                'Delete Feature Globally?',
                `Are you sure you want to delete "${featureName}"? This will remove it from ALL room types and cannot be undone.`,
                'warning'
            );

            if (!result) return;

            try {
                await deleteFeatureGlobally(featureId);
                showToast('success', 'Feature deleted from all room types');
                modal.hide();
                await showManageFeaturesModal(roomTypeId); // Refresh modal
                await loadRoomTypes(); // Refresh main table
            } catch (error) {
                showToast('error', 'Failed to delete feature');
            }
        });
    });

    // Save button (now mainly for closing modal since changes are instant)
    const saveAllBtn = document.getElementById("saveAllFeaturesBtn");
    if (saveAllBtn) {
        saveAllBtn.addEventListener("click", async () => {
            modal.hide();
            showToast('success', 'All changes saved!');
            await loadRoomTypes();
        });
    }
}


// ====================================================================
// IMAGE MANAGEMENT
// ====================================================================
function previewImage(event) {
    const imagePreview = document.getElementById("imagePreview");
    if (!imagePreview) return;

    imagePreview.innerHTML = "";
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.classList.add("img-thumbnail", "mt-2");
            img.style.maxHeight = "150px";
            imagePreview.appendChild(img);
        }
        reader.readAsDataURL(file);
    }
}

// Room Type Images Modal (NEW)
async function showRoomTypeImagesModal(roomTypeId) {
    if (!roomTypeId) return;

    let images = [];
    try {
        const res = await axios.get(`${BASE_URL}/admin/rooms/room-images.php`, {
            params: { room_type_id: roomTypeId }
        });
        images = Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Error fetching room type images:", error);
        images = [];
    }

    let html = `
        <div>
            <div class="mb-3">
                <label class="form-label">Upload New Photo</label>
                <input type="file" id="roomTypeImageUpload" accept="image/*" class="form-control mb-2">
                <button class="btn btn-primary btn-sm w-100" id="uploadRoomTypeImageBtn" data-roomtype-id="${roomTypeId}">
                    <i class="fas fa-upload"></i> Upload
                </button>
            </div>
            <div class="mb-2" id="roomTypeImagesPreview">
                ${images.length === 0 ? '<div class="text-muted">No images yet.</div>' : ''}
                <div class="d-flex flex-wrap" style="gap:20px;">
                    ${images.map(img => `
                        <div style="position:relative;display:inline-block;">
                            <img src="/Hotel-Reservation-Billing-System/assets/images/uploads/room-images/${img.image_url}" style="max-width:320px;max-height:240px;" class="img-thumbnail mb-1">
                            <div style="position:absolute;top:4px;right:4px;display:flex;gap:4px;">
                                <button class="btn btn-danger btn-sm btn-delete-roomtype-image" data-image-id="${img.room_image_id}" title="Delete" style="padding:2px 6px;">
                                    <i class="fas fa-times"></i>
                                </button>
                                <button class="btn btn-secondary btn-sm btn-update-roomtype-image" data-image-id="${img.room_image_id}" title="Update" style="padding:2px 6px;">
                                    <i class="fas fa-pen"></i>
                                </button>
                            </div>
                            <input type="file" class="form-control form-control-sm mt-1 d-none update-roomtype-image-input" data-image-id="${img.room_image_id}" accept="image/*">
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    const blankModalTitle = document.getElementById("blank-modal-title");
    const blankMainDiv = document.getElementById("blank-main-div");
    const blankModal = document.getElementById("blank-modal");
    const blankModalFooter = document.getElementById("blank-modal-footer");

    if (!blankModalTitle || !blankMainDiv || !blankModal || !blankModalFooter) {
        console.error("Required modal elements not found");
        return;
    }

    blankModalTitle.innerText = "Room Type Images";
    blankMainDiv.innerHTML = html;

    const modalDialog = blankModal.querySelector('.modal-dialog');
    if (modalDialog) modalDialog.classList.add('modal-xl');

    blankModalFooter.innerHTML = `<button type="button" class="btn btn-secondary w-100 btn-close-roomtype-images-modal" data-bs-dismiss="modal">Close</button>`;
    const myModal = bootstrap.Modal.getOrCreateInstance(blankModal);
    myModal.show();

    setupRoomTypeImageModalEventListeners(roomTypeId, myModal);
}

function setupRoomTypeImageModalEventListeners(roomTypeId, modal) {
    const closeBtn = document.querySelector(".btn-close-roomtype-images-modal");
    if (closeBtn) {
        closeBtn.onclick = function () {
            modal.hide();
        };
    }

    const uploadBtn = document.getElementById("uploadRoomTypeImageBtn");
    if (uploadBtn) {
        uploadBtn.onclick = async function () {
            const fileInput = document.getElementById("roomTypeImageUpload");
            if (!fileInput || !fileInput.files[0]) {
                showToast('warning', 'Please select an image to upload');
                return;
            }
            const formData = new FormData();
            formData.append('operation', 'insertRoomImage');
            formData.append('room_type_id', roomTypeId);
            formData.append('image', fileInput.files[0]);
            try {
                const res = await axios.post(`${BASE_URL}/admin/rooms/room-images.php`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (res.data == 1) {
                    showToast('success', 'Image uploaded!');
                    await showRoomTypeImagesModal(roomTypeId);
                } else {
                    showToast('error', 'Failed to upload image');
                }
            } catch (error) {
                showToast('error', 'Failed to upload image');
            }
        };
    }

    document.querySelectorAll(".btn-delete-roomtype-image").forEach(btn => {
        btn.onclick = async function () {
            const imageId = btn.getAttribute('data-image-id');
            if (!imageId) return;
            const result = await showConfirmDialog('Delete Image?', 'Are you sure you want to delete this image?', 'warning');
            if (!result) return;
            try {
                await axios.delete(`${BASE_URL}/admin/rooms/room-images.php`, {
                    data: { operation: 'deleteImage', room_image_id: imageId }
                });
                showToast('success', 'Image deleted');
                await showRoomTypeImagesModal(roomTypeId);
            } catch (error) {
                showToast('error', 'Failed to delete image');
            }
        };
    });

    document.querySelectorAll(".btn-update-roomtype-image").forEach(btn => {
        btn.onclick = function () {
            const imageId = btn.getAttribute('data-image-id');
            if (!imageId) return;
            const input = document.querySelector(`.update-roomtype-image-input[data-image-id='${imageId}']`);
            if (input) input.classList.toggle('d-none');
        };
    });

    document.querySelectorAll(".update-roomtype-image-input").forEach(input => {
        input.addEventListener('change', async function () {
            const imageId = input.getAttribute('data-image-id');
            if (!imageId || !input.files[0]) return;
            const formData = new FormData();
            formData.append('operation', 'updateImage');
            formData.append('room_image_id', imageId);
            formData.append('image', input.files[0]);
            try {
                await axios.post(`${BASE_URL}/admin/rooms/room-images.php`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showToast('success', 'Image updated!');
                await showRoomTypeImagesModal(roomTypeId);
            } catch (error) {
                showToast('error', 'Failed to update image');
            }
        });
    });
}

async function showRoomImagesModal(roomId) {
    if (!roomId) return;

    let images = [];
    try {
        const res = await axios.get(`${BASE_URL}/admin/rooms/room-images.php`, {
            params: { room_id: roomId }
        });
        images = Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Error fetching room images:", error);
        images = [];
    }

    let html = `
        <div>
            <div class="mb-3">
                <label class="form-label">Upload New Photo</label>
                <input type="file" id="roomImageUpload" accept="image/*" class="form-control mb-2">
                <button class="btn btn-primary btn-sm w-100" id="uploadRoomImageBtn" data-room-id="${roomId}">
                    <i class="fas fa-upload"></i> Upload
                </button>
            </div>
            <div class="mb-2" id="roomImagesPreview">
                ${images.length === 0 ? '<div class="text-muted">No images yet.</div>' : ''}
                <div class="d-flex flex-wrap" style="gap:20px;">
                    ${images.map(img => `
                        <div style="position:relative;display:inline-block;">
                            <img src="/Hotel-Reservation-Billing-System/assets/images/uploads/room-images/${img.image_url}" style="max-width:320px;max-height:240px;" class="img-thumbnail mb-1">
                            <div style="position:absolute;top:4px;right:4px;display:flex;gap:4px;">
                                <button class="btn btn-danger btn-sm btn-delete-room-image" data-image-id="${img.room_image_id}" title="Delete" style="padding:2px 6px;">
                                    <i class="fas fa-times"></i>
                                </button>
                                <button class="btn btn-secondary btn-sm btn-update-room-image" data-image-id="${img.room_image_id}" title="Update" style="padding:2px 6px;">
                                    <i class="fas fa-pen"></i>
                                </button>
                            </div>
                            <input type="file" class="form-control form-control-sm mt-1 d-none update-image-input" data-image-id="${img.room_image_id}" accept="image/*">
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    const blankModalTitle = document.getElementById("blank-modal-title");
    const blankMainDiv = document.getElementById("blank-main-div");
    const blankModal = document.getElementById("blank-modal");
    const blankModalFooter = document.getElementById("blank-modal-footer");

    if (!blankModalTitle || !blankMainDiv || !blankModal || !blankModalFooter) {
        console.error("Required modal elements not found");
        return;
    }

    blankModalTitle.innerText = "Room Images";
    blankMainDiv.innerHTML = html;

    const modalDialog = blankModal.querySelector('.modal-dialog');
    if (modalDialog) modalDialog.classList.add('modal-xl');

    blankModalFooter.innerHTML = `<button type="button" class="btn btn-secondary w-100 btn-close-room-images-modal" data-bs-dismiss="modal">Close</button>`;
    const myModal = bootstrap.Modal.getOrCreateInstance(blankModal);
    myModal.show();

    setupImageModalEventListeners(roomId, myModal);
}

function setupImageModalEventListeners(roomId, modal) {
    const closeBtn = document.querySelector(".btn-close-room-images-modal");
    if (closeBtn) {
        closeBtn.onclick = function () {
            modal.hide();
        };
    }

    const uploadBtn = document.getElementById("uploadRoomImageBtn");
    if (uploadBtn) {
        uploadBtn.onclick = async function () {
            const fileInput = document.getElementById("roomImageUpload");
            if (!fileInput || !fileInput.files.length) {
                showToast('warning', 'Select an image first');
                return;
            }

            const formData = new FormData();
            formData.append('operation', 'insertRoomImage');
            formData.append('json', JSON.stringify({ room_id: roomId }));
            formData.append('image', fileInput.files[0]);

            try {
                const res = await axios.post(`${BASE_URL}/admin/rooms/room-images.php`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (res.data == 1) {
                    await showRoomImagesModal(roomId);
                    showToast('success', 'Image uploaded!');
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                console.error("Error uploading image:", error);
                showToast('error', 'Failed to upload');
            }
        };
    }

    document.querySelectorAll(".btn-delete-room-image").forEach(btn => {
        btn.onclick = async function () {
            const imageId = btn.dataset.imageId;
            if (!imageId) return;

            const proceed = await showConfirmDialog('Delete image?', '', 'warning');
            if (!proceed) return;

            const formData = new FormData();
            formData.append('operation', 'deleteRoomImage');
            formData.append('json', JSON.stringify({ room_image_id: imageId }));

            try {
                const res = await axios.post(`${BASE_URL}/admin/rooms/room-images.php`, formData);
                if (res.data == 1) {
                    await showRoomImagesModal(roomId);
                } else {
                    throw new Error('Delete failed');
                }
            } catch (error) {
                console.error("Error deleting image:", error);
                showToast('error', 'Failed to delete');
            }
        };
    });

    document.querySelectorAll(".btn-update-room-image").forEach(btn => {
        btn.onclick = function () {
            const imageId = btn.dataset.imageId;
            if (!imageId) return;

            const input = document.querySelector(`.update-image-input[data-image-id="${imageId}"]`);
            if (input) input.click();
        };
    });

    document.querySelectorAll(".update-image-input").forEach(input => {
        input.onchange = async function (e) {
            const imageId = input.dataset.imageId;
            if (!imageId || !input.files.length) return;

            const file = input.files[0];
            const proceed = await showConfirmDialog('Update image?', 'This will replace the current image.', 'question');
            if (!proceed) return;

            const formData = new FormData();
            formData.append('operation', 'updateRoomImage');
            formData.append('json', JSON.stringify({ room_image_id: imageId }));
            formData.append('image', file);

            try {
                const res = await axios.post(`${BASE_URL}/admin/rooms/room-images.php`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (res.data == 1) {
                    await showRoomImagesModal(roomId);
                    showToast('success', 'Image updated!');
                } else {
                    throw new Error('Update failed');
                }
            } catch (error) {
                console.error("Error updating image:", error);
                showToast('error', 'Failed to update');
            }
        };
    });
}

// ====================================================================
// ROOM DETAILS MODAL
// ====================================================================
async function showRoomDetailsModal(roomId) {
    if (!roomId) return;

    let room = null;
    try {
        const res = await axios.get(`${BASE_URL}/admin/rooms/rooms.php`, {
            params: { room_id: roomId }
        });
        room = Array.isArray(res.data) ? res.data[0] : res.data;
    } catch (error) {
        console.error("Error fetching room details:", error);
        room = null;
    }

    if (!room) {
        showToast('error', 'Room not found');
        return;
    }

    let images = [];
    try {
        const res = await axios.get(`${BASE_URL}/admin/rooms/room-images.php`, {
            params: { room_id: roomId }
        });
        images = Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("Error fetching room images:", error);
        images = [];
    }

    let typeImg = '';
    if (room.room_type_image_url) {
        if (room.room_type_image_url.startsWith('http')) {
            typeImg = room.room_type_image_url;
        } else {
            typeImg = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/" + room.room_type_image_url.replace(/^.*[\\\/]/, '');
        }
    } else {
        typeImg = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/room-types/placeholder-room.jpg";
    }

    // Features as grid, 3 per row, with Font Awesome check, no badge, no comma
    let featuresArr = [];
    if (Array.isArray(room.features) && room.features.length) {
        featuresArr = room.features.map(f => f.feature_name);
    } else if (room.key_features) {
        featuresArr = room.key_features.split(',').map(f => f.trim()).filter(f => !!f);
    }
    let featuresText = '<span class="text-muted">No features specified</span>';
    if (featuresArr.length > 0) {
        featuresText = '<div class="row">';
        for (let i = 0; i < featuresArr.length; i += 3) {
            featuresText += '<div class="d-flex mb-2">';
            for (let j = 0; j < 3; j++) {
                const idx = i + j;
                if (idx < featuresArr.length) {
                    featuresText += `<div class="flex-fill"><i class='fas fa-check-circle text-success me-2'></i>${featuresArr[idx]}</div>`;
                } else {
                    featuresText += '<div class="flex-fill"></div>';
                }
            }
            featuresText += '</div>';
        }
        featuresText += '</div>';
    }

    let html = `
        <div class="container-fluid px-2 py-2">
            <div class="row g-3">
                <div class="col-12 mb-2">
                    <div class="d-flex align-items-center gap-3 mb-2" style="border-bottom:1.5px solid #eee; padding-bottom:0.5rem;">
                        <img src="${typeImg}" class="rounded shadow-sm" style="width: 80px; height: 80px; object-fit: cover; border: 2px solid #8B0000;">
                        <div>
                            <h4 class="fw-bold mb-0">${room.type_name || ''}</h4>
                            <div class="text-muted small">${room.room_type_description || ''}</div>
                        </div>
                        <div class="ms-auto">
                            <span class="badge bg-${getStatusColor(room.room_status)} px-3 py-2 fs-6">
                                <i class="fas fa-info-circle me-1"></i>${room.room_status || ''}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-2">
                    <div class="card border-0 shadow h-100">
                        <div class="card-body p-3">
                            <ul class="list-group list-group-flush text-start">
                                <li class="list-group-item px-0 py-1"><i class="fas fa-door-closed me-2"></i><strong>Room # :</strong> ${room.room_number || ''}</li>
                                <li class="list-group-item px-0 py-1"><i class="fas fa-users me-2"></i><strong>Capacity :</strong> ${room.max_capacity || ''}</li>
                                <li class="list-group-item px-0 py-1"><i class="fas fa-ruler-combined me-2"></i><strong>Room Size :</strong> ${room.room_size_sqm || ''}</li>
                                <li class="list-group-item px-0 py-1"><i class="fas fa-coins me-2"></i><strong>Price per Stay : </strong> ₱${room.price_per_stay || ''}</li>
                                <li class="list-group-item px-0 py-1"><i class="fas fa-calendar-alt me-2"></i><strong>Last Updated : </strong> ${room.updated_at ? formatDate(room.updated_at) : ''}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-8 mb-2">
                    <div class="card border-0 shadow h-100">
                        <div class="card-header bg-gradient fw-bold text-black" style="background: linear-gradient(90deg, #8B0000 0%, #b22222 100%);">
                            <i class="fas fa-list-ul me-2"></i> Features
                        </div>
                        <div class="card-body pb-2 pt-3">
                            <div id="features-list" class="fs-5 mb-2">
                                ${featuresText}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 mt-3">
                    <div class="card border-0 shadow">
                        <div class="card-header bg-light fw-bold">
                            <i class="fas fa-images me-2"></i> Room Gallery
                        </div>
                        <div class="card-body">
                            <div class="row g-3 justify-content-start align-items-center">
                                ${images.length
            ? images.map(img =>
                `<div class="col-6 col-md-4 col-lg-3 text-center mb-2">
                    <div class="gallery-img-card position-relative border-0 shadow-sm rounded h-100 p-2 bg-white">
                        <img src="/Hotel-Reservation-Billing-System/assets/images/uploads/room-images/${img.image_url}" class="img-fluid rounded" style="max-height:150px; object-fit:cover; border:1.5px solid #eee;">
                        <div class="small text-muted mt-1"><i class="fas fa-image"></i> #${img.room_image_id}</div>
                    </div>
                </div>`
            ).join('')
            : '<div class="col-12 text-muted"><i class="fas fa-images"></i> No additional images uploaded.</div>'
        }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const blankModalTitle = document.getElementById("blank-modal-title");
    const blankMainDiv = document.getElementById("blank-main-div");
    const blankModal = document.getElementById("blank-modal");
    const blankModalFooter = document.getElementById("blank-modal-footer");

    if (!blankModalTitle || !blankMainDiv || !blankModal || !blankModalFooter) {
        console.error("Required modal elements not found");
        return;
    }

    blankModalTitle.innerText = "Room Details";
    blankMainDiv.innerHTML = html;

    const modalDialog = blankModal.querySelector('.modal-dialog');
    if (modalDialog) modalDialog.classList.add('modal-xl');

    blankModalFooter.innerHTML = `<button type="button" class="btn btn-secondary w-100" data-bs-dismiss="modal"><i class="fas fa-times"></i> Close</button>`;
    const myModal = bootstrap.Modal.getOrCreateInstance(blankModal);
    myModal.show();
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================
function getStatusColor(status) {
    const colors = {
        "available": "success",
        "occupied": "danger",
        "maintenance": "warning",
        "reserved": "info"
    };
    return colors[status] || "secondary";
}

function formatDate(dateString) {
    if (!dateString) return "-";
    try {
        return new Date(dateString).toLocaleString();
    } catch (error) {
        console.error("Error formatting date:", error);
        return "-";
    }
}

function showToast(type, title, text = '') {
    if (window.Swal) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: type,
            title: title,
            text: text,
            showConfirmButton: false,
            timer: type === 'error' ? 2500 : 1800
        });
    } else {
        alert(`${title}${text ? ': ' + text : ''}`);
    }
}

async function showConfirmDialog(title, text, icon = 'warning') {
    if (window.Swal) {
        const result = await Swal.fire({
            title: title,
            text: text,
            icon: icon,
            showCancelButton: true,
            confirmButtonText: icon === 'warning' ? 'Delete' : 'Confirm',
            confirmButtonColor: icon === 'warning' ? '#d33' : '#3085d6'
        });
        return result.isConfirmed;
    } else {
        return confirm(`${title}${text ? '\n' + text : ''}`);
    }
}