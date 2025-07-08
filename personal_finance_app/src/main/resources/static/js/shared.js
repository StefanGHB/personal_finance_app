/**
 * Enhanced Navigation Manager
 * Само responsive функционалност, запазва оригиналната логика
 */

class NavigationManager {
    constructor() {
        this.currentUser = null;
        this.API_BASE = '/api';

        // Responsive properties - САМО за responsive поведение
        this.isOpen = false;
        this.isMobile = false;
        this.isTablet = false;

        this.breakpoints = {
            tablet: 1024,
            mobile: 768
        };

        this.init();
    }

    /**
     * Initialize navigation - ЗАПАЗЕНА оригинална логика
     */
    async init() {
        try {
            // Load sidebar component
            await this.loadSidebar();

            // CREATE responsive elements - НОВО
            this.createResponsiveElements();

            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Setup navigation event listeners
            this.setupNavigation();

            // Setup responsive behavior - НОВО
            this.setupResponsiveBehavior();

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
     * НОВО: Създаване на responsive елементи
     */
    createResponsiveElements() {
        // Create mobile hamburger
        if (!document.getElementById('mobile-hamburger')) {
            const hamburger = document.createElement('button');
            hamburger.id = 'mobile-hamburger';
            hamburger.className = 'mobile-hamburger';
            hamburger.innerHTML = '<i data-lucide="menu"></i>';
            hamburger.setAttribute('aria-label', 'Toggle sidebar');

            // ДОБАВЯМЕ ДИРЕКТЕН onclick event
            hamburger.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🍔 Direct hamburger click!');
                this.toggleSidebar();
            };

            document.body.appendChild(hamburger);
            console.log('✅ Hamburger created with direct onclick');
        }

        // Create overlay
        if (!document.getElementById('sidebar-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'sidebar-overlay';
            overlay.className = 'sidebar-overlay';

            // ДОБАВЯМЕ ДИРЕКТЕН onclick event за overlay
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    console.log('🖱️ Direct overlay click!');
                    this.closeSidebar();
                }
            };

            document.body.appendChild(overlay);
            console.log('✅ Overlay created with direct onclick');
        }

        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * НОВО: Setup responsive behavior
     */
    setupResponsiveBehavior() {
        this.checkBreakpoint();

        // Resize handler
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.checkBreakpoint();
                if (this.isOpen && (!this.isMobile && !this.isTablet)) {
                    this.closeSidebar();
                }
            }, 100);
        });
    }

    /**
     * НОВО: Check breakpoint
     */
    checkBreakpoint() {
        const width = window.innerWidth;
        console.log(`📏 Window width: ${width}px`);

        if (width <= this.breakpoints.mobile) {
            this.isMobile = true;
            this.isTablet = false;
            console.log('📱 Mobile mode activated');
        } else if (width <= this.breakpoints.tablet) {
            this.isMobile = false;
            this.isTablet = true;
            console.log('📱 Tablet mode activated');
        } else {
            this.isMobile = false;
            this.isTablet = false;
            console.log('🖥️ Desktop mode activated');
        }

        this.updateSidebarBehavior();
    }

    /**
     * НОВО: Update sidebar behavior
     */
    updateSidebarBehavior() {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.getElementById('mobile-hamburger');
        const overlay = document.getElementById('sidebar-overlay');

        console.log('🔄 Updating sidebar behavior...');

        if (!sidebar) {
            console.error('❌ Sidebar not found during behavior update');
            return;
        }

        if (this.isMobile || this.isTablet) {
            // Mobile/Tablet - hide sidebar, show hamburger
            sidebar.classList.remove('active');
            this.isOpen = false;

            if (hamburger) {
                hamburger.style.display = 'flex';
                console.log('✅ Hamburger shown');
            } else {
                console.error('❌ Hamburger not found!');
            }

            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
            console.log('📱 Mobile/Tablet behavior applied');
        } else {
            // Desktop - normal behavior
            sidebar.classList.remove('active');
            this.isOpen = false;

            if (hamburger) {
                hamburger.style.display = 'none';
                console.log('✅ Hamburger hidden');
            }

            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
            console.log('🖥️ Desktop behavior applied');
        }
    }

    /**
     * Load sidebar component - НЕПРОМЕНЕНО
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
     * Setup navigation event listeners - ОПРОСТЕНА ЛОГИКА ЗА X БУТОНА
     */
    setupNavigation() {
        console.log('🔧 Setting up navigation...');

        // САМО ЕДИН event listener за X бутона - много опростено
        document.addEventListener('click', (e) => {
            // X button click - ДИРЕКТНА ПРОВЕРКА
            if (e.target.id === 'sidebar-toggle' || e.target.closest('#sidebar-toggle')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('❌ X button clicked - closing sidebar!');
                this.closeSidebar();
                return; // Спираме тук, не продължаваме
            }

            // Navigation links
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                console.log('🔗 Nav link clicked');
                this.handleNavigation(e);

                // Close sidebar on mobile after navigation
                if (this.isMobile || this.isTablet) {
                    setTimeout(() => this.closeSidebar(), 150);
                }
                return;
            }

            // Logout button
            const logoutBtn = e.target.closest('#logout-btn');
            if (logoutBtn) {
                console.log('🚪 Logout clicked');
                this.handleLogout();
                return;
            }

            // Outside click logic
            if (!this.isOpen || (!this.isMobile && !this.isTablet)) return;

            const sidebar = document.getElementById('sidebar');
            const hamburger = document.getElementById('mobile-hamburger');
            const overlay = document.getElementById('sidebar-overlay');

            if (sidebar && !sidebar.contains(e.target) &&
                !hamburger?.contains(e.target) &&
                !overlay?.contains(e.target)) {
                console.log('🖱️ Outside click - closing sidebar');
                this.closeSidebar();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen && (this.isMobile || this.isTablet)) {
                console.log('⌨️ Escape pressed - closing sidebar');
                this.closeSidebar();
            }
        });

        console.log('✅ Navigation event listeners setup complete');
    }

    /**
     * Load current user data - НЕПРОМЕНЕНО
     */
    async loadCurrentUser() {
        try {
            const response = await this.fetchAPI('/auth/current-user');

            if (response.authenticated) {
                this.currentUser = response;
                this.updateUserProfile(response);
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('❌ Failed to load current user:', error);
            window.location.href = '/';
        }
    }

    /**
     * Update user profile in sidebar - НЕПРОМЕНЕНО
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
     * Set active navigation based on current page - НЕПРОМЕНЕНО
     */
    setActiveNavigation() {
        const currentPath = window.location.pathname;
        let activePage = 'dashboard';

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

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            const link = item.querySelector('.nav-link');
            if (link && link.dataset.page === activePage) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Handle navigation - НЕПРОМЕНЕНО
     */
    handleNavigation(event) {
        const link = event.currentTarget;
        const page = link.dataset.page;
        console.log(`🔗 Navigating to: ${page}`);
    }

    /**
     * Toggle sidebar - ПОДОБРЕНО за моментална реакция
     */
    toggleSidebar() {
        console.log(`🔄 Toggle sidebar - Current state: ${this.isOpen}`);

        if (this.isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    /**
     * НОВО: Open sidebar - ОПРОСТЕНО БЕЗ СТРАННА ЛОГИКА
     */
    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const hamburger = document.getElementById('mobile-hamburger');

        console.log(`🔓 Opening sidebar...`);

        if (!sidebar) {
            console.error('❌ Sidebar element not found!');
            return;
        }

        sidebar.classList.add('active');
        this.isOpen = true;
        console.log('✅ Sidebar opened');

        if (overlay) {
            overlay.classList.add('active');
        }

        if (hamburger) {
            hamburger.classList.add('hidden');
        }

        // Lock body scroll на mobile
        if (this.isMobile) {
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * НОВО: Close sidebar - ОПРОСТЕНО БЕЗ СТРАННА ЛОГИКА
     */
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const hamburger = document.getElementById('mobile-hamburger');

        console.log('🔒 Closing sidebar...');

        if (!sidebar) {
            console.error('❌ Sidebar element not found!');
            return;
        }

        sidebar.classList.remove('active');
        this.isOpen = false;
        console.log('✅ Sidebar closed');

        if (overlay) {
            overlay.classList.remove('active');
        }

        if (hamburger) {
            hamburger.classList.remove('hidden');
        }

        document.body.style.overflow = '';
    }

    /**
     * Handle logout - НЕПРОМЕНЕНО
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
     * Generic API fetch function - НЕПРОМЕНЕНО
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

// Initialize navigation when DOM is loaded - НЕПРОМЕНЕНО
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});