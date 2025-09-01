import * as GuestAPI from '../modules/admin/guest-module.js';

document.addEventListener("DOMContentLoaded", () => {
    loadGuestsTable();
    loadIDTypesSelect();

    // Add Guest button logic
    const addGuestBtn = document.getElementById("addGuestBtn");
    if (addGuestBtn) {
        addGuestBtn.addEventListener("click", () => {
            clearGuestForm();
            document.getElementById("guestModalLabel").textContent = "Add Guest";
            // Always use the same modal instance, don't create new every time
            const modalEl = document.getElementById("guestModal");
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
                modalInstance.show();
            }
        });
    }

    // Ensure modal is properly hidden on close (fix stuck backdrop)
    const guestModal = document.getElementById("guestModal");
    if (guestModal) {
        guestModal.addEventListener('hidden.bs.modal', () => {
            document.body.classList.remove('modal-open');
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(bd => bd.parentNode && bd.parentNode.removeChild(bd));
        });
    }

    // Save guest
    const saveGuestBtn = document.getElementById("saveGuestBtn");
    if (saveGuestBtn) {
        saveGuestBtn.addEventListener("click", async () => {
            if (!validateGuestForm()) return;
            saveGuestBtn.disabled = true; // Disable button to prevent double submit
            const guestData = getGuestFormData();
            let result;
            try {
                if (guestData.guest_id) {
                    result = await GuestAPI.updateGuest(guestData);
                } else {
                    result = await GuestAPI.insertGuest(guestData);
                }
            } catch (err) {
                showError("Failed to save guest.");
                saveGuestBtn.disabled = false;
                return;
            }
            // Accept both {guest_id: ...} and 1 as success
            if (
                result == 1 ||
                (typeof result === "object" && result !== null && result.guest_id)
            ) {
                showSuccess("Guest saved!");
                loadGuestsTable();
                clearGuestForm();
                const modalEl = document.getElementById("guestModal");
                if (modalEl) {
                    const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
                    modalInstance.hide();
                }
            } else {
                showError("Failed to save guest.");
            }
            saveGuestBtn.disabled = false;
        });
    }
});

