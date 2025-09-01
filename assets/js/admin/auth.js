// To include this file in your HTML, use:
// <script src="assets/js/admin/auth.js"></script>

class AdminAuth {
    constructor() {
        // Make page initially invisible to prevent FOUC (Flash of Unstyled Content)
        document.body.style.display = 'none';
        this.init();
    }

    init() {
        // Check if already logged in and on login page
        if (this.isLoggedIn() && (window.location.pathname.includes('admin-login.html') || window.location.href.includes('admin-login.html'))) {
            window.location.href = 'dashboard.html';
            return;
        }

        // Enhanced security check - prevent directory traversal and unauthorized access
        const isLoginPage = window.location.pathname.includes('admin-login.html');
        const isAdminDirectory = window.location.pathname.includes('/admin/');

        // If user is in admin directory but not logged in and not on login page
        if (isAdminDirectory && !isLoginPage && !this.isLoggedIn()) {
            // Wait for SweetAlert to load before showing alert
            this.waitForSweetAlert().then(() => {
                this.showUnauthorizedAlert();
            });
            return;
        }

        // Additional check for direct file access attempts
        if (!isLoginPage && !this.isLoggedIn()) {
            // Wait for SweetAlert to load before showing alert
            this.waitForSweetAlert().then(() => {
                this.showUnauthorizedAlert();
            });
            return;
        }

        // Show page content only after auth check passes
        document.body.style.display = '';

        // Setup login form if on login page
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Setup logout functionality for authenticated users
        this.setupLogoutHandlers();

        // Setup session validation
        if (this.isLoggedIn()) {
            this.validateSession();
        }
    }

    // Wait for SweetAlert to be available
    waitForSweetAlert() {
        return new Promise((resolve) => {
            if (window.Swal) {
                resolve();
                return;
            }

            const checkSwal = setInterval(() => {
                if (window.Swal) {
                    clearInterval(checkSwal);
                    resolve();
                }
            }, 50);

            // Fallback timeout after 3 seconds
            setTimeout(() => {
                clearInterval(checkSwal);
                resolve();
            }, 3000);
        });
    }
    async validateSession() {
        try {
            const token = sessionStorage.getItem('admin_token');
            if (!token) {
                this.handleSessionExpiry();
                return;
            }

            const response = await fetch('../../api/auth/check-session.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!result.success) {
                this.handleSessionExpiry();
            }
        } catch (error) {
            console.error('Session validation error:', error);
            this.handleSessionExpiry();
        }
    }

    handleSessionExpiry() {
        this.clearSession();
        Swal.fire({
            title: '⏰ Session Expired',
            text: 'Your session has expired for security reasons. Please log in again.',
            icon: 'warning',
            confirmButtonText: 'Login Again',
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonColor: '#ffc107'
        }).then(() => {
            window.location.href = 'admin-login.html';
        });
    }

    async handleLogin(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        // Enhanced validation
        if (!credentials.username || !credentials.password) {
            Swal.fire({
                title: 'Validation Error',
                text: 'Please enter both username and password',
                icon: 'warning',
                confirmButtonColor: '#ffc107'
            });
            return;
        }

        // Show loading
        this.showLoading();

        try {
            const response = await fetch('../../api/auth/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (result.success) {
                // Check if password change is required
                if (result.user.new_password) {
                    // Do NOT set sessionStorage/session data!
                    localStorage.setItem('pendingChangeUserId', result.user.user_id);
                    window.location.href = "change-password.html";
                    return;
                }

                // Store session data securely
                sessionStorage.setItem('admin_token', result.token);
                sessionStorage.setItem('admin_user', JSON.stringify(result.user)); // <-- user_id should be present here
                sessionStorage.setItem('login_time', Date.now().toString());

                // Log user id to console
                if (result.user && result.user.user_id) {
                    console.log("[AUTH] Logged in user_id:", result.user.user_id);
                }

                // Show success and redirect AFTER SweetAlert timer
                Swal.fire({
                    title: 'Login Successful!',
                    text: `Welcome back, ${result.user.username}`,
                    icon: 'success',
                    timer: 1000,
                    showConfirmButton: false,
                    showClass: {
                        popup: 'animate__animated animate__fadeInDown'
                    },
                    willClose: () => {
                        window.location.href = 'dashboard.html';
                    }
                });

            } else {
                this.resetLoginButton();
                // Custom message for deactivated account
                if (
                    result.message &&
                    result.message.toLowerCase().includes('deactivated')
                ) {
                    Swal.fire({
                        title: 'Account Deactivated',
                        text: result.message,
                        imageUrl: '../../assets/images/hehe.jpeg', // local image
                        imageWidth: 120,
                        imageHeight: 120,

                        confirmButtonColor: '#dc3545',
                        showClass: {
                            popup: 'animate__animated animate__shakeX'
                        }
                    });
                } else {
                    throw new Error(result.message || 'Login failed');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            this.resetLoginButton();

            Swal.fire({
                title: 'Login Failed',
                text: error.message || 'Invalid credentials. Please check your username and password.',
                icon: 'error',
                confirmButtonColor: '#dc3545',
                showClass: {
                    popup: 'animate__animated animate__shakeX'
                }
            });
        }
    }

    setupLogoutHandlers() {
        // Setup logout button handlers
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
                e.preventDefault();
                this.confirmLogout();
            }
        });

