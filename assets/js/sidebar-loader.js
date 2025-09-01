function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    fetch('sidebar.html')
        .then(res => res.text())
        .then(html => {
            container.innerHTML = html;
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