// Load guests table
async function loadGuestsTable() {
    const tbody = document.getElementById("guestsTableBody");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">Loading...</td></tr>`;
    const guests = await GuestAPI.getAllGuests();
    if (!guests.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">No guests found.</td></tr>`;
        return;
    }
    tbody.innerHTML = "";
    guests.forEach(guest => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${guest.first_name} ${guest.middle_name || ""} ${guest.last_name} ${guest.suffix || ""}</td>
            <td>${guest.email}</td>
            <td>${guest.phone_number}</td>
            <td>${guest.id_type || guest.id_type_name || ""}</td>
            <td>
                <i class="fas fa-eye text-info action-icon" data-action="view" title="View" style="cursor:pointer;"></i>
                <i class="fas fa-edit text-primary action-icon ms-2" data-action="edit" title="Edit" style="cursor:pointer;"></i>
                <i class="fas fa-trash text-danger action-icon ms-2" data-action="delete" title="Delete" style="cursor:pointer;"></i>
                <i class="fas fa-history text-secondary action-icon ms-2" data-action="history" title="Reservation History" style="cursor:pointer;"></i>
            </td>
        `;
        tbody.appendChild(tr);

        // View
        tr.querySelector('[data-action="view"]').onclick = async () => {
            const g = await GuestAPI.viewGuestDetails(guest.guest_id);
            showGuestViewModal(g);
        };
        // Edit
        tr.querySelector('[data-action="edit"]').onclick = async () => {
            const g = await GuestAPI.getGuest(guest.guest_id);
            fillGuestForm(g);
            document.getElementById("guestModalLabel").textContent = "Edit Guest";
            new bootstrap.Modal(document.getElementById("guestModal")).show();
        };
        // Delete
        tr.querySelector('[data-action="delete"]').onclick = async () => {
            if (window.Swal) {
                const result = await Swal.fire({
                    title: "Delete Guest?",
                    text: "Are you sure you want to delete this guest?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Delete",
                    confirmButtonColor: "#d33"
                });
                if (!result.isConfirmed) return;
            } else if (!confirm("Delete this guest?")) {
                return;
            }
            const res = await GuestAPI.deleteGuest(guest.guest_id);
            if (res == 1) {
                showSuccess("Guest deleted.");
                loadGuestsTable();
            } else {
                showError("Failed to delete guest.");
            }
        };
        // Reservation History
        tr.querySelector('[data-action="history"]').onclick = async () => {
            showGuestReservationsModal(guest.guest_id, guest);
        };
    });
}

// Show guest view modal
async function showGuestViewModal(guest) {
    if (!guest) return;
    // Fix: Use correct path for id_picture (remove ../../../ if present)
    let idPicUrl = guest.id_picture || "";
    if (idPicUrl && idPicUrl.startsWith('/../../../')) {
        idPicUrl = idPicUrl.replace('/../../../', '/');
    }
    let html = `
        <div class="row">
            <div class="col-md-4 text-center mb-3">
                ${idPicUrl
            ? `<img src="${idPicUrl}" alt="ID Picture" class="img-fluid rounded border" style="max-height:180px;">`
            : `<div class="text-muted">No ID Picture</div>`}
            </div>
            <div class="col-md-8">
                <table class="table table-sm">
                    <tbody>
                        <tr><th>Name</th><td>${guest.first_name} ${guest.middle_name || ""} ${guest.last_name} ${guest.suffix || ""}</td></tr>
                        <tr><th>Date of Birth</th><td>${guest.date_of_birth || ""}</td></tr>
                        <tr><th>Email</th><td>${guest.email}</td></tr>
                        <tr><th>Phone</th><td>${guest.phone_number}</td></tr>
                        <tr><th>ID Type</th><td>${guest.id_type}</td></tr>
                        <tr><th>ID Number</th><td>${guest.id_number}</td></tr>
                        <tr><th>Created</th><td>${guest.created_at || ""}</td></tr>
                        <tr><th>Updated</th><td>${guest.updated_at || ""}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    if (window.Swal) {
        await Swal.fire({
            title: "Guest Details",
            html,
            width: 700,
            showCloseButton: true,
            showConfirmButton: false
        });
    } else {
        alert("Guest: " + guest.first_name + " " + guest.last_name);
    }
}

// Show guest reservation history modal
async function showGuestReservationsModal(guest_id, guest) {
    // Fetch only this guest's reservations
    let reservations = [];
    try {
        const res = await axios.get("/Hotel-Reservation-Billing-System/api/admin/reservations/reservations.php", {
            params: { operation: "getAllReservations", guest_id }
        });
        // Filter by guest_id (API should already do this, but double-check)
        reservations = Array.isArray(res.data)
            ? res.data.filter(r => String(r.guest_id) === String(guest_id))
            : [];
    } catch (e) {
        reservations = [];
    }

    let html = `<div class="mb-2"><b>Guest:</b> ${guest.first_name} ${guest.last_name}</div>`;
    if (!reservations.length) {
        html += `<div class="text-muted">No reservations found.</div>`;
    } else {
        html += `<div class="table-responsive"><table class="table table-sm">
            <thead>
                <tr>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Room</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${reservations.map(r => `
                    <tr>
                        <td>${r.check_in_date || ""} ${r.check_in_time || ""}</td>
                        <td>${r.check_out_date || ""} ${r.check_out_time || ""}</td>
                        <td>${r.type_name || ""} (${r.room_number || ""})</td>
                        <td>${r.reservation_status || ""}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table></div>`;
    }
    if (window.Swal) {
        await Swal.fire({
            title: "Reservation History",
            html,
            width: 800,
            showCloseButton: true,
            showConfirmButton: false
        });
    } else {
        alert("Reservation history for guest " + guest_id);
    }
}

// Load ID types into select
async function loadIDTypesSelect() {
    const select = document.getElementById("idType");
    if (!select) return;
    select.innerHTML = `<option value="">-- Select ID Type --</option>`;
    const types = await GuestAPI.getAllIDTypes();
    types.forEach(type => {
        const opt = document.createElement("option");
        opt.value = type.id_type;
        opt.textContent = type.id_type;
        opt.dataset.idtypeid = type.guest_idtype_id;
        select.appendChild(opt);
    });
}

// Get guest form data
function getGuestFormData() {
    const idPicInput = document.getElementById("idPicInput");
    let id_picture = "";
    // Only set id_picture if a new file is selected, otherwise keep the old path
    if (idPicInput && idPicInput.files && idPicInput.files[0]) {
        id_picture = idPicInput.files[0]; // Pass File object, not base64
    } else {
        // If editing, keep the current image path
        const idPicPreview = document.getElementById("idPicPreview");
        if (idPicPreview && idPicPreview.src && !idPicPreview.src.includes('data:') && idPicPreview.style.display !== "none") {
            // Only set if there is a current image shown
            id_picture = idPicPreview.src.replace(window.location.origin, "");
        }
    }
    // Get guest_idtype_id from select option (data-id)
    const idTypeSelect = document.getElementById("idType");
    let guest_idtype_id = "";
    if (idTypeSelect) {
        const selected = idTypeSelect.selectedOptions[0];
        guest_idtype_id = selected && selected.dataset && selected.dataset.idtypeid
            ? selected.dataset.idtypeid
            : "";
    }
    return {
        guest_id: document.getElementById("guestId")?.value || undefined,
        first_name: document.getElementById("firstName")?.value || "",
        last_name: document.getElementById("lastName")?.value || "",
        middle_name: document.getElementById("middleName")?.value || "",
        suffix: document.getElementById("suffix")?.value || "",
        date_of_birth: document.getElementById("dateOfBirth")?.value || "",
        email: document.getElementById("email")?.value || "",
        phone_number: document.getElementById("phone")?.value || "",
        id_type: idTypeSelect?.value || "",
        guest_idtype_id: guest_idtype_id,
        id_number: document.getElementById("idNumber")?.value || "",
        id_picture: id_picture
    };
}

// Fill guest form for edit
function fillGuestForm(guest) {
    // Defensive: Only set value if element exists
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || "";
    };
    setVal("guestId", guest.guest_id);
    setVal("firstName", guest.first_name);
    setVal("lastName", guest.last_name);
    setVal("middleName", guest.middle_name);
    setVal("suffix", guest.suffix);
    setVal("dateOfBirth", guest.date_of_birth);
    setVal("email", guest.email);
    setVal("phone", guest.phone_number);

    // Fix: set idType by guest_idtype_id if possible
    const idTypeSelect = document.getElementById("idType");
    if (idTypeSelect) {
        if (guest.guest_idtype_id) {
            for (let opt of idTypeSelect.options) {
                if (opt.dataset.idtypeid == guest.guest_idtype_id) {
                    idTypeSelect.value = opt.value;
                    break;
                }
            }
        } else if (guest.id_type) {
            idTypeSelect.value = guest.id_type;
        } else {
            idTypeSelect.value = "";
        }
    }
    setVal("idNumber", guest.id_number);

    // Set id_picture preview if available
    const idPicInput = document.getElementById("idPicInput");
    const idPicPreview = document.getElementById("idPicPreview");
    let idPicUrl = guest.id_picture || "";
    if (idPicPreview) {
        if (idPicUrl) {
            idPicPreview.src = idPicUrl;
            idPicPreview.style.display = "";
        } else {
            idPicPreview.src = "";
            idPicPreview.style.display = "none";
        }
    }
    if (idPicInput) idPicInput.value = "";
}

// Validate guest form
function validateGuestForm() {
    // ...simple required validation...
    let valid = true;
    ["firstName", "lastName", "email", "phone", "idType", "idNumber"].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) {
            el.classList.add("is-invalid");
            valid = false;
        } else if (el) {
            el.classList.remove("is-invalid");
        }
    });
    return valid;
}

// --- ID Picture upload/preview logic ---
document.addEventListener("DOMContentLoaded", () => {
    // Add preview for id_picture
    const idPicInput = document.getElementById("idPicInput");
    const idPicPreview = document.getElementById("idPicPreview");
    if (idPicInput && idPicPreview) {
        idPicInput.addEventListener("change", function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    idPicPreview.src = e.target.result;
                    idPicPreview.style.display = "";
                };
                reader.readAsDataURL(this.files[0]);
            } else {
                idPicPreview.src = "";
                idPicPreview.style.display = "none";
            }
        });
    }
});

// Add these utility functions if not present
function showError(msg) {
    if (window.Swal) {
        Swal.fire("Error", msg, "error");
    } else {
        alert(msg);
    }
}

function showSuccess(msg) {
    if (window.Swal) {
        Swal.fire("Success", msg, "success");
    } else {
        alert(msg);
    }
}

function clearGuestForm() {
    const form = document.getElementById("guestForm");
    if (form) form.reset();
    const guestId = document.getElementById("guestId");
    if (guestId) guestId.value = "";
    const idPicPreview = document.getElementById("idPicPreview");
    if (idPicPreview) {
        idPicPreview.src = "";
        idPicPreview.style.display = "none";
    }
    const idPicInput = document.getElementById("idPicInput");
    if (idPicInput) idPicInput.value = "";
    // Set max date for dateOfBirth
    const dateOfBirth = document.getElementById("dateOfBirth");
    if (dateOfBirth) {
        const today = new Date();
        dateOfBirth.max = today.toISOString().split("T")[0];
    }
}