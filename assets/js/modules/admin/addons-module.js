// Addon View & Update Modal Module (Admin)

export const viewAddonModal = async (addonId) => {
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
        document.getElementById("blank-modal-title").innerText = "View Addon";
        const addon = await getAddonDetails(addonId);

        // Prepare image
        let imgSrc = '';
        if (addon.image_url) {
            if (addon.image_url.startsWith('http')) {
                imgSrc = addon.image_url;
            } else {
                imgSrc = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/addon-images/" + addon.image_url.replace(/^.*[\\\/]/, '');
            }
        } else {
            imgSrc = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/addon-images/placeholder-addon.jpg";
        }

        let myHtml = `
            <div class="row">
                <div class="col-md-4 text-center mb-3">
                    <img src="${imgSrc}" class="img-thumbnail mb-2" style="max-width:180px;max-height:180px;" onerror="this.onerror=null;this.src='../../assets/images/uploads/addon-images/placeholder-addon.jpg';">
                </div>
                <div class="col-md-8">
                    <table class="table table-sm">
                        <tr><td><strong>Name</strong></td><td>${addon.name}</td></tr>
                        <tr><td><strong>Category</strong></td><td>${addon.category_name || "-"}</td></tr>
                        <tr><td><strong>Price</strong></td><td>₱${parseFloat(addon.price).toFixed(2)}</td></tr>
                        <tr><td><strong>Status</strong></td><td>${addon.is_available == 1 ? '<span class="badge bg-success">Available</span>' : '<span class="badge bg-secondary">Unavailable</span>'}</td></tr>
                        <tr><td><strong>ID</strong></td><td>${addon.addon_id}</td></tr>
                    </table>
                </div>
            </div>
        `;
        document.getElementById("blank-main-div").innerHTML = myHtml;
        document.getElementById("blank-modal-footer").innerHTML = `<button type="button" class="btn btn-secondary w-100" data-bs-dismiss="modal">Close</button>`;
        myModal.show();
    } catch (error) {
        console.error("Error showing modal:", error);
        alert("Error showing modal");
    }
};

// --- Modular Addon Update Modal (Admin) ---
// Structure now matches rooms-module.js

