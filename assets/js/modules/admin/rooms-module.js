// Room Update & Delete Module (Admin)
// This module provides updateRoomModal (edit) and deleteRoomModal (delete) logic for admin rooms.
// Similar structure to SIR MAC's update.js

// --- Show Update Room Modal ---
export const updateRoomModal = async (roomId, roomTypes, refreshDisplay) => {
    try {
        const modalElement = document.getElementById("blank-modal");
        if (!modalElement) {
            console.error("Modal element not found");
            return;
        }

        const myModal = new bootstrap.Modal(modalElement, {
            keyboard: true,
            backdrop: "static",
        });

        // Prepare modal content
        document.getElementById("blank-modal-title").innerText = "Update Room Record";

        const room = await getRoomDetails(roomId);

        // Always show status dropdown in the modal
        let myHtml = `
            <table class="table table-sm">
              <tr>
                <td>Room Number</td>
                <td>
                  <input type="text" id="update-room-number" class="form-control" value="${room.room_number}" />
                </td>
              </tr>
              <tr>
                <td>Room Type</td>
                <td>
                  ${createRoomTypeSelect(roomTypes, room.room_type_id)}
                </td>
              </tr>
              <tr>
                <td>Status</td>
                <td>
                  ${createStatusSelect(room.room_status_id)}
                </td>
              </tr>
            </table>
        `;
        document.getElementById("blank-main-div").innerHTML = myHtml;

        // Modal footer with update button
        const modalFooter = document.getElementById("blank-modal-footer");
        myHtml = `
          <button type="button" class="btn btn-primary btn-sm w-100 btn-update">UPDATE</button>
          <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
        `;
        modalFooter.innerHTML = myHtml;

        modalFooter.querySelector(".btn-update").addEventListener("click", async () => {
            const result = await updateRoom(roomId);
            if (result == 1) {
                refreshDisplay();
                if (window.Swal) {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Room record has been successfully updated!',
                        showConfirmButton: false,
                        timer: 1800
                    });
                }
                myModal.hide();
            } else {
                if (window.Swal) {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: 'Failed to update room record!',
                        showConfirmButton: false,
                        timer: 1800
                    });
                }
            }
        });

        myModal.show();
    } catch (error) {
        console.error("Error showing modal:", error);
        alert("Error showing modal");
    }
};

// --- Show Delete Room Modal ---
export const deleteRoomModal = async (roomId, refreshDisplay) => {
    try {
        if (window.Swal) {
            const result = await Swal.fire({
                title: 'Delete Room?',
                text: 'Are you sure you want to delete this room? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#d33'
            });
            if (!result.isConfirmed) return;
        } else {
            if (!confirm("Are you sure you want to delete this room?")) return;
        }

        if (await deleteRoom(roomId) == 1) {
            refreshDisplay();
            if (window.Swal) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Room deleted successfully',
                    showConfirmButton: false,
                    timer: 1800
                });
            }
        } else {
            if (window.Swal) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Failed to delete room record!',
                    showConfirmButton: false,
                    timer: 1800
                });
            }
        }
    } catch (error) {
        console.error("Error deleting room:", error);
        alert("Error deleting room");
    }
};

