import {
    updateUserModal,
    deleteUserModal
} from "../modules/admin/add-user-module.js";

(function () {
    const BASE_URL = "http://localhost/Hotel-Reservation-Billing-System/api";
    let cachedRoles = [];

    // --- Email validation ---
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // --- Load user roles (for add/edit) ---
    async function loadUserRoles() {
        const roleSelect = document.getElementById('user-role');
        try {
            const response = await axios.get(`${BASE_URL}/admin/add-user/add-user.php`);
            const data = response.data;
            cachedRoles = data.roles || [];
            if (roleSelect) {
                // Remove old options except the first
                while (roleSelect.options.length > 1) {
                    roleSelect.remove(1);
                }
                cachedRoles.forEach(role => {
                    const option = document.createElement('option');
                    option.value = role.user_roles_id;
                    option.textContent = role.role_type;
                    roleSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading user roles:', error);
        }
    }

    // --- CRUD: User List Table ---
    async function loadUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Loading users...</td></tr>`;
        try {
            const res = await axios.get(`${BASE_URL}/admin/add-user/users.php`);
            const users = res.data.users || [];
            if (users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No users found.</td></tr>`;
                return;
            }
            tbody.innerHTML = '';
            users.forEach((user, idx) => {
                tbody.innerHTML += `
                    <tr>
                        <td>${idx + 1}</td>
                        <td>${user.username}</td>
                        <td>${user.email || ''}</td>
                        <td>${user.role_type}</td>
                        <td>${user.created_at ? user.created_at.split(' ')[0] : ''}</td>
                        <td>
                            <span class="badge ${user.is_deleted ? 'bg-danger' : 'bg-success'}">
                                ${user.is_deleted ? 'Inactive' : 'Active'}
                            </span>
                        </td>
                        <td class="text-center">
                            <button class="btn btn-sm text-warning btn-status-user" data-id="${user.user_id}" title="${user.is_deleted ? 'Activate' : 'Deactivate'}">
                                <i class="fas fa-${user.is_deleted ? 'toggle-off' : 'toggle-on'}"></i>
                            </button>
                            <button class="btn btn-sm text-primary btn-edit-user" data-id="${user.user_id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            
                        </td>
                    </tr>
                `;
            });

            // Modular event binding (like rooms.js)
            tbody.querySelectorAll('.btn-edit-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    updateUserModal(btn.dataset.id, cachedRoles, loadUsersTable);
                });
            });
            tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteUserModal(btn.dataset.id, loadUsersTable);
                });
            });
            tbody.querySelectorAll('.btn-status-user').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    confirmStatusChange(btn.dataset.id);
                });
            });
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load users.</td></tr>`;
        }
    }

    // --- SweetAlert confirmation for status change ---
    async function confirmStatusChange(userId) {
        try {
            const res = await axios.get(`${BASE_URL}/admin/add-user/users.php?id=${userId}`);
            const user = res.data.user;
            if (!user) throw new Error('User not found');
            const willActivate = !!user.is_deleted;
            const actionText = willActivate ? 'activate' : 'deactivate';
            const result = await Swal.fire({
                title: `Are you sure?`,
                text: `Do you want to ${actionText} user "${user.username}"?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: willActivate ? 'Activate' : 'Deactivate',
                cancelButtonText: 'Cancel',
                reverseButtons: true
            });
            if (result.isConfirmed) {
                await saveStatus(user.user_id, willActivate ? 0 : 1);
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to load user details', 'error');
        }
    }

    // --- Save status change (activate/inactivate) ---
    async function saveStatus(userId, is_deleted) {
        try {
            await axios.put(`${BASE_URL}/admin/add-user/users.php`, {
                user_id: userId,
                is_deleted: is_deleted,
                update_type: 'status_only'
            });
            loadUsersTable();
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `User ${is_deleted ? 'deactivated' : 'activated'} successfully`,
                showConfirmButton: false,
                timer: 2000
            });
        } catch (err) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Failed to update user status',
                showConfirmButton: false,
                timer: 2000
            });
        }
    }

    // --- Add User Form Submit ---
    function handleAddUserFormSubmit(e) {
        e.preventDefault();
        const addUserForm = document.getElementById('add-user-form');
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const email = document.getElementById('email').value.trim();
        const userRole = document.getElementById('user-role').value;

        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        let isValid = true;
        if (username === '') {
            document.getElementById('username-error').textContent = 'Username is required';
            isValid = false;
        }
        if (password === '') {
            document.getElementById('password-error').textContent = 'Password is required';
            isValid = false;
        }
        if (password !== confirmPassword) {
            document.getElementById('confirm-password-error').textContent = 'Passwords do not match';
            isValid = false;
        }
        if (email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('email-error').textContent = 'Please enter a valid email address';
            isValid = false;
        }
        if (userRole === '') {
            document.getElementById('role-error').textContent = 'Please select a user role';
            isValid = false;
        }

        if (isValid) {
            const userData = {
                username: username,
                password: password,
                email: email,
                user_roles_id: userRole
            };
            axios.post(`${BASE_URL}/admin/add-user/add-user.php`, userData)
                .then(response => {
                    const data = response.data;
                    const alertBox = document.getElementById('alert-box');
                    if (data.status === 'success') {
                        alertBox.className = 'alert alert-success';
                        alertBox.textContent = data.message;
                        alertBox.style.display = 'block';
                        addUserForm.reset();
                        setTimeout(() => {
                            alertBox.style.display = 'none';
                        }, 3000);
                        loadUsersTable();
                    } else {
                        alertBox.className = 'alert alert-danger';
                        alertBox.textContent = data.message;
                        alertBox.style.display = 'block';
                    }
                }).catch(error => {
                    console.error('Error:', error);
                    const alertBox = document.getElementById('alert-box');
                    alertBox.className = 'alert alert-danger';
                    alertBox.textContent = 'An error occurred. Please try again later.';
                    alertBox.style.display = 'block';
                });
        }
    }

    function initAddUserModule() {
        loadUserRoles();
        const addUserForm = document.getElementById('add-user-form');
        if (addUserForm) {
            addUserForm.addEventListener('submit', handleAddUserFormSubmit);
            addUserForm.addEventListener('reset', () => {
                addUserForm.removeAttribute('data-editing-id');
            });
        }
        document.getElementById('refreshUsersBtn')?.addEventListener('click', loadUsersTable);
        loadUsersTable();
    }

    // Auto-initialize on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', initAddUserModule);
})();