export const updateAddonModal = async (addonId, categories, refreshDisplay) => {
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
        document.getElementById("blank-modal-title").innerText = "Update Addon";
        const addon = await getAddonDetails(addonId);

        let imgSrc = '';
        if (addon.image_url) {
            if (addon.image_url.startsWith('http')) {
                imgSrc = addon.image_url;
            } else {
                imgSrc = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/addon-images/" + addon.image_url.replace(/^.*[\\\/]/, '');
            }
        } else {
            imgSrc = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/addon-images/placeholder-addon.jpg";
        }

        let myHtml = `
            <table class="table table-sm">
              <tr>
                <td>Name</td>
                <td><input type="text" id="update-addon-name" class="form-control" value="${addon.name}" /></td>
              </tr>
              <tr>
                <td>Category</td>
                <td>${createCategorySelect(categories, addon.category_id)}</td>
              </tr>
              <tr>
                <td>Price</td>
                <td><input type="number" id="update-addon-price" class="form-control" value="${addon.price}" /></td>
              </tr>
              <tr>
                <td>Status</td>
                <td>${createStatusSelect(addon.is_available)}</td>
              </tr>
              <tr>
                <td>Image</td>
                <td>
                  <input type="file" id="update-addon-image" class="form-control" accept="image/*" />
                  <div id="update-addon-image-preview" class="mt-2">
                    <img src="${imgSrc}" class="img-thumbnail mt-2" style="max-height:120px;">
                  </div>
                </td>
              </tr>
            </table>
        `;
        document.getElementById("blank-main-div").innerHTML = myHtml;

        // Preview new image on file select
        document.getElementById("update-addon-image").addEventListener("change", function (e) {
            const file = e.target.files[0];
            const previewDiv = document.getElementById("update-addon-image-preview");
            previewDiv.innerHTML = '';
            if (file) {
                const reader = new FileReader();
                reader.onload = function (ev) {
                    const img = document.createElement("img");
                    img.src = ev.target.result;
                    img.classList.add("img-thumbnail", "mt-2");
                    img.style.maxHeight = "120px";
                    previewDiv.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });

        // Modal footer with update button
        const modalFooter = document.getElementById("blank-modal-footer");
        modalFooter.innerHTML = `
          <button type="button" class="btn btn-primary w-100 btn-update-addon">UPDATE</button>
          <button type="button" class="btn btn-secondary w-100" data-bs-dismiss="modal">Close</button>
        `;

        modalFooter.querySelector(".btn-update-addon").addEventListener("click", async () => {
            const result = await updateAddon(addonId);
            if (result == 1) {
                refreshDisplay();
                if (window.Swal) {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Addon has been successfully updated!',
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
                        title: 'Failed to update addon!',
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

// --- Modular Addon Delete Modal (Admin) ---
export const deleteAddonModal = async (addonId, refreshDisplay) => {
    try {
        if (window.Swal) {
            const result = await Swal.fire({
                title: 'Delete Addon?',
                text: 'Are you sure you want to delete this addon? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#d33'
            });
            if (!result.isConfirmed) return;
        } else {
            if (!confirm("Are you sure you want to delete this addon?")) return;
        }

        if (await deleteAddon(addonId) == 1) {
            refreshDisplay();
            if (window.Swal) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Addon deleted successfully',
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
                    title: 'Failed to delete addon!',
                    showConfirmButton: false,
                    timer: 1800
                });
            }
        }
    } catch (error) {
        console.error("Error deleting addon:", error);
        alert("Error deleting addon");
    }
};

// --- Helper: Get Addon Details ---
const getAddonDetails = async (addonId) => {
    const params = { addon_id: addonId };
    const response = await axios.get(
        `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/addons/addons.php`,
        { params: { operation: "getAddon", json: JSON.stringify(params) } }
    );
    return response.data;
};

// --- Helper: Create Category Select ---
const createCategorySelect = (categories, selectedId) => {
    let myHtml = `<select id="update-addon-category" class="form-select">`;
    categories.forEach(cat => {
        let selected = selectedId == cat.category_id ? "selected" : "";
        myHtml += `<option value="${cat.category_id}" ${selected}>${cat.category_name}</option>`;
    });
    myHtml += "</select>";
    return myHtml;
};

// --- Helper: Create Status Select ---
const createStatusSelect = (isAvailable) => {
    let myHtml = `<select id="update-addon-status" class="form-select">`;
    myHtml += `<option value="1" ${isAvailable == 1 ? "selected" : ""}>Available</option>`;
    myHtml += `<option value="0" ${isAvailable == 0 ? "selected" : ""}>Unavailable</option>`;
    myHtml += "</select>";
    return myHtml;
};

// --- Update Addon Logic ---
const updateAddon = async (addonId) => {
    const jsonData = {
        addon_id: addonId,
        name: document.getElementById("update-addon-name").value,
        category_id: document.getElementById("update-addon-category").value,
        price: document.getElementById("update-addon-price").value,
        is_available: document.getElementById("update-addon-status").value
    };
    const formData = new FormData();
    formData.append("operation", "updateAddon");
    formData.append("json", JSON.stringify(jsonData));
    // Add image if selected
    const imageInput = document.getElementById("update-addon-image");
    if (imageInput && imageInput.files[0]) {
        formData.append("addon_image", imageInput.files[0]);
    }
    const response = await axios({
        url: `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/addons/addons.php`,
        method: "POST",
        data: formData,
    });
    return response.data;
};

// --- Delete Addon Logic ---
const deleteAddon = async (addonId) => {
    const jsonData = { addon_id: addonId };
    const formData = new FormData();
    formData.append("operation", "deleteAddon");
    formData.append("json", JSON.stringify(jsonData));
    const response = await axios({
        url: `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/addons/addons.php`,
        method: "POST",
        data: formData,
    });
    return response.data;
};