// --- Room Type Update & Delete ---
export const updateRoomTypeModal = async (roomTypeId, refreshDisplay) => {
    try {
        const modalElement = document.getElementById("blank-modal");
        if (!modalElement) {
            console.error("Modal element not found");
            return;
        }
        const myModal = new bootstrap.Modal(modalElement, {
            keyboard: true,
            backdrop: "static",
        });

        document.getElementById("blank-modal-title").innerText = "Update Room Type";

        // Fetch room type details (no features logic here)
        let roomType = {};
        try {
            const res = await axios.get(
                `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/rooms/room-type.php`,
                { params: { id: roomTypeId } }
            );
            roomType = Array.isArray(res.data) ? res.data[0] : res.data;
        } catch (e) {
            roomType = {};
        }

        let myHtml = `
            <table class="table table-sm border-0">
              <tr>
                <td>Type Name</td>
                <td>
                  <input type="text" id="update-type-name" class="form-control" value="${roomType.type_name || ''}" />
                </td>
              </tr>
              <tr>
                <td>Description</td>
                <td>
                  <textarea id="update-type-description" class="form-control">${roomType.description || ''}</textarea>
                </td>
              </tr>
              <tr>
                <td>Max Capacity</td>
                <td>
                  <input type="number" id="update-max-capacity" class="form-control" value="${roomType.max_capacity || ''}" />
                </td>
              </tr>
              <tr>
                <td>Price Per Stay</td>
                <td>
                  <input type="number" id="update-price-per-stay" class="form-control" value="${roomType.price_per_stay || ''}" />
                </td>
              </tr>
              <tr>
                <td>Room Size (sqm)</td>
                <td>
                  <input type="number" id="update-room-size" class="form-control" value="${roomType.room_size_sqm || ''}" />
                </td>
              </tr>
              <tr>
                <td>Image</td>
                <td>
                  <input type="file" id="update-room-image" class="form-control" accept="image/*" />
                  <div id="update-image-preview" class="mt-2"></div>
                </td>
              </tr>
            </table>
        `;
        document.getElementById("blank-main-div").innerHTML = myHtml;

        // Show current image or placeholder
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
        img.style.maxHeight = "120px";
        document.getElementById("update-image-preview").appendChild(img);

        // Preview new image on file select
        document.getElementById("update-room-image").addEventListener("change", function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (ev) {
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        const modalFooter = document.getElementById("blank-modal-footer");
        myHtml = `
          <button type="button" class="btn btn-primary btn-sm w-100 btn-update-type">UPDATE</button>
          <button type="button" class="btn btn-secondary btn-sm w-100" data-bs-dismiss="modal">Close</button>
        `;
        modalFooter.innerHTML = myHtml;

        modalFooter.querySelector(".btn-update-type").addEventListener("click", async () => {
            try {
                const typeNameValue = document.getElementById("update-type-name").value.trim();
                if (!typeNameValue) {
                    if (window.Swal) {
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'warning',
                            title: 'Type name is required',
                            showConfirmButton: false,
                            timer: 1800
                        });
                    } else {
                        alert("Type name is required");
                    }
                    return;
                }

                // No features logic here
                const result = await updateRoomType(roomTypeId);

                if (result && (result.message || result === 1)) {
                    refreshDisplay();
                    if (window.Swal) {
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'Room type has been successfully updated!',
                            showConfirmButton: false,
                            timer: 1800
                        });
                    }
                    myModal.hide();
                } else {
                    throw new Error('API did not return success');
                }
            } catch (error) {
                console.error("Error updating room type:", error);
                if (window.Swal) {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: 'Failed to update room type!',
                        text: error && error.message ? error.message : '',
                        showConfirmButton: false,
                        timer: 1800
                    });
                } else {
                    alert("ERROR updating room type: " + (error && error.message ? error.message : ''));
                }
            }
        });

        myModal.show();
    } catch (error) {
        console.error("Error showing modal:", error);
        alert("Error showing modal");
    }
};

export const deleteRoomTypeModal = async (roomTypeId, refreshDisplay) => {
    try {
        if (window.Swal) {
            const result = await Swal.fire({
                title: 'Delete Room Type?',
                text: 'Are you sure you want to delete this room type? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#d33'
            });
            if (!result.isConfirmed) return;
        } else {
            if (!confirm("Are you sure you want to delete this room type?")) return;
        }

        if (await deleteRoomType(roomTypeId) == 1) {
            refreshDisplay();
            if (window.Swal) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Room type deleted successfully',
                    showConfirmButton: false,
                    timer: 1800
                });
            }
        } else {
            if (window.Swal) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Failed to delete room type!',
                    showConfirmButton: false,
                    timer: 1800
                });
            } else {
                alert("ERROR deleting room type!");
            }
        }
    } catch (error) {
        console.error("Error deleting room type:", error);
        alert("Error deleting room type");
    }
};

