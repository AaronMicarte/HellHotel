const API_BASE = "/Hotel-Reservation-Billing-System/api";
const TOKEN_KEY = "admin_token";
const USER_KEY = "admin_user";

export class Auth {
    // Login with username/password, returns user object or throws error
    static async login(username, password) {
        const res = await axios.post(`${API_BASE}/auth/login.php`, { username, password });
        if (res.data && res.data.success && res.data.token) {
            sessionStorage.setItem(TOKEN_KEY, res.data.token);
            sessionStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
            return res.data.user;
        }
        throw new Error(res.data?.message || "Login failed");
    }

    // Check session validity, returns user object or throws error
    static async checkSession() {
        const token = sessionStorage.getItem(TOKEN_KEY);
        if (!token) throw new Error("No token");
        const res = await axios.post(`${API_BASE}/auth/check-session.php`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success && res.data.user) {
            sessionStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
            return res.data.user;
        }
        Auth.logout();
        throw new Error(res.data?.message || "Session invalid");
    }

    // Logout and clear session
    static async logout() {
        const token = sessionStorage.getItem(TOKEN_KEY);
        try {
            await axios.post(`${API_BASE}/auth/logout.php`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch { /* ignore */ }
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
    }

    // Get current user object from sessionStorage
    static getUser() {
        const user = sessionStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null; // <-- user_id should be present
    }

    // Get user_id for audit/edit purposes
    static getUserId() {
        const user = Auth.getUser();
        return user && user.user_id ? user.user_id : null; // <-- this should return a valid user_id
    }

    // Check if logged in
    static isLoggedIn() {
        return !!sessionStorage.getItem(TOKEN_KEY) && !!Auth.getUserId();
    }

    // Get user role (admin/front desk)
    static getUserRole() {
        const user = Auth.getUser();
        return user && user.role_type ? user.role_type : null;
    }
}

// Make Auth globally available for all modules (audit, payment, etc.)
if (typeof window !== "undefined") {
    window.Auth = Auth;
}
window.Auth = Auth;
