// Guest Module - API-driven, like rooms-module.js

const BASE_URL = "/Hotel-Reservation-Billing-System/api/admin/guests";

// Helper: Upload image file to server and get file path (multipart/form-data, like room-type.php)
async function uploadIdPicture(file) {
    if (!file) return "";
    try {
        const formData = new FormData();
        formData.append("id_picture", file);
        // Now handled by id_types.php (multipart/form-data)
        const res = await axios.post("/Hotel-Reservation-Billing-System/api/admin/guests/id_types.php", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        if (res.data && res.data.path) {
            let path = res.data.path;
            return path;
        }
        return "";
    } catch (err) {
        console.error("[GuestModule] uploadIdPicture error:", err);
        return "";
    }
}

// Get all guests
export async function getAllGuests() {
    try {
        const res = await axios.get(`${BASE_URL}/guests.php`, { params: { operation: "getAllGuests" } });
        return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        console.error("[GuestModule] getAllGuests error:", err);
        return [];
    }
}

// Get guest by ID
export async function getGuest(guest_id) {
    try {
        const res = await axios.get(`${BASE_URL}/guests.php`, {
            params: { operation: "getGuest", json: JSON.stringify({ guest_id }) }
        });
        if (Array.isArray(res.data)) return res.data[0] || null;
        if (typeof res.data === "object") return res.data;
        return null;
    } catch (err) {
        console.error("[GuestModule] getGuest error:", err);
        return null;
    }
}

// Insert guest
export async function insertGuest(guestData) {
    try {
        // Always resolve guest_idtype_id from id_type if needed
        if (!guestData.guest_idtype_id && guestData.id_type) {
            const idTypes = await getAllIDTypes();
            const found = idTypes.find(t => t.id_type === guestData.id_type);
            guestData.guest_idtype_id = found ? found.guest_idtype_id : null;
        }
        // Handle id_picture upload if File object
        if (guestData.id_picture && guestData.id_picture instanceof File) {
            guestData.id_picture = await uploadIdPicture(guestData.id_picture);
        }
        // Defensive: ensure all required fields are present
        if (!guestData.first_name || !guestData.last_name || !guestData.email || !guestData.phone_number || !guestData.guest_idtype_id || !guestData.id_number) {
            return 0;
        }
        const formData = new FormData();
        formData.append("operation", "insertGuest");
        formData.append("json", JSON.stringify(guestData));
        const res = await axios.post(`${BASE_URL}/guests.php`, formData);
        // Return the new guest_id if possible
        if (res.data && typeof res.data === "object" && res.data.guest_id) {
            return res.data;
        }
        return res.data;
    } catch (err) {
        console.error("[GuestModule] insertGuest error:", err);
        return 0;
    }
}

// Update guest
export async function updateGuest(guestData) {
    try {
        if (!guestData.guest_idtype_id && guestData.id_type) {
            const idTypes = await getAllIDTypes();
            const found = idTypes.find(t => t.id_type === guestData.id_type);
            guestData.guest_idtype_id = found ? found.guest_idtype_id : null;
        }
        if (guestData.id_picture && guestData.id_picture instanceof File) {
            guestData.id_picture = await uploadIdPicture(guestData.id_picture);
        }
        const formData = new FormData();
        formData.append("operation", "updateGuest");
        formData.append("json", JSON.stringify(guestData));
        const res = await axios.post(`${BASE_URL}/guests.php`, formData);
        return res.data;
    } catch (err) {
        console.error("[GuestModule] updateGuest error:", err);
        return 0;
    }
}

// Delete guest (soft delete)
export async function deleteGuest(guest_id) {
    try {
        const formData = new FormData();
        formData.append("operation", "deleteGuest");
        formData.append("json", JSON.stringify({ guest_id }));
        const res = await axios.post(`${BASE_URL}/guests.php`, formData);
        return res.data;
    } catch (err) {
        console.error("[GuestModule] deleteGuest error:", err);
        return 0;
    }
}

// Get all ID types
export async function getAllIDTypes() {
    try {
        const res = await axios.get(`${BASE_URL}/id_types.php`, { params: { operation: "getAllIDTypes" } });
        return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        console.error("[GuestModule] getAllIDTypes error:", err);
        return [];
    }
}

// View guest details (returns full guest object)
export async function viewGuestDetails(guest_id) {
    return await getGuest(guest_id);
}

// Get guest's reservation history
export async function getGuestReservations(guest_id) {
    try {
        const res = await axios.get("/Hotel-Reservation-Billing-System/api/admin/reservations/reservations.php", {
            params: { operation: "getAllReservations", guest_id }
        });
        return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        console.error("[GuestModule] getGuestReservations error:", err);
        return [];
    }
}
