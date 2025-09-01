if (typeof axios === "undefined") {
    // Try to get from window (CDN import)
    window.axios = window.axios || undefined;
}
if (typeof axios === "undefined") {
    alert("Axios is not loaded. Please check your script includes.");
    throw new Error("Axios is not loaded. Please include axios via CDN before this script.");
}

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('changePasswordForm');
    const alertBox = document.getElementById('changePassAlert');
    const userId = localStorage.getItem('pendingChangeUserId');

    if (!userId) {
        window.location.href = "admin-login.html";
        return;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        alertBox.classList.add('d-none');
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;
        if (newPass.length < 6) {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = 'Password must be at least 6 characters.';
            alertBox.classList.remove('d-none');
            return;
        }
        if (newPass !== confirmPass) {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = 'Passwords do not match.';
            alertBox.classList.remove('d-none');
            return;
        }
        try {
            // The API expects ALL required fields for updateUser: user_id, username, email, user_roles_id
            // So we need to fetch the current user data first
            const userRes = await axios.get(
                '/Hotel-Reservation-Billing-System/api/admin/add-user/users.php',
                { params: { id: userId } }
            );
            const user = userRes.data && userRes.data.user ? userRes.data.user : null;
            if (!user) {
                alertBox.className = 'alert alert-danger';
                alertBox.textContent = 'User not found. Please contact admin.';
                alertBox.classList.remove('d-none');
                return;
            }

            const formData = new FormData();
            formData.append("operation", "updateUser");
            formData.append("json", JSON.stringify({
                user_id: userId,
                username: user.username,
                email: user.email || "",
                user_roles_id: user.user_roles_id,
                password: newPass
            }));

            console.debug("Submitting password change for user_id:", userId);
            const res = await axios.post(
                '/Hotel-Reservation-Billing-System/api/admin/add-user/users.php',
                formData
            );
            console.debug("Password change API response:", res);

            if (res.data && (res.data.status === 'success' || res.data.message === 'User updated')) {
                alertBox.className = 'alert alert-success';
                alertBox.textContent = 'Password changed successfully. Please log in again.';
                alertBox.classList.remove('d-none');
                localStorage.removeItem('pendingChangeUserId');
                sessionStorage.clear();
                setTimeout(() => {
                    window.location.href = "admin-login.html";
                }, 1500);
            } else {
                alertBox.className = 'alert alert-danger';
                alertBox.textContent = (res.data && res.data.message ? res.data.message : 'Failed to change password. Please try again.')
                    + "\n[DEBUG] API raw response: " + JSON.stringify(res.data);
                alertBox.classList.remove('d-none');
                console.error("Password change failed:", res.data);
            }
        } catch (err) {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = 'Failed to change password. Please try again.\n[DEBUG] ' + (err && err.message ? err.message : '') +
                (err && err.response ? '\n[API Response]: ' + JSON.stringify(err.response.data) : '');
            alertBox.classList.remove('d-none');
            console.error("Password change exception:", err);
        }
    });
});