// --- Helper: Get Room Details ---
const getRoomDetails = async (roomId) => {
    const params = {
        room_id: roomId
    };
    // API expects ?room_id=...
    const response = await axios.get(
        `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/rooms/rooms.php`,
        { params }
    );
    // API returns array, get first element
    return Array.isArray(response.data) ? response.data[0] : response.data;
};

// --- Helper: Create Room Type Select ---
const createRoomTypeSelect = (roomTypes, selectedId) => {
    let myHtml = `<select id="update-room-type" class="form-select">`;
    roomTypes.forEach(type => {
        let selected = selectedId == type.room_type_id ? "selected" : "";
        myHtml += `<option value="${type.room_type_id}" ${selected}>${type.type_name}</option>`;
    });
    myHtml += "</select>";
    return myHtml;
};

// --- Helper: Create Status Select ---
const createStatusSelect = (selectedStatusId) => {
    // Statuses: 1: available, 2: occupied, 3: maintenance, 4: reserved
    const statuses = [
        { id: 1, label: "Available" },
        { id: 2, label: "Occupied" },
        { id: 3, label: "Maintenance" },
        { id: 4, label: "Reserved" }
    ];
    let myHtml = `<select id="update-room-status" class="form-select">`;
    statuses.forEach(status => {
        let selected = selectedStatusId == status.id ? "selected" : "";
        myHtml += `<option value="${status.id}" ${selected}>${status.label}</option>`;
    });
    myHtml += "</select>";
    return myHtml;
};

// --- Update Room Logic ---
const updateRoom = async (roomId) => {
    const jsonData = {
        room_id: roomId,
        room_number: document.getElementById("update-room-number").value,
        room_type_id: document.getElementById("update-room-type").value,
        room_status_id: document.getElementById("update-room-status").value,
        update_type: "full"
    };

    const formData = new FormData();
    formData.append("operation", "updateRoom");
    formData.append("json", JSON.stringify(jsonData));

    const response = await axios({
        url: `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/rooms/rooms.php`,
        method: "POST",
        data: formData,
    });
    return response.data;
};

// --- Delete Room Logic ---
const deleteRoom = async (roomId) => {
    const jsonData = {
        room_id: roomId
    };

    const formData = new FormData();
    formData.append("operation", "deleteRoom");
    formData.append("json", JSON.stringify(jsonData));

    const response = await axios({
        url: `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/rooms/rooms.php`,
        method: "POST",
        data: formData,
    });
    return response.data;
};

// --- Helper: Get Room Type Details ---
const getRoomTypeDetails = async (roomTypeId) => {
    const params = { id: roomTypeId };
    const response = await axios.get(
        `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/rooms/room-type.php`,
        { params }
    );
    return Array.isArray(response.data) ? response.data[0] : response.data;
};

const updateRoomType = async (roomTypeId) => {
    // Use FormData for update, support image upload
    const formData = new FormData();
    formData.append("operation", "updateRoomType");
    formData.append("room_type_id", roomTypeId);
    formData.append("type_name", document.getElementById("update-type-name").value);
    formData.append("description", document.getElementById("update-type-description").value);
    formData.append("max_capacity", document.getElementById("update-max-capacity").value);
    formData.append("price_per_stay", document.getElementById("update-price-per-stay").value);
    formData.append("room_size_sqm", document.getElementById("update-room-size").value);
    const imageFile = document.getElementById("update-room-image").files[0];
    if (imageFile) formData.append("room_image", imageFile);
    // Do not send features here, handled by room-type-feature.php above
    const response = await axios.post(`${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/rooms/room-type.php`, formData);
    return response.data;
};

// --- Delete Room Type Logic ---
const deleteRoomType = async (roomTypeId) => {
    const jsonData = { room_type_id: roomTypeId };

    const formData = new FormData();
    formData.append("operation", "deleteRoomType");
    formData.append("json", JSON.stringify(jsonData));

    const response = await axios({
        url: `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/rooms/room-type.php`,
        method: "POST",
        data: formData,
    });
    return response.data;
};