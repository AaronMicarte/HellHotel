function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    fetch('sidebar.html')
        .then(res => res.text())
        .then(html => {
            container.innerHTML = html;
            filterSidebarByRole();
            highlightActiveSidebar();
            // Dropdown logic
            document.querySelectorAll('#sidebar-container .sidebar-dropdown > a').forEach(drop => {
                drop.addEventListener('click', function (e) {
                    e.preventDefault();
                    const parent = this.parentElement;
                    parent.classList.toggle('open');
                    const submenu = parent.querySelector('.sidebar-submenu');
                    if (submenu) {
                        submenu.style.display = parent.classList.contains('open') ? 'block' : 'none';
                    }
                });
            });
            // Auto-open if active link is inside submenu
            document.querySelectorAll('#sidebar-container .sidebar-submenu a').forEach(link => {
                if (link.href === window.location.href) {
                    const parent = link.closest('.sidebar-dropdown');
                    if (parent) {
                        parent.classList.add('open');
                        const submenu = parent.querySelector('.sidebar-submenu');
                        if (submenu) submenu.style.display = 'block';
                    }
                }
            });
        });
    // Hide sidebar items not allowed for front desk
    function filterSidebarByRole() {
        let user = null;
        try {
            user = JSON.parse(sessionStorage.getItem('admin_user'));
        } catch (e) { }
        if (!user || !user.role_type) return;
        if (user.role_type === 'front desk') {
            // List of selectors for items to hide for front desk
            const hideSelectors = [
                'a[href="add-users.html"]',
                'a[href="addon-order-history.html"]',
                'a[href="addons.html"]',
            ];
            hideSelectors.forEach(sel => {
                document.querySelectorAll('#sidebar-container ' + sel).forEach(a => {
                    const li = a.closest('li');
                    if (li) li.style.display = 'none';
                });
            });
        }
    }
}

// Highlight the active sidebar link
function highlightActiveSidebar() {
    const path = window.location.pathname.split('/').pop();
    document.querySelectorAll('#sidebar-container .sidebar-menu li').forEach(li => {
        const a = li.querySelector('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (href === path) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
}

window.addEventListener('popstate', highlightActiveSidebar);
document.addEventListener('DOMContentLoaded', loadSidebar);
