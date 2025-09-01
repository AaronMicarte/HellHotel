// Remove unused imports
import { viewAddonModal, updateAddonModal } from "../modules/admin/addons-module.js";

// --- BASE URL ""|"|"|and Caching ---
const BASE_URL = "http://localhost/Hotel-Reservation-Billing-System/api";
let cachedCategories = [];

// --- DOMContentLoaded: Main Entry ---
document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    loadAddons();
    document.getElementById("saveAddonBtn")?.addEventListener("click", saveAddon);
    document.getElementById("saveCategoryBtn")?.addEventListener("click", saveCategory);
    document.getElementById("addCategoryBtn")?.addEventListener("click", openCategoryModal);
    document.getElementById("addAddonBtn")?.addEventListener("click", () => openAddonModal());
    document.getElementById("refreshBtn")?.addEventListener("click", loadAddons);
    // Change: use searchAddons() instead of loadAddons() for tab switch
    document.getElementById("addons-tab")?.addEventListener("click", () => {
        // Always reload categories for filter dropdown
        populateCategoryFilter().then(() => {
            // Reset filter/search if needed, or keep current values
            searchAddons();
        });
    });
    document.getElementById("categories-tab")?.addEventListener("click", loadCategories);
    document.getElementById("searchBtn")?.addEventListener("click", searchAddons);
});

// --- Modal Logic ---
function openCategoryModal() {
    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    document.getElementById('categoryModalLabel').textContent = 'Add New Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    modal.show();
}

async function openAddonModal(addon = null) {
    await populateCategoryFilter(); // Ensure categories are loaded before showing modal
    const modal = new bootstrap.Modal(document.getElementById('addonModal'));
    document.getElementById('addonModalLabel').textContent = addon ? 'Edit Addon' : 'Add New Addon';
    document.getElementById('addonForm').reset();
    document.getElementById('addonId').value = addon?.addon_id || '';
    document.getElementById('addonName').value = addon?.name || '';
    document.getElementById('addonCategory').value = addon?.category_id || '';
    document.getElementById('addonPrice').value = addon?.price || '';
    document.getElementById('addonAvailable').checked = addon?.is_available == 1 || !addon;
    // Image preview logic
    const previewDiv = document.getElementById('addonImagePreview');
    previewDiv.innerHTML = '';
    if (addon && addon.image_url) {
        let imgSrc = '';
        if (addon.image_url.startsWith('http')) {
            imgSrc = addon.image_url;
        } else {
            imgSrc = window.location.origin + "/Hotel-Reservation-Billing-System/assets/images/uploads/addon-images/" + addon.image_url.replace(/^.*[\\\/]/, '');
        }
        const img = document.createElement("img");
        img.src = imgSrc;
        img.classList.add("img-thumbnail", "mt-2");
        img.style.maxHeight = "120px";
        previewDiv.appendChild(img);
    }
    modal.show();
}

// Addon image preview on file select
document.getElementById('addonImage')?.addEventListener('change', function (e) {
    const previewDiv = document.getElementById('addonImagePreview');
    previewDiv.innerHTML = '';
    const file = e.target.files[0];
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

// --- CRUD Functions ---
async function saveAddon() {
    const addonId = document.getElementById('addonId').value;
    const name = document.getElementById('addonName').value;
    const categoryId = document.getElementById('addonCategory').value;
    const price = document.getElementById('addonPrice').value;
    const isAvailable = document.getElementById('addonAvailable').checked ? 1 : 0;
    const addonImage = document.getElementById('addonImage');
    if (!name || !categoryId || !price) {
        Swal.fire({ icon: 'warning', title: 'All fields are required!' });
        return;
    }
    const jsonData = {
        name,
        category_id: parseInt(categoryId),
        price: parseFloat(price),
        is_available: isAvailable
    };
    if (addonId) jsonData.addon_id = addonId;
    const formData = new FormData();
    formData.append("operation", addonId ? "updateAddon" : "createAddon");
    formData.append("json", JSON.stringify(jsonData));
    // Append image if selected
    if (addonImage && addonImage.files[0]) {
        formData.append("addon_image", addonImage.files[0]);
    }
    try {
        const response = await axios({
            url: `${BASE_URL}/admin/addons/addons.php`,
            method: "POST",
            data: formData
        });
        if (response.data == 1 || (response.data && response.data.status === 'success')) {
            loadAddons();
            Swal.fire({ icon: 'success', title: `Addon ${addonId ? 'updated' : 'created'} successfully!` });
            bootstrap.Modal.getInstance(document.getElementById('addonModal')).hide();
        } else {
            Swal.fire({ icon: 'error', title: 'Failed to save addon!' });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error saving addon!' });
    }
}

async function saveCategory() {
    const categoryId = document.getElementById('categoryId').value;
    const categoryName = document.getElementById('categoryName').value;
    if (!categoryName) {
        Swal.fire({ icon: 'warning', title: 'Category name is required!' });
        return;
    }
    const jsonData = { category_name: categoryName };
    if (categoryId) jsonData.category_id = categoryId;
    const formData = new FormData();
    formData.append("operation", categoryId ? "updateCategory" : "createCategory");
    formData.append("json", JSON.stringify(jsonData));
    try {
        const response = await axios({
            url: `${BASE_URL}/admin/addons/categories.php`,
            method: "POST",
            data: formData
        });
        if (response.data.status === 'success') {
            loadCategories();
            Swal.fire({ icon: 'success', title: `Category ${categoryId ? 'updated' : 'created'} successfully!` });
            bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
        } else {
            Swal.fire({ icon: 'error', title: response.data.message || 'Failed to save category!' });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error saving category!' });
    }
}

async function deleteAddon(addonId) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    const jsonData = { addon_id: addonId };
    const formData = new FormData();
    formData.append("operation", "deleteAddon");
    formData.append("json", JSON.stringify(jsonData));
    try {
        const response = await axios({
            url: `${BASE_URL}/admin/addons/addons.php`,
            method: "POST",
            data: formData
        });
        if (response.data == 1) {
            loadAddons();
            Swal.fire({ icon: 'success', title: 'Addon deleted successfully!' });
        } else {
            Swal.fire({ icon: 'error', title: 'Failed to delete addon!' });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error deleting addon!' });
    }
}

async function deleteCategory(categoryId) {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This will also affect all addons in this category!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    const jsonData = { category_id: categoryId };
    const formData = new FormData();
    formData.append("operation", "deleteCategory");
    formData.append("json", JSON.stringify(jsonData));
    try {
        const response = await axios({
            url: `${BASE_URL}/admin/addons/categories.php`,
            method: "POST",
            data: formData
        });
        if (response.data.status === 'success') {
            loadCategories();
            Swal.fire({ icon: 'success', title: 'Category deleted successfully!' });
        } else {
            Swal.fire({ icon: 'error', title: response.data.message || 'Failed to delete category!' });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error deleting category!' });
    }
}

// --- Stats Overview ---
function updateAddonStatsOverview(addons) {
    let total = addons.length;
    let available = 0, unavailable = 0;
    addons.forEach(a => {
        if (a.is_available == 1) available++;
        else unavailable++;
    });
    const statTotal = document.getElementById("statTotalAddons");
    const statAvail = document.getElementById("statAvailableAddons");
    const statUnavail = document.getElementById("statUnavailableAddons");
    if (statTotal) statTotal.textContent = total;
    if (statAvail) statAvail.textContent = available;
    if (statUnavail) statUnavail.textContent = unavailable;
}

// --- Loaders & Display ---
async function loadAddons(categoryId = '', searchTerm = '') {
    const tableDiv = document.getElementById("addons-table-div");
    if (tableDiv) tableDiv.innerHTML = `<div class='text-center p-3'>Loading...</div>`;
    try {
        const params = { operation: "getAllAddons" };
        if (categoryId) params.category = categoryId;
        if (searchTerm) params.search = searchTerm;
        const response = await axios.get(`${BASE_URL}/admin/addons/addons.php`, { params });
        displayAddons(response.data || []);
        updateAddonStatsOverview(response.data || []);
    } catch (error) {
        if (tableDiv) tableDiv.innerHTML = `<div class='text-center text-danger p-3'>Error loading addons</div>`;
        updateAddonStatsOverview([]);
    }
}

async function loadCategories(searchTerm = '') {
    const tableDiv = document.getElementById("categories-table-div");
    if (tableDiv) tableDiv.innerHTML = `<div class='text-center p-3'>Loading...</div>`;
    try {
        const params = { operation: "getAllCategories" };
        // Only add search param if user actually typed something
        if (searchTerm && searchTerm.length > 0) params.search = searchTerm;
        const response = await axios.get(`${BASE_URL}/admin/addons/categories.php`, { params });
        cachedCategories = response.data.data || [];
        displayCategories(cachedCategories);
        await populateCategoryFilter();
    } catch (error) {
        if (tableDiv) tableDiv.innerHTML = `<div class='text-center text-danger p-3'>Error loading categories</div>`;
    }
}

function displayAddons(addons) {
    const tableDiv = document.getElementById("addons-table-div");
    if (!tableDiv) return;
    let html = `<table class='table'>
        <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>`;
    if (!addons.length) {
        html += `<tr><td colspan="6" class="text-center p-3">No addons found.</td></tr>`;
    } else {
        addons.forEach(addon => {
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
            html += `<tr>
                <td><img src="${imgSrc}" class="img-thumbnail" style="max-width:60px;max-height:60px;" onerror="this.onerror=null;this.src='../../assets/images/uploads/addon-images/placeholder-addon.jpg';"></td>
                <td>${addon.name}</td>
                <td>${addon.category_name || '-'}</td>
                <td>₱${parseFloat(addon.price).toFixed(2)}</td>
                <td><span class="badge ${addon.is_available == 1 ? 'bg-success' : 'bg-secondary'}">${addon.is_available == 1 ? 'Available' : 'Unavailable'}</span></td>
                <td>
                    <i class='fas fa-eye text-info me-1' data-addon-id="${addon.addon_id}" title="View" style="cursor:pointer; margin-right:10px;"></i>
                    <i class='fas fa-edit text-primary me-1' data-addon-id="${addon.addon_id}" title="Edit" style="cursor:pointer; margin-right:10px;"></i>
                    <i class='fas fa-trash text-danger' data-addon-id="${addon.addon_id}" title="Delete" style="cursor:pointer; margin-right:10px;"></i>
                </td>
            </tr>`;
        });
    }
    html += `</tbody></table>`;
    tableDiv.innerHTML = html;
    updateAddonStatsOverview(addons); // Always update stats on display
}

function displayCategories(categories) {
    const tableDiv = document.getElementById("categories-table-div");
    if (!tableDiv) return;
    let html = `<table class='table'>
        <thead><tr><th>Name</th><th>Actions</th></tr></thead><tbody>`;
    if (!categories.length) {
        html += `<tr><td colspan="2" class="text-center p-3">No categories found.</td></tr>`;
    } else {
        categories.forEach(cat => {
            html += `<tr>
                <td>${cat.category_name}</td>
                <td>
                    <i class='fas fa-edit text-primary me-1' data-category-id="${cat.category_id}" title="Edit" style="cursor:pointer;"></i>
                    <i class='fas fa-trash text-danger' data-category-id="${cat.category_id}" title="Delete" style="cursor:pointer;"></i>
                </td>
            </tr>`;
        });
    }
    html += `</tbody></table>`;
    tableDiv.innerHTML = html;
}

async function populateCategoryFilter() {
    // Populate filter dropdown
    const filterSelect = document.getElementById('categoryFilter');
    if (filterSelect) {
        // Always use cachedCategories if available, otherwise fetch
        if (!cachedCategories.length) {
            try {
                const response = await axios.get(`${BASE_URL}/admin/addons/categories.php`, {
                    params: { operation: "getAllCategories" }
                });
                cachedCategories = response.data.data || [];
            } catch (e) {
                cachedCategories = [];
            }
        }
        filterSelect.innerHTML = '<option value="">All Categories</option>';
        cachedCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.category_id;
            option.textContent = cat.category_name;
            filterSelect.appendChild(option);
        });
    }
    // Populate modal dropdown
    const modalSelect = document.getElementById('addonCategory');
    if (modalSelect) {
        modalSelect.innerHTML = '<option value="" disabled selected>-- Select Category --</option>';
        cachedCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.category_id;
            option.textContent = cat.category_name;
            modalSelect.appendChild(option);
        });
    }
}

// --- Search & Filter ---
async function searchAddons() {
    const searchTerm = document.getElementById('searchAddon').value.trim();
    const categoryId = document.getElementById('categoryFilter').value;
    const tableDiv = document.getElementById("addons-table-div");
    tableDiv.innerHTML = `<div class='text-center p-3'>Searching...</div>`;
    try {
        await loadAddons(categoryId, searchTerm);
    } catch (error) {
        tableDiv.innerHTML = `<div class='text-center text-danger p-3'>Error searching addons</div>`;
        updateAddonStatsOverview([]);
    }
}

async function searchCategories() {
    const searchTerm = document.getElementById('searchCategory').value.trim();
    const tableDiv = document.getElementById("categories-table-div");
    tableDiv.innerHTML = `<div class='text-center p-3'>Searching...</div>`;
    try {
        await loadCategories(searchTerm);
    } catch (error) {
        tableDiv.innerHTML = `<div class='text-center text-danger p-3'>Error searching categories</div>`;
    }
}

// --- Debounce Helper ---
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// --- Edit Functions ---
async function editAddon(id) {
    try {
        const response = await axios.get(`${BASE_URL}/admin/addons/addons.php`, {
            params: { operation: "getAddon", json: JSON.stringify({ addon_id: id }) }
        });
        const addon = response.data;
        await openAddonModal(addon);
    } catch (error) {
        Swal.fire('Error', 'Failed to load addon for editing', 'error');
    }
}

async function editCategory(id) {
    try {
        const response = await axios.get(`${BASE_URL}/admin/addons/categories.php`, {
            params: { operation: "getCategory", json: JSON.stringify({ category_id: id }) }
        });
        if (response.data && response.data.status === 'success' && response.data.data) {
            const category = response.data.data;
            const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
            document.getElementById('categoryModalLabel').textContent = 'Edit Category';
            document.getElementById('categoryId').value = category.category_id;
            document.getElementById('categoryName').value = category.category_name;
            modal.show();
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        Swal.fire('Error', 'Failed to load category for editing', 'error');
    }
}

// Use event delegation for edit/delete/view actions instead of window globals
document.addEventListener('click', async (e) => {
    // View Addon
    if (e.target.matches('.fa-eye[data-addon-id]')) {
        const id = e.target.getAttribute('data-addon-id');
        if (id && typeof viewAddonModal === "function") await viewAddonModal(Number(id));
    }
    // Edit Addon
    if (e.target.matches('.fa-edit[data-addon-id]')) {
        const id = e.target.getAttribute('data-addon-id');
        if (id) await editAddon(Number(id));
    }
    // Delete Addon
    if (e.target.matches('.fa-trash[data-addon-id]')) {
        const id = e.target.getAttribute('data-addon-id');
        if (id) await deleteAddon(Number(id));
    }
    // Edit Category
    if (e.target.matches('.fa-edit[data-category-id]')) {
        const id = e.target.getAttribute('data-category-id');
        if (id) await editCategory(Number(id));
    }
    // Delete Category
    if (e.target.matches('.fa-trash[data-category-id]')) {
        const id = e.target.getAttribute('data-category-id');
        if (id) await deleteCategory(Number(id));
    }
});

// Add event listener for search input (real-time search)
document.getElementById('searchAddon')?.addEventListener('keyup', debounce(() => {
    searchAddons();
}, 500));

// Add event listener for category filter change
document.getElementById('categoryFilter')?.addEventListener('change', () => {
    searchAddons();
});

// Add event listener for category search input (real-time search)
document.getElementById('searchCategory')?.addEventListener('keyup', debounce(() => {
    searchCategories();
}, 500));

// Add event listener for category search button
document.getElementById('searchCategoryBtn')?.addEventListener('click', () => {
    searchCategories();
});