        // Setup session timeout warning
        this.setupSessionTimeout();
    }

    setupSessionTimeout() {
        const sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const warningTime = 30 * 60 * 1000; // 30 minutes warning

        setInterval(() => {
            const loginTime = sessionStorage.getItem('login_time');
            if (loginTime) {
                const elapsed = Date.now() - parseInt(loginTime);
                const remaining = sessionTimeout - elapsed;

                if (remaining <= warningTime && remaining > 0) {
                    this.showSessionWarning(Math.floor(remaining / 60000));
                } else if (remaining <= 0) {
                    this.handleSessionExpiry();
                }
            }
        }, 60000); // Check every minute
    }

    showSessionWarning(minutesRemaining) {
        Swal.fire({
            title: '⚠️ Session Warning',
            text: `Your session will expire in ${minutesRemaining} minutes. Please save your work.`,
            icon: 'warning',
            confirmButtonText: 'Continue Working',
            confirmButtonColor: '#ffc107',
            timer: 10000
        });
    }

    confirmLogout() {
        Swal.fire({
            title: 'Confirm Logout',
            text: 'Are you sure you want to logout? Any unsaved changes will be lost.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, logout!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.performLogout();
            }
        });
    }

    async performLogout() {
        try {
            const token = sessionStorage.getItem('admin_token');

            // Call logout API
            await fetch('../../api/auth/logout.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Clear session
            this.clearSession();

            // Show logout success and animate before redirect
            await Swal.fire({
                title: 'Logged Out',
                text: 'You have been successfully logged out.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                showClass: {
                    popup: 'animate__animated animate__fadeOutUp'
                },
                willClose: () => {
                    window.location.href = 'admin-login.html';
                }
            });

        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API fails
            this.clearSession();
            window.location.href = 'admin-login.html';
        }
    }

    clearSession() {
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_user');
        sessionStorage.removeItem('login_time');
    }

    showLoading() {
        const button = document.querySelector('.btn-login');
        if (button) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            button.disabled = true;
        }
    }

    resetLoginButton() {
        const button = document.querySelector('.btn-login');
        if (button) {
            button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            button.disabled = false;
        }
    }

    isLoggedIn() {
        const token = sessionStorage.getItem('admin_token');
        const user = sessionStorage.getItem('admin_user');
        const loginTime = sessionStorage.getItem('login_time');

        if (!token || !user || !loginTime) {
            return false;
        }

        // Check if session is expired (8 hours)
        const sessionTimeout = 8 * 60 * 60 * 1000;
        const elapsed = Date.now() - parseInt(loginTime);

        if (elapsed > sessionTimeout) {
            this.clearSession();
            return false;
        }

        return true;
    }

    getUser() {
        const user = sessionStorage.getItem('admin_user');
        if (user) {
            try {
                const parsed = JSON.parse(user);
                if (parsed && parsed.user_id) {
                    console.log("[AUTH] Current session user_id:", parsed.user_id);
                }
                return parsed;
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    logout(silent = false) {
        if (silent) {
            this.clearSession();
            window.location.href = 'admin-login.html';
        } else {
            this.confirmLogout();
        }
    }

    requireAuth() {
        if (!this.isLoggedIn()) {
            this.showUnauthorizedAlert();
            return false;
        }
        return true;
    }

    // Method to get authorization header for API calls
    getAuthHeader() {
        const token = sessionStorage.getItem('admin_token');
        return token ? `Bearer ${token}` : null;
    }
}

// Password toggle function
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');
    const toggleIcon = toggleBtn ? toggleBtn.querySelector('i') : null;

    if (!passwordInput || !toggleIcon) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}

// Enhanced security: Prevent console access in production
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.log = console.warn = console.error = function () { };
}

// Initialize authentication
window.adminAuth = new AdminAuth();

// Log user id on page load if logged in
if (window.adminAuth.isLoggedIn()) {
    const user = window.adminAuth.getUser();
    if (user && user.user_id) {
        console.log("[AUTH] Page load user_id:", user.user_id);
    }
}

// Prevent back button after logout
window.addEventListener('pageshow', function (event) {
    if (event.persisted && !window.adminAuth.isLoggedIn()) {
        window.location.href = 'admin-login.html';
    }
});