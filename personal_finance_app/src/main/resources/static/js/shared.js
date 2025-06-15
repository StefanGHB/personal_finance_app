/**
 * Shared Navigation JavaScript
 * Only Sidebar & Navigation Logic
 */

class NavigationManager {
    constructor() {
        this.currentUser = null;
        this.API_BASE = '/api';

        this.init();
    }

    /**
     * Initialize navigation
     */
    async init() {
        try {
            // Load sidebar component
            await this.loadSidebar();

            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Setup navigation event listeners
            this.setupNavigation();

            // Load current user
            await this.loadCurrentUser();

            // Set active navigation
            this.setActiveNavigation();

            console.log('✅ Navigation initialized');
        } catch (error) {
            console.error('❌ Navigation initialization failed:', error);
        }
    }

    /**
     * Load sidebar component
     */
    async loadSidebar() {
        const sidebarContainer = document.getElementById('sidebar-container');
        if (!sidebarContainer) return;

        try {
            const response = await fetch('/static/components/sidebar.html');
            const sidebarHTML = await response.text();
            sidebarContainer.innerHTML = sidebarHTML;
        } catch (error) {
            console.error('❌ Failed to load sidebar:', error);
        }
    }

    /**
     * Setup navigation event listeners
     */
    setupNavigation() {
        // Sidebar toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('#sidebar-toggle') || e.target.closest('#sidebar-toggle')) {
                this.toggleSidebar();
            }
        });

        // Navigation links
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link') || e.target.closest('.nav-link')) {
                this.handleNavigation(e);
            }
        });

        // Logout button
        document.addEventListener('click', (e) => {
            if (e.target.matches('#logout-btn') || e.target.closest('#logout-btn')) {
                this.handleLogout();
            }
        });

        // Close sidebar on outside click (mobile)
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebar-toggle');

            if (sidebar && !sidebar.contains(e.target) && !sidebarToggle?.contains(e.target)) {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    /**
     * Load current user data
     */
    async loadCurrentUser() {
        try {
            const response = await this.fetchAPI('/auth/current-user');

            if (response.authenticated) {
                this.currentUser = response;
                this.updateUserProfile(response);
            } else {
                // Redirect to login if not authenticated
                window.location.href = '/';
            }
        } catch (error) {
            console.error('❌ Failed to load current user:', error);
            window.location.href = '/';
        }
    }

    /**
     * Update user profile in sidebar
     */
    updateUserProfile(user) {
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');

        if (userName) {
            userName.textContent = user.fullName || `${user.firstName} ${user.lastName}`;
        }

        if (userEmail) {
            userEmail.textContent = user.email;
        }
    }

    /**
     * Set active navigation based on current page
     */
    setActiveNavigation() {
        const currentPath = window.location.pathname;
        let activePage = 'dashboard'; // default

        if (currentPath.includes('/transactions')) {
            activePage = 'transactions';
        } else if (currentPath.includes('/budgets')) {
            activePage = 'budgets';
        } else if (currentPath.includes('/categories')) {
            activePage = 'categories';
        } else if (currentPath.includes('/reports')) {
            activePage = 'reports';
        } else if (currentPath.includes('/settings')) {
            activePage = 'settings';
        }

        // Update active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            const link = item.querySelector('.nav-link');
            if (link && link.dataset.page === activePage) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Handle navigation
     */
    handleNavigation(event) {
        // Let browser handle navigation naturally
        const link = event.currentTarget;
        const page = link.dataset.page;

        console.log(`🔗 Navigating to: ${page}`);
    }

    /**
     * Toggle sidebar (mobile)
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await fetch('/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('❌ Logout failed:', error);
        }
    }

    /**
     * Generic API fetch function
     */
    async fetchAPI(endpoint, method = 'GET', data = null) {
        const url = `${this.API_BASE}${endpoint}`;

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API request failed: ${response.status}`);
        }

        return await response.json();
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});