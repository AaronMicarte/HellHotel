// User Update & Delete Modal Module (Admin)
// Structure matches rooms-module.js

// --- Show Update User Modal ---
export const updateUserModal = async (userId, roles, refreshDisplay) => {
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

        document.getElementById("blank-modal-title").innerText = "Update User";

        const user = await getUserDetails(userId);

        let myHtml = `
            <table class="table table-sm">
              <tr>
                <td>Username</td>
                <td><input type="text" id="update-username" class="form-control" value="${user.username}" /></td>
              </tr>
              <tr>
                <td>Email</td>
                <td><input type="email" id="update-email" class="form-control" value="${user.email || ''}" /></td>
              </tr>
              <tr>
                <td>Role</td>
                <td>${createRoleSelect(roles, user.user_roles_id)}</td>
              </tr>
              <tr>
                <td>New Password</td>
                <td><input type="password" id="update-password" class="form-control" autocomplete="new-password" /></td>
              </tr>
              <tr>
                <td>Confirm Password</td>
                <td><input type="password" id="update-confirm-password" class="form-control" autocomplete="new-password" /></td>
              </tr>
            </table>
        `;
        document.getElementById("blank-main-div").innerHTML = myHtml;

        const modalFooter = document.getElementById("blank-modal-footer");
        modalFooter.innerHTML = `
          <button type="button" class="btn btn-primary w-100 btn-update-user">UPDATE</button>
          <button type="button" class="btn btn-secondary w-100" data-bs-dismiss="modal">Close</button>
        `;

        modalFooter.querySelector(".btn-update-user").addEventListener("click", async () => {
            const result = await updateUser(userId);
            if (result && result.status === "success") {
                refreshDisplay();
                if (window.Swal) {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'User has been successfully updated!',
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
                        title: result && result.message ? result.message : 'Failed to update user!',
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

// --- Show Delete User Modal ---
export const deleteUserModal = async (userId, refreshDisplay) => {
    try {
        if (window.Swal) {
            const result = await Swal.fire({
                title: 'Delete User?',
                text: 'Are you sure you want to delete this user? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#d33'
            });
            if (!result.isConfirmed) return;
        } else {
            if (!confirm("Are you sure you want to delete this user?")) return;
        }

        const result = await deleteUser(userId);
        if (result && result.status === "success") {
            refreshDisplay();
            if (window.Swal) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'User deleted successfully',
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
                    title: result && result.message ? result.message : 'Failed to delete user!',
                    showConfirmButton: false,
                    timer: 1800
                });
            }
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user");
    }
};

// --- Helper: Get User Details ---
const getUserDetails = async (userId) => {
    const params = { id: userId };
    const response = await axios.get(
        `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/add-user/users.php`,
        { params }
    );
    return response.data && response.data.user ? response.data.user : {};
};

// --- Helper: Create Role Select ---
const createRoleSelect = (roles, selectedId) => {
    let myHtml = `<select id="update-user-role" class="form-select">`;
    roles.forEach(role => {
        let selected = selectedId == role.user_roles_id ? "selected" : "";
        myHtml += `<option value="${role.user_roles_id}" ${selected}>${role.role_type}</option>`;
    });
    myHtml += "</select>";
    return myHtml;
};

// --- Update User Logic ---
const updateUser = async (userId) => {
    const username = document.getElementById("update-username").value.trim();
    const email = document.getElementById("update-email").value.trim();
    const userRole = document.getElementById("update-user-role").value;
    const password = document.getElementById("update-password").value;
    const confirmPassword = document.getElementById("update-confirm-password").value;

    if (!username) {
        return { status: "error", message: "Username is required" };
    }
    if (password && password !== confirmPassword) {
        return { status: "error", message: "Passwords do not match" };
    }
    if (!userRole) {
        return { status: "error", message: "Please select a user role" };
    }

    const userData = {
        user_id: userId,
        username: username,
        email: email,
        user_roles_id: userRole
    };
    if (password) userData.password = password;

    try {
        const response = await axios.put(
            `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/add-user/users.php`,
            userData
        );
        return response.data;
    } catch (err) {
        return { status: "error", message: "Failed to update user" };
    }
};

// --- Delete User Logic ---
const deleteUser = async (userId) => {
    // Soft delete: set is_deleted = 1
    try {
        const response = await axios.put(
            `${window.location.origin}/Hotel-Reservation-Billing-System/api/admin/add-user/users.php`,
            {
                user_id: userId,
                is_deleted: 1,
                update_type: 'status_only'
            }
        );
        return response.data;
    } catch (err) {
        return { status: "error", message: "Failed to delete user" };
    }
};
