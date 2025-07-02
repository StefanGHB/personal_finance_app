/**
 * Categories Page JavaScript - FIXED PAGINATION SYSTEM & BULGARIAN SEARCH
 * Fixed: Single pagination block that updates dynamically - NO DUPLICATION
 * Fixed: Bulgarian and Unicode search support
 * Fixed: Archive category error handling
 * Enhanced: Modern notifications scroller for 3+ notifications
 * NEW: Vertical scrollbar for notifications (right side)
 * NEW: Smart notifications time system with 15min/1hour updates
 */

class CategoriesManager {
    constructor() {
        this.API_BASE = '/api';
        this.categories = [];
        this.filteredCategories = [];
        this.transactions = [];
        this.notifications = [];
        this.currentCategory = null;
        this.isEditing = false;
        this.summaryData = {
            totalCategories: 0,
            incomeCategories: 0,
            expenseCategories: 0,
            mostUsedCategory: { name: 'None', count: 0 },
            categoryUsage: new Map()
        };
        this.currentFilter = {
            type: 'all',
            usage: 'all',
            origin: 'all',
            search: '',
            sort: 'newest',
            showArchived: false
        };
        this.currentPage = 1;
        this.pageSize = 10;  // 🔧 CHANGED: 10 categories per page instead of 20
        this.totalPages = 1;

        // Hybrid system configuration
        this.hybridConfig = {
            maxItemsForScroll: 30,
            autoFocusNewCategory: true,
            smoothScrolling: true,
            highlightDuration: 2000
        };

        this.lastCreatedCategoryId = null;
        this.isScrollMode = false;

        // 🕒 NEW: Smart notifications time system
        this.smartTime = new SmartNotificationTime();

        this.init();
    }

    /**
     * Initialize the categories page
     */
    async init() {
        try {
            console.log('🚀 Initializing Categories Manager...');
            this.showToast('Loading categories...', 'info');

            this.setupEventListeners();
            this.showLoadingState();

            await Promise.all([
                this.loadCategories(),
                this.loadTransactions(),
                this.initializeNotifications()
            ]);

            this.calculateSummaryData();
            this.applyFiltersAndRender();

            // 🕒 NEW: Start smart notifications time refresh
            this.smartTime.startSmartRefresh();

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            this.showToast('Categories loaded successfully!', 'success');
            console.log('✅ Categories Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Categories Manager:', error);
            this.hideLoadingState();
            this.showToast('Failed to load categories page. Please refresh and try again.', 'error');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Primary action buttons
        this.addEventListeners([
            ['add-category-btn', 'click', () => this.openCategoryModal()],
            ['add-category-action', 'click', () => this.openCategoryModal()],
            ['create-first-category', 'click', () => this.openCategoryModal()],
            ['quick-income-category', 'click', () => this.openQuickCategoryModal('INCOME')],
            ['quick-expense-category', 'click', () => this.openQuickCategoryModal('EXPENSE')]
        ]);

        // Modal controls
        this.addEventListeners([
            ['close-category-modal', 'click', () => this.closeCategoryModal()],
            ['cancel-category', 'click', () => this.closeCategoryModal()],
            ['close-delete-modal', 'click', () => this.closeDeleteModal()],
            ['cancel-delete', 'click', () => this.closeDeleteModal()],
            ['confirm-delete', 'click', () => this.confirmDeleteCategory()]
        ]);

        // Form handling
        const categoryForm = document.getElementById('category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => this.handleCategorySubmit(e));
        }

        // 🔧 REMOVED: Quick category form handler (now using unified modal)

        this.setupInternationalInputs();

        // Category type toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleCategoryTypeToggle(btn));
        });

        // Color presets
        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', () => this.selectColorPreset(btn));
        });

        // Color input change
        const colorInput = document.getElementById('category-color');
        if (colorInput) {
            colorInput.addEventListener('change', () => this.updateColorPresets());
        }

        // Navigation and filtering
        this.addEventListeners([
            ['category-filter', 'click', () => this.toggleFilterPanel()],
            ['notification-btn', 'click', () => this.toggleNotifications()],
            ['mark-all-read', 'click', () => this.markAllNotificationsAsRead()],
            ['clear-category-filters', 'click', () => this.clearFilters()],
            ['apply-category-filters', 'click', () => this.applyFilters()],
            ['close-category-filter', 'click', () => this.closeFilterPanel()],
            ['toggle-archived-categories', 'click', () => this.toggleArchivedCategories()],
            ['hide-archived-categories', 'click', () => this.hideArchivedCategories()]
        ]);

        // Global event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }

            // ✅ FIXED: More specific selector and prevent conflicts
            const notificationDropdown = e.target.closest('.notifications-dropdown');
            const notificationButton = e.target.closest('#notification-btn');

            // ✅ Don't close if clicking the notification button itself
            if (!notificationDropdown && !notificationButton) {
                this.closeNotificationsPanel();
            }

            // ✅ FIXED: More specific filter panel handling
            const filterPanel = e.target.closest('.filter-panel');
            const filterButton = e.target.closest('#category-filter');

            if (!filterPanel && !filterButton) {
                this.closeFilterPanel();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openCategoryModal();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFilterPanel();
                        break;
                }
            }
        });

        // 🕒 NEW: Handle page visibility for smart time refresh
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Pause smart refresh when page is hidden
                this.smartTime.stopSmartRefresh();
            } else {
                // Resume smart refresh when page becomes visible
                this.smartTime.startSmartRefresh();
                // Update times immediately when page becomes visible
                this.smartTime.updateAllNotificationTimes();
            }
        });

        // 🕒 NEW: Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.smartTime.stopSmartRefresh();
        });
    }

    /**
     * Setup international input handling
     */
    setupInternationalInputs() {
        const categoryNameInput = document.getElementById('category-name');
        if (categoryNameInput) {
            this.enhanceInputForInternational(categoryNameInput);
        }

        // 🔧 REMOVED: Quick category input (now using unified modal)
    }

    /**
     * Enhance input for international character support
     */
    enhanceInputForInternational(input) {
        if (!input) return;

        input.setAttribute('lang', 'auto');
        input.setAttribute('spellcheck', 'true');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('accept-charset', 'UTF-8');

        input.addEventListener('input', (e) => {
            const value = e.target.value;
            console.log(`✅ Input allowed: "${value}" (${value.length} characters)`);
        });

        input.addEventListener('input', (e) => {
            const value = e.target.value;
            if (this.isRTLText(value)) {
                input.setAttribute('dir', 'rtl');
                input.style.textAlign = 'right';
            } else {
                input.setAttribute('dir', 'ltr');
                input.style.textAlign = 'left';
            }
        });
    }

    /**
     * Check if text is Right-to-Left
     */
    isRTLText(text) {
        const rtlChars = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/;
        return rtlChars.test(text);
    }

    /**
     * Helper method to add multiple event listeners with enhanced error handling
     */
    addEventListeners(listeners) {
        listeners.forEach(([id, event, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                // ✅ Add error handling to event listeners
                element.addEventListener(event, (e) => {
                    try {
                        handler(e);
                    } catch (error) {
                        console.error(`❌ Error in ${id} ${event} handler:`, error);
                    }
                });
                console.log(`✅ Added ${event} listener to ${id}`);
            } else {
                console.warn(`⚠️ Element with id '${id}' not found for ${event} listener`);
            }
        });
    }

    /**
     * Load categories from API
     */
    async loadCategories() {
        try {
            console.log('📥 Loading categories from API...');

            const endpoint = this.currentFilter.showArchived ? '/categories/all' : '/categories';
            const categories = await this.fetchAPI(endpoint);
            this.categories = categories || [];

            console.log(`✅ Categories loaded: ${this.categories.length}`);
            return this.categories;
        } catch (error) {
            console.error('❌ Failed to load categories:', error);
            this.categories = [];
            this.showToast('Failed to load categories. Please check your connection and try again.', 'error');
            return [];
        }
    }

    /**
     * Load transactions for usage statistics
     */
    async loadTransactions() {
        try {
            console.log('💳 Loading transactions for usage statistics...');
            const transactions = await this.fetchAPI('/transactions');
            this.transactions = transactions || [];

            console.log('✅ Transactions loaded:', this.transactions.length);
            return this.transactions;
        } catch (error) {
            console.error('❌ Failed to load transactions:', error);
            this.transactions = [];
            this.showToast('Failed to load transaction data for statistics', 'warning');
            return [];
        }
    }

    /**
     * Toggle archived categories view
     */
    async toggleArchivedCategories() {
        try {
            console.log('🔄 Toggling archived categories view...');

            this.currentFilter.showArchived = !this.currentFilter.showArchived;

            // ✅ FIXED: Reset pagination to page 1 when toggling view mode
            this.currentPage = 1;
            console.log('📄 Reset pagination to page 1 when toggling archived view');

            this.updateArchivedToggleButton();
            this.showLoadingState();

            await this.loadCategories();
            this.calculateSummaryData();
            this.applyFiltersAndRender();
            this.updateViewModeIndicator();

            const message = this.currentFilter.showArchived
                ? 'Showing archived categories only'
                : 'Showing active categories only';
            this.showToast(message, 'info');

            console.log(`✅ Toggled to ${this.currentFilter.showArchived ? 'archived' : 'active'} categories view (pagination reset to 1)`);
        } catch (error) {
            console.error('❌ Error toggling archived view:', error);
            this.showToast('Failed to toggle archived view', 'error');
        }
    }

    /**
     * Hide archived categories
     */
    async hideArchivedCategories() {
        try {
            console.log('👁️ Hiding archived categories...');

            this.currentFilter.showArchived = false;

            // ✅ FIXED: Reset pagination to page 1 when hiding archived
            this.currentPage = 1;
            console.log('📄 Reset pagination to page 1 when hiding archived');

            this.updateArchivedToggleButton();
            this.showLoadingState();

            await this.loadCategories();
            this.calculateSummaryData();
            this.applyFiltersAndRender();
            this.updateViewModeIndicator();

            this.showToast('Showing active categories only', 'info');
        } catch (error) {
            console.error('❌ Error hiding archived categories:', error);
            this.showToast('Failed to hide archived categories', 'error');
        }
    }

    /**
     * Update archived toggle button state
     */
    updateArchivedToggleButton() {
        const toggleBtn = document.getElementById('toggle-archived-categories');
        if (toggleBtn) {
            if (this.currentFilter.showArchived) {
                toggleBtn.classList.add('active');
                toggleBtn.innerHTML = `
                    <i data-lucide="eye"></i>
                    <span>Hide Archived</span>
                `;
            } else {
                toggleBtn.classList.remove('active');
                toggleBtn.innerHTML = `
                    <i data-lucide="archive"></i>
                    <span>Show Archived</span>
                `;
            }

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Update view mode indicator
     */
    updateViewModeIndicator() {
        const indicator = document.getElementById('view-mode-indicator');
        if (indicator) {
            if (this.currentFilter.showArchived) {
                const archivedCount = this.categories.filter(cat => cat.isDeleted).length;

                indicator.innerHTML = `
                    <div class="mode-info">
                        <i data-lucide="archive"></i>
                        <span>Viewing ${archivedCount} archived categories</span>
                    </div>
                    <button class="hide-archived-btn" id="hide-archived-categories">
                        <i data-lucide="x"></i>
                        <span>Show Active</span>
                    </button>
                `;
                indicator.style.display = 'flex';

                const hideBtn = document.getElementById('hide-archived-categories');
                if (hideBtn) {
                    hideBtn.addEventListener('click', () => this.hideArchivedCategories());
                }
            } else {
                indicator.style.display = 'none';
            }

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Restore archived category
     */
    async restoreCategory(categoryId) {
        try {
            console.log(`🔄 Restoring category ${categoryId}...`);

            const result = await this.fetchAPI(`/categories/${categoryId}/restore`, 'POST');

            console.log('✅ Restore API result:', result);

            this.showToast('Category restored successfully!', 'success');

            this.addNotification({
                title: 'Category Restored',
                message: `Category has been restored and is now active`,
                type: 'success'
            });

            await this.refreshAllData();

            console.log(`✅ Category ${categoryId} restored successfully`);
        } catch (error) {
            console.error('❌ Failed to restore category:', error);
            this.showToast('Failed to restore category. Please try again.', 'error');
        }
    }

    /**
     * Calculate summary data for cards
     */
    calculateSummaryData() {
        try {
            console.log('📊 Calculating summary data...');

            const activeCategoriesForSummary = this.currentFilter.showArchived
                ? this.categories.filter(cat => !cat.isDeleted)
                : this.categories;

            this.summaryData.totalCategories = activeCategoriesForSummary.length;
            this.summaryData.incomeCategories = activeCategoriesForSummary.filter(cat => cat.type === 'INCOME').length;
            this.summaryData.expenseCategories = activeCategoriesForSummary.filter(cat => cat.type === 'EXPENSE').length;

            this.summaryData.categoryUsage.clear();

            this.transactions.forEach((transaction) => {
                let categoryId = transaction.categoryId || transaction.category_id || transaction.category?.id;

                if (categoryId) {
                    if (typeof categoryId === 'string') {
                        categoryId = parseInt(categoryId, 10);
                    }

                    const currentCount = this.summaryData.categoryUsage.get(categoryId) || 0;
                    this.summaryData.categoryUsage.set(categoryId, currentCount + 1);
                }
            });

            let maxUsage = 0;
            let mostUsedCategoryInfo = null;

            activeCategoriesForSummary.forEach(category => {
                const categoryId = category.id;
                const usageCount = this.summaryData.categoryUsage.get(categoryId) || 0;

                if (usageCount > maxUsage) {
                    maxUsage = usageCount;
                    mostUsedCategoryInfo = category;
                }
            });

            if (mostUsedCategoryInfo && maxUsage > 0) {
                this.summaryData.mostUsedCategory = {
                    name: mostUsedCategoryInfo.name,
                    count: maxUsage,
                    categoryId: mostUsedCategoryInfo.id
                };
            } else {
                this.summaryData.mostUsedCategory = { name: 'None', count: 0 };
            }

            this.updateSummaryCards();

            console.log('✅ Summary data calculated:', this.summaryData);
        } catch (error) {
            console.error('❌ Error calculating summary data:', error);
            this.summaryData = {
                totalCategories: 0,
                incomeCategories: 0,
                expenseCategories: 0,
                mostUsedCategory: { name: 'None', count: 0 },
                categoryUsage: new Map()
            };
            this.updateSummaryCards();
        }
    }

    /**
     * Update summary cards with calculated data
     */
    updateSummaryCards() {
        try {
            this.updateElement('total-categories', this.summaryData.totalCategories);
            this.updateElement('income-categories', this.summaryData.incomeCategories);
            this.updateElement('expense-categories', this.summaryData.expenseCategories);

            // ✅ ULTRA SHORT: Max 6 characters + ".." for perfect layout
            const mostUsedName = this.summaryData.mostUsedCategory.name;
            const truncatedName = this.truncateCategoryName(mostUsedName, 6);
            this.updateElement('most-used-category', truncatedName);

            this.updateElement('most-used-count', `${this.summaryData.mostUsedCategory.count} uses`);

            this.updateElement('categories-trend', `${this.summaryData.totalCategories} total categories`);
            this.updateElement('income-usage', `${this.getTransactionCountForType('INCOME')} transactions`);
            this.updateElement('expense-usage', `${this.getTransactionCountForType('EXPENSE')} transactions`);

            this.updateElement('income-quick-count', `${this.summaryData.incomeCategories} categories`);
            this.updateElement('expense-quick-count', `${this.summaryData.expenseCategories} categories`);

            console.log('✅ Summary cards updated');
        } catch (error) {
            console.error('❌ Error updating summary cards:', error);
        }
    }

    /**
     * ✅ ULTRA SHORT: Truncation to 6 chars + ".." for perfect layout
     */
    truncateCategoryName(name, maxLength = 6) {
        if (!name || name === 'None') {
            return name;
        }

        // If name is within limit, return as is
        if (name.length <= maxLength) {
            return name;
        }

        // ✅ ULTRA SHORT: 6 characters + ".." (total = 8 chars max)
        return name.substring(0, maxLength) + '..';
    }

    /**
     * Get transaction count for specific type
     */
    getTransactionCountForType(type) {
        const categoriesOfType = this.categories.filter(cat => cat.type === type && !cat.isDeleted);
        let count = 0;
        categoriesOfType.forEach(category => {
            count += this.summaryData.categoryUsage.get(category.id) || 0;
        });
        return count;
    }

    /**
     * 🔧 FIXED: Update pagination with ALWAYS pagination mode (like show archived)
     */
    updatePagination() {
        const totalItems = this.filteredCategories.length;

        // ✅ CHANGED: Always use pagination mode (like in show archived)
        this.pageSize = 10;  // 10 categories per page
        this.totalPages = Math.ceil(totalItems / this.pageSize);
        this.isScrollMode = false; // Always use pagination

        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = 1;
        }

        console.log(`📋 PAGINATION MODE activated: ${totalItems} categories, ${this.totalPages} pages (like show archived)`);
    }

    /**
     * 🔧 FIXED: Normalize search terms with PROPER Bulgarian support
     */
    normalizeSearchTerm(text) {
        if (!text) return '';

        // Запазваме оригиналните букви, само премахваме излишни интервали
        let normalized = text.toLowerCase().trim();

        // Премахване на множествени интервали
        normalized = normalized.replace(/\s+/g, ' ');

        console.log(`🔤 Search normalization: "${text}" → "${normalized}" (Bulgarian preserved)`);
        return normalized;
    }

    /**
     * 🔧 НОВА: Подобрена функция за проверка дали текст съдържа търсен термин
     */
    textContainsSearchTerm(text, searchTerm) {
        if (!text || !searchTerm) return false;

        // Нормализиране на двата текста за сравнение
        const normalizedText = text.toLowerCase().trim();
        const normalizedSearch = searchTerm.toLowerCase().trim();

        // Директно търсене за точно съвпадение
        const exactMatch = normalizedText.includes(normalizedSearch);

        if (exactMatch) {
            console.log(`✅ Search match: "${text}" contains "${searchTerm}"`);
            return true;
        }

        // Допълнително търсене по думи за по-гъвкаво намиране
        const searchWords = normalizedSearch.split(' ').filter(word => word.length > 0);
        const textWords = normalizedText.split(' ').filter(word => word.length > 0);

        const allWordsMatch = searchWords.every(searchWord => {
            return textWords.some(textWord => textWord.includes(searchWord));
        });

        if (allWordsMatch) {
            console.log(`✅ Word-based match: "${text}" matches "${searchTerm}"`);
            return true;
        }

        return false;
    }

    /**
     * 🔧 FIXED: Apply filters with archived logic - show ONLY archived when in archived mode
     */
    applyFiltersAndRender() {
        console.log('🔍 Applying filters:', this.currentFilter);

        let filtered = [...this.categories];

        // ✅ CHANGED: Apply archived filter based on current mode
        if (!this.currentFilter.showArchived) {
            // Normal mode: show only non-archived categories
            filtered = filtered.filter(cat => !cat.isDeleted);
        } else {
            // ✅ NEW: Archived mode: show ONLY archived categories
            filtered = filtered.filter(cat => cat.isDeleted);
        }

        // ✅ Apply type filter
        if (this.currentFilter.type !== 'all') {
            filtered = filtered.filter(cat => cat.type === this.currentFilter.type);
        }

        // ✅ Apply usage filter
        if (this.currentFilter.usage !== 'all') {
            filtered = this.applyUsageFilter(filtered);
        }

        // ✅ Apply origin filter
        if (this.currentFilter.origin !== 'all') {
            filtered = filtered.filter(cat => {
                if (this.currentFilter.origin === 'default') {
                    return cat.isDefault === true;
                } else if (this.currentFilter.origin === 'custom') {
                    return cat.isDefault !== true;
                }
                return true;
            });
        }

        // ✅ Bulgarian-aware search
        if (this.currentFilter.search) {
            const searchTerm = this.normalizeSearchTerm(this.currentFilter.search);

            filtered = filtered.filter(cat => {
                const categoryName = cat.name || '';
                const matches = this.textContainsSearchTerm(categoryName, searchTerm);
                return matches;
            });
        }

        // ✅ Apply sorting
        if (this.currentFilter.showArchived) {
            // In archived mode, all categories are archived, so use normal sorting
            filtered = this.applyCleanSorting(filtered);
        } else {
            filtered = this.applyCleanSorting(filtered);
        }

        this.filteredCategories = filtered;
        this.updatePagination();
        this.renderCategories();

        console.log(`✅ Filters applied. Final count: ${filtered.length}`);
    }

    /**
     * 🔧 NEW: Apply archived-first sorting
     */
    applyArchivedFirstSorting(categories) {
        // First sort by archived status (archived first), then by normal sorting
        return categories.sort((a, b) => {
            // Primary sort: archived first
            const aArchived = Boolean(a.isDeleted);
            const bArchived = Boolean(b.isDeleted);

            if (aArchived && !bArchived) return -1;  // a is archived, b is not -> a comes first
            if (!aArchived && bArchived) return 1;   // b is archived, a is not -> b comes first

            // Secondary sort: within same archive status, apply normal sorting
            if (aArchived === bArchived) {
                switch (this.currentFilter.sort) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'name_desc':
                        return b.name.localeCompare(a.name);
                    case 'usage':
                        const usageA = this.summaryData.categoryUsage.get(a.id) || 0;
                        const usageB = this.summaryData.categoryUsage.get(b.id) || 0;
                        return usageB - usageA;
                    case 'oldest':
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    case 'type':
                        if (a.type === b.type) return a.name.localeCompare(b.name);
                        return a.type === 'INCOME' ? -1 : 1;
                    case 'newest':
                    case 'created':
                    default:
                        const dateA = new Date(a.createdAt);
                        const dateB = new Date(b.createdAt);
                        return dateB - dateA;
                }
            }

            return 0;
        });
    }

    /**
     * Apply usage filter
     */
    applyUsageFilter(categories) {
        switch (this.currentFilter.usage) {
            case 'active':
                return categories.filter(cat => (this.summaryData.categoryUsage.get(cat.id) || 0) > 0);
            case 'unused':
                return categories.filter(cat => (this.summaryData.categoryUsage.get(cat.id) || 0) === 0);
            case 'frequent':
                return categories.filter(cat => (this.summaryData.categoryUsage.get(cat.id) || 0) >= 10);
            default:
                return categories;
        }
    }

    /**
     * Apply clean sorting
     */
    applyCleanSorting(categories) {
        switch (this.currentFilter.sort) {
            case 'name':
                return categories.sort((a, b) => a.name.localeCompare(b.name));
            case 'name_desc':
                return categories.sort((a, b) => b.name.localeCompare(a.name));
            case 'usage':
                return categories.sort((a, b) => {
                    const usageA = this.summaryData.categoryUsage.get(a.id) || 0;
                    const usageB = this.summaryData.categoryUsage.get(b.id) || 0;
                    return usageB - usageA;
                });
            case 'oldest':
                return categories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'type':
                return categories.sort((a, b) => {
                    if (a.type === b.type) return a.name.localeCompare(b.name);
                    return a.type === 'INCOME' ? -1 : 1;
                });
            case 'newest':
            case 'created':
            default:
                return categories.sort((a, b) => {
                    const dateA = new Date(a.createdAt);
                    const dateB = new Date(b.createdAt);
                    return dateB - dateA;
                });
        }
    }

    /**
     * Get current page categories
     */
    getCurrentPageCategories() {
        if (this.isScrollMode) {
            return this.filteredCategories;
        } else {
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            return this.filteredCategories.slice(startIndex, endIndex);
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const categoriesList = document.getElementById('categories-list');

        if (loadingState) {
            loadingState.style.display = 'flex';
        }
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        if (categoriesList) {
            categoriesList.innerHTML = '';
        }

        // 🔧 FIXED: Remove any pagination during loading
        this.removePaginationControls();
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    /**
     * 🔧 FIXED: Remove any existing pagination controls completely
     */
    removePaginationControls() {
        // Remove all existing pagination controls to prevent duplication
        const existingControls = document.querySelectorAll('.single-pagination-info, .pagination-controls');
        existingControls.forEach(control => {
            if (control.parentNode) {
                control.parentNode.removeChild(control);
            }
        });
        console.log('🧹 Removed existing pagination controls');
    }

    /**
     * 🎨 FIXED: Render categories with ALWAYS pagination (like show archived)
     */
    renderCategories() {
        const container = document.getElementById('categories-list');
        const emptyState = document.getElementById('empty-state');

        if (!container) {
            console.error('❌ Categories container not found!');
            return;
        }

        this.hideLoadingState();

        // 🔧 CRITICAL: Remove ALL existing pagination controls FIRST
        this.removePaginationControls();

        const currentCategories = this.getCurrentPageCategories();
        const totalCategories = this.filteredCategories.length;

        console.log('🎨 Rendering categories:');
        console.log(`  Total filtered: ${totalCategories}`);
        console.log(`  Current display: ${currentCategories.length}`);
        console.log(`  Mode: PAGINATION (like show archived)`);

        if (currentCategories.length === 0) {
            // ✅ REVERTED: Back to normal empty state (no compact)
            container.className = 'categories-list';
            container.style.maxHeight = 'none';
            container.style.overflowY = 'visible';

            container.innerHTML = this.getEmptyStateHTML();
            if (emptyState) emptyState.style.display = 'none';
            console.log('📭 Showing empty state (normal size)');
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // ✅ CHANGED: Always use pagination mode (no scroll mode)
        container.className = 'categories-list pagination-mode';
        container.style.maxHeight = 'none';
        container.style.overflowY = 'visible';

        // Render categories
        const categoryHTML = currentCategories.map((category, index) => {
            return this.createCleanCategoryHTML(category);
        }).join('');

        container.innerHTML = categoryHTML;

        // Add click handlers
        const categoryItems = container.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            const categoryId = item.dataset.categoryId;

            item.addEventListener('click', (e) => {
                if (!e.target.closest('.category-actions') && !item.classList.contains('archived')) {
                    this.editCategory(categoryId);
                }
            });
        });

        // Auto-focus on newly created category
        if (this.lastCreatedCategoryId && this.hybridConfig.autoFocusNewCategory) {
            setTimeout(() => this.focusOnNewCategory(this.lastCreatedCategoryId), 300);
            this.lastCreatedCategoryId = null;
        }

        // ✅ CHANGED: Always show pagination when we have categories (like show archived)
        if (this.totalPages > 1) {
            this.renderSinglePaginationControl();
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        console.log(`✅ Successfully rendered ${currentCategories.length} categories with PAGINATION (like show archived)`);
    }

    /**
     * Create clean category HTML
     */
    createCleanCategoryHTML(category) {
        try {
            const isIncome = category.type === 'INCOME';
            const typeClass = isIncome ? 'income' : 'expense';
            const usageCount = this.summaryData.categoryUsage.get(category.id) || 0;
            const formattedDate = this.formatDate(category.createdAt);

            const displayName = category.name;

            const isArchived = Boolean(category.isDeleted);
            const archivedClass = isArchived ? 'archived' : '';
            const isDefault = Boolean(category.isDefault);

            const html = `
                <div class="category-item ${isDefault ? 'default' : ''} ${archivedClass}"
                     data-category-id="${category.id}">
                    <div class="category-color-indicator" style="background-color: ${category.color || '#6366f1'}"></div>
                    <div class="category-icon ${typeClass}">
                        <i data-lucide="${isIncome ? 'trending-up' : 'trending-down'}"></i>
                    </div>
                    <div class="category-details">
                        <div class="category-name">
                            ${this.escapeHtml(displayName)}
                            ${isArchived ? '<span class="archived-indicator">(archived)</span>' : ''}
                            ${isDefault ? '<span class="default-indicator">(default)</span>' : ''}
                        </div>
                        <div class="category-type">${category.type.toLowerCase()}</div>
                    </div>
                    <div class="category-meta">
                        <div class="category-usage">${usageCount} uses</div>
                        <div class="category-date">${formattedDate}</div>
                    </div>
                    <div class="category-actions">
                        ${!isArchived ? `
                            <button class="category-action edit" onclick="categoriesManager.editCategory(${category.id})" title="Edit Category">
                                <i data-lucide="edit-2"></i>
                            </button>
                            ${!isDefault ? `
                                <button class="category-action delete" onclick="categoriesManager.deleteCategory(${category.id})" title="Archive Category">
                                    <i data-lucide="archive"></i>
                                </button>
                            ` : `
                                <button class="category-action disabled" title="Default categories cannot be archived" disabled>
                                    <i data-lucide="shield"></i>
                                </button>
                            `}
                        ` : `
                            <button class="category-action restore" onclick="categoriesManager.restoreCategory(${category.id})" title="Restore Category">
                                <i data-lucide="rotate-ccw"></i>
                            </button>
                        `}
                    </div>
                </div>
            `;

            return html;

        } catch (error) {
            console.error('❌ Error creating category HTML for:', category, error);
            return `<div class="category-item error">Error rendering category: ${category?.name || 'Unknown'}</div>`;
        }
    }

    /**
     * Focus on newly created category
     */
    focusOnNewCategory(categoryId) {
        try {
            const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`);
            if (categoryElement) {
                if (this.hybridConfig.smoothScrolling) {
                    categoryElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }

                categoryElement.classList.add('focused-highlight');

                setTimeout(() => {
                    categoryElement.classList.remove('focused-highlight');
                }, this.hybridConfig.highlightDuration);

                console.log(`✨ Focused on new category ${categoryId}`);
            }
        } catch (error) {
            console.error('❌ Error focusing on category:', error);
        }
    }

    /**
     * 🔧 FIXED: Render single pagination control with proper arrow positioning and colors
     */
    renderSinglePaginationControl() {
        console.log('📄 Rendering single pagination control...');

        // Double-check: Remove any existing pagination
        this.removePaginationControls();

        // Create the pagination container with proper arrow positioning
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'single-pagination-info';
        paginationContainer.innerHTML = `
            <div class="pagination-nav-left">
                <button class="nav-btn prev" ${this.currentPage <= 1 ? 'disabled' : ''}>
                    <i data-lucide="chevron-left"></i>
                </button>
            </div>
            <div class="pagination-display">
                <span class="page-info">Page <strong>${this.currentPage}</strong> of <strong>${this.totalPages}</strong></span>
                <span class="items-info">Showing ${this.getCurrentPageCategories().length} of ${this.filteredCategories.length} categories</span>
            </div>
            <div class="pagination-nav-right">
                <button class="nav-btn next" ${this.currentPage >= this.totalPages ? 'disabled' : ''}>
                    <i data-lucide="chevron-right"></i>
                </button>
            </div>
        `;

        // Add event listeners to navigation buttons
        const prevBtn = paginationContainer.querySelector('.nav-btn.prev');
        const nextBtn = paginationContainer.querySelector('.nav-btn.next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.goToPage(this.currentPage - 1);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.goToPage(this.currentPage + 1);
                }
            });
        }

        // Insert the pagination control after the categories list
        const container = document.getElementById('categories-list');
        if (container && container.parentNode) {
            container.parentNode.insertBefore(paginationContainer, container.nextSibling);
        }

        // Refresh lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        console.log(`✅ Single pagination control rendered: Page ${this.currentPage}/${this.totalPages}`);
    }

    /**
     * 🔧 FIXED: Go to specific page with proper updates
     */
    goToPage(page) {
        if (page < 1 || page > this.totalPages) {
            console.log(`❌ Invalid page: ${page} (valid range: 1-${this.totalPages})`);
            return;
        }

        console.log(`📄 Going to page ${page} of ${this.totalPages}`);

        this.currentPage = page;

        // Re-render categories which will automatically update pagination
        this.renderCategories();

        // Smooth scroll to top of categories list
        const container = document.getElementById('categories-list');
        if (container && this.hybridConfig.smoothScrolling) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        console.log(`✅ Successfully navigated to page ${page}`);
    }

    /**
     * Get appropriate empty state HTML
     */
    getEmptyStateHTML() {
        const hasFilters = this.getActiveFiltersCount() > 0;

        if (hasFilters) {
            // ✅ FIXED: Calculate correct total based on current mode
            let totalCategories;
            let modeText;

            if (this.currentFilter.showArchived) {
                // Archived mode: count only archived categories
                totalCategories = this.categories.filter(cat => cat.isDeleted).length;
                modeText = 'archived categories';
            } else {
                // Normal mode: count only active categories
                totalCategories = this.categories.filter(cat => !cat.isDeleted).length;
                modeText = 'categories';
            }

            return `
                <div class="categories-empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No categories match your filters</h3>
                    <p>Found 0 of ${totalCategories} ${modeText}. Try adjusting your search criteria or clear filters to see all ${modeText}.</p>
                    <div class="empty-filter-info">
                        <div class="active-filters">
                            ${this.getActiveFiltersText()}
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="categoriesManager.clearFilters()">
                        <i data-lucide="x"></i>
                        <span>Clear All Filters</span>
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="categories-empty-state">
                    <div class="empty-icon">🏷️</div>
                    <h3>No categories yet</h3>
                    <p>Create your first category to start organizing your transactions.</p>
                    <button class="btn btn-primary" onclick="categoriesManager.openCategoryModal()">
                        <i data-lucide="plus"></i>
                        <span>Add First Category</span>
                    </button>
                </div>
            `;
        }
    }

    /**
     * Get active filters text for display
     */
    getActiveFiltersText() {
        const filters = [];

        if (this.currentFilter.type !== 'all') {
            filters.push(`Type: ${this.currentFilter.type}`);
        }
        if (this.currentFilter.usage !== 'all') {
            filters.push(`Usage: ${this.currentFilter.usage}`);
        }
        if (this.currentFilter.origin !== 'all') {
            filters.push(`Origin: ${this.currentFilter.origin}`);
        }
        if (this.currentFilter.search) {
            filters.push(`Search: "${this.currentFilter.search}"`);
        }
        if (this.currentFilter.sort !== 'newest') {
            filters.push(`Sort: ${this.currentFilter.sort}`);
        }

        return filters.length > 0 ? `Active filters: ${filters.join(', ')}` : '';
    }

    /**
     * Get count of active filters
     */
    getActiveFiltersCount() {
        let count = 0;
        if (this.currentFilter.type !== 'all') count++;
        if (this.currentFilter.usage !== 'all') count++;
        if (this.currentFilter.origin !== 'all') count++;
        if (this.currentFilter.search) count++;
        return count;
    }

    /**
     * Open category modal
     */
    openCategoryModal(type = null, category = null) {
        const modal = document.getElementById('category-modal');
        const form = document.getElementById('category-form');
        const title = document.getElementById('modal-title');

        if (!modal || !form) return;

        form.reset();
        this.clearFormErrors();

        this.isEditing = !!category;
        this.currentCategory = category;

        if (title) {
            if (this.isEditing) {
                title.textContent = 'Edit Category';
            } else if (type === 'INCOME') {
                title.textContent = 'Add Income Category';
            } else if (type === 'EXPENSE') {
                title.textContent = 'Add Expense Category';
            } else {
                title.textContent = 'Create Category';
            }
        }

        if (type || (category && category.type)) {
            this.setCategoryType(type || category.type);
        }

        if (this.isEditing && category) {
            this.populateCategoryForm(category);
        }

        if (!this.isEditing) {
            const colorInput = document.getElementById('category-color');
            if (colorInput) {
                colorInput.value = '#3b82f6';
                this.updateColorPresets();
            }
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            const nameInput = document.getElementById('category-name');
            if (nameInput) nameInput.focus();
        }, 100);

        console.log(`📝 Opened category modal: ${this.isEditing ? 'Edit' : 'Create'} mode${type ? ` (${type})` : ''}`);
    }

    /**
     * Populate form with category data for editing
     */
    populateCategoryForm(category) {
        const elements = {
            'category-id': category.id,
            'category-name': category.name,
            'category-color': category.color || '#3b82f6'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });

        this.updateColorPresets();
    }

    /**
     * Close category modal
     */
    closeCategoryModal() {
        const modal = document.getElementById('category-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';

            this.isEditing = false;
            this.currentCategory = null;
        }
    }

    /**
     * 🔧 FIXED: Open quick category modal - NOW OPENS SAME FULL MODAL
     */
    openQuickCategoryModal(type) {
        console.log(`⚡ Opening unified category modal for ${type}`);

        // 🔧 FIXED: Use the same full modal instead of quick modal
        this.openCategoryModal(type, null);
    }

    /**
     * 🔧 DEPRECATED: Quick category modal methods (now using unified modal)
     */
    closeQuickCategoryModal() {
        // This method is kept for compatibility but quick modal is no longer used
        this.closeCategoryModal();
    }

    /**
     * Handle category type toggle
     */
    handleCategoryTypeToggle(clickedBtn) {
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        clickedBtn.classList.add('active');

        console.log(`🔄 Switched to ${clickedBtn.dataset.type} type`);
    }

    /**
     * Set category type programmatically
     */
    setCategoryType(type) {
        const buttons = document.querySelectorAll('.toggle-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
    }

    /**
     * Select color preset
     */
    selectColorPreset(button) {
        const color = button.dataset.color;
        const colorInput = document.getElementById('category-color');

        if (colorInput && color) {
            colorInput.value = color;
            this.updateColorPresets();
        }
    }

    /**
     * Update color presets to show active state
     */
    updateColorPresets() {
        const colorInput = document.getElementById('category-color');
        const presets = document.querySelectorAll('.color-preset');

        if (!colorInput) return;

        const currentColor = colorInput.value;

        presets.forEach(preset => {
            preset.classList.toggle('active', preset.dataset.color === currentColor);
        });
    }

    /**
     * Handle category form submission with proper UTF-8 handling
     */
    async handleCategorySubmit(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            console.log('🚀 Starting category submission...');

            if (!this.validateCategoryForm(form)) {
                console.log('❌ Form validation failed');
                this.showToast('Please correct the errors and try again.', 'error');
                return;
            }

            console.log('✅ Form validation passed');

            this.setButtonLoading(submitBtn, true);

            const formData = new FormData(form);
            const categoryData = this.prepareCategoryDataWithUTF8(formData);

            console.log('📤 Sending category data:', categoryData);

            let result;
            if (this.isEditing) {
                console.log(`📝 Updating category ${this.currentCategory.id}...`);
                result = await this.updateCategory(this.currentCategory.id, categoryData);
                this.showToast('Category updated successfully!', 'success');

                this.addNotification({
                    title: 'Category Updated',
                    message: `${categoryData.name} category has been updated`,
                    type: 'info'
                });
            } else {
                console.log('➕ Creating new category...');
                result = await this.createCategory(categoryData);
                console.log('✅ Category created:', result);

                this.lastCreatedCategoryId = result.id || result.categoryId;

                this.showToast('Category created successfully!', 'success');

                this.addNotification({
                    title: 'New Category Created',
                    message: `${categoryData.name} category has been created`,
                    type: 'success'
                });
            }

            console.log('🔄 Refreshing data...');

            await this.forceCompleteRefresh(this.lastCreatedCategoryId);
            this.closeCategoryModal();

            console.log(`✅ Category ${this.isEditing ? 'updated' : 'created'} successfully`);

        } catch (error) {
            console.error('❌ Category submission failed:', error);
            this.showToast(
                error.message || `Failed to ${this.isEditing ? 'update' : 'create'} category. Please try again.`,
                'error'
            );
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    /**
     * Prepare category data with proper UTF-8 encoding
     */
    prepareCategoryDataWithUTF8(formData) {
        const activeToggle = document.querySelector('.toggle-btn.active');

        const rawName = formData.get('name');
        const utf8Name = this.ensureUTF8String(rawName);

        console.log('📝 Category name processing:');
        console.log('  Raw name:', rawName);
        console.log('  UTF-8 name:', utf8Name);
        console.log('  Length:', utf8Name.length);

        return {
            name: utf8Name.trim(),
            type: activeToggle.dataset.type,
            color: formData.get('color') || '#3b82f6'
        };
    }

    /**
     * Ensure proper UTF-8 string encoding
     */
    ensureUTF8String(str) {
        if (!str) return '';

        try {
            const encoder = new TextEncoder();
            const decoder = new TextDecoder('utf-8');
            const utf8Bytes = encoder.encode(str);
            const utf8String = decoder.decode(utf8Bytes);

            return utf8String;
        } catch (error) {
            console.warn('UTF-8 encoding fallback:', error);
            return str;
        }
    }

    /**
     * Force complete data refresh with auto-focus on new category
     */
    async forceCompleteRefresh(newCategoryId = null) {
        try {
            console.log('🔄 Force refreshing ALL data...');

            this.categories = [];
            this.filteredCategories = [];

            this.showLoadingState();

            await Promise.all([
                this.loadCategories(),
                this.loadTransactions()
            ]);

            this.calculateSummaryData();
            this.applyFiltersAndRender();

            console.log('✅ Complete data refresh finished');
        } catch (error) {
            console.error('❌ Error during complete refresh:', error);
            this.showToast('Error refreshing data', 'error');
        }
    }

    /**
     * Handle quick category form submission
     */
    async handleQuickCategorySubmit(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            const nameInput = document.getElementById('quick-category-name');
            const typeInput = document.getElementById('quick-category-type');

            if (!nameInput.value.trim()) {
                this.showToast('Category name is required.', 'error');
                nameInput.focus();
                return;
            }

            this.setButtonLoading(submitBtn, true);

            const rawName = nameInput.value.trim();
            const utf8Name = this.ensureUTF8String(rawName);

            const categoryData = {
                name: utf8Name,
                type: typeInput.value,
                color: typeInput.value === 'INCOME' ? '#10b981' : '#f43f5e'
            };

            console.log('⚡ Quick category data:', categoryData);

            const result = await this.createCategory(categoryData);

            this.lastCreatedCategoryId = result.id || result.categoryId;

            this.showToast('Category created successfully!', 'success');

            this.addNotification({
                title: 'Quick Category Created',
                message: `${categoryData.name} category has been created`,
                type: 'success'
            });

            await this.forceCompleteRefresh(this.lastCreatedCategoryId);
            this.closeQuickCategoryModal();

            console.log('✅ Quick category created successfully');

        } catch (error) {
            console.error('❌ Quick category creation failed:', error);
            this.showToast(error.message || 'Failed to create category. Please try again.', 'error');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    /**
     * Validate category form - supports all characters including Bulgarian
     */
    validateCategoryForm(form) {
        let isValid = true;
        this.clearFormErrors();

        const name = form.name.value.trim();

        if (!name) {
            this.showFieldError('name-error', 'Category name is required');
            isValid = false;
        } else if (name.length < 1) {
            this.showFieldError('name-error', 'Category name must be at least 1 character');
            isValid = false;
        } else if (name.length > 100) {
            this.showFieldError('name-error', 'Category name must not exceed 100 characters');
            isValid = false;
        }

        console.log(`✅ Category validation: "${name}" - ${name.length} characters - ALL ALLOWED`);

        const activeToggle = document.querySelector('.toggle-btn.active');
        const categoryType = activeToggle?.dataset.type || 'EXPENSE';

        const duplicateCategory = this.categories.find(cat => {
            const existingName = cat.name.toLowerCase().trim();
            const newName = name.toLowerCase().trim();

            return existingName === newName &&
                   cat.type === categoryType &&
                   (!this.isEditing || cat.id !== this.currentCategory.id) &&
                   !cat.isDeleted;
        });

        if (duplicateCategory) {
            this.showFieldError('name-error', 'A category with this name already exists for this type');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Create new category
     */
    async createCategory(categoryData) {
        console.log('📤 Creating category via API:', categoryData);
        const result = await this.fetchAPI('/categories', 'POST', categoryData);
        console.log('📥 Create API response:', result);
        return result;
    }

    /**
     * Update existing category
     */
    async updateCategory(id, categoryData) {
        console.log(`📤 Updating category ${id} via API:`, categoryData);
        const result = await this.fetchAPI(`/categories/${id}`, 'PUT', categoryData);
        console.log('📥 Update API response:', result);
        return result;
    }

    /**
     * Edit category
     */
    async editCategory(categoryId) {
        try {
            const category = await this.fetchAPI(`/categories/${categoryId}`);
            this.openCategoryModal(null, category);
        } catch (error) {
            console.error('❌ Failed to load category for editing:', error);
            this.showToast('Failed to load category details. Please try again.', 'error');
        }
    }

    /**
     * ✅ COMPLETELY REWRITTEN: Delete category with ZERO false errors
     */
    async deleteCategory(categoryId) {
        try {
            console.log(`🔍 Loading category ${categoryId} for archiving...`);

            // ✅ FIXED: Don't use fetchAPI here either - direct fetch
            const response = await fetch(`${this.API_BASE}/categories/${categoryId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Category not found');
            }

            const category = await response.json();
            console.log('✅ Category loaded for archiving:', category);

            if (category.isDefault) {
                this.showToast('Cannot archive default categories. They are protected system categories.', 'warning');
                return;
            }

            if (category.isDeleted) {
                this.showToast('Category is already archived.', 'info');
                return;
            }

            this.showDeleteConfirmation(category);

        } catch (error) {
            console.error('❌ Failed to load category for archiving:', error);
            this.showToast('Failed to load category details. Please try again.', 'error');
        }
    }

    /**
     * ✅ COMPLETELY REWRITTEN: Confirm delete with bulletproof error handling
     */
    async confirmDeleteCategory() {
        if (!this.currentCategory) {
            console.error('❌ No current category selected');
            return;
        }

        const deleteBtn = document.getElementById('confirm-delete');
        const categoryName = this.currentCategory.name;
        const categoryId = this.currentCategory.id;

        console.log(`🗂️ STARTING archive process for category "${categoryName}" (ID: ${categoryId})`);

        // ✅ Show loading state
        this.setButtonLoading(deleteBtn, true);

        try {
            // ✅ DIRECT FETCH - no intermediate functions that can fail
            const url = `${this.API_BASE}/categories/${categoryId}`;
            console.log(`📡 Making DELETE request to: ${url}`);

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log(`📡 DELETE Response:`, {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: {
                    contentType: response.headers.get('content-type'),
                    contentLength: response.headers.get('content-length')
                }
            });

            // ✅ BULLETPROOF: Accept ANY successful HTTP status (200, 201, 202, 204, etc.)
            if (response.status >= 200 && response.status < 300) {
                console.log(`✅ DELETE SUCCESS: Category "${categoryName}" archived successfully (status: ${response.status})`);

                // ✅ IMMEDIATE SUCCESS HANDLING
                this.handleArchiveSuccess(categoryName);
                return;
            }

            // ✅ ONLY REAL HTTP ERRORS (4xx, 5xx)
            console.error(`❌ DELETE FAILED: HTTP ${response.status} - ${response.statusText}`);

            let errorMessage = 'Failed to archive category. Please try again.';
            try {
                const errorData = await response.text();
                if (errorData) {
                    errorMessage = `Archive failed: ${errorData}`;
                }
            } catch (parseError) {
                console.warn('Could not parse error response:', parseError);
            }

            this.handleArchiveError(errorMessage);

        } catch (networkError) {
            // ✅ ONLY NETWORK/CONNECTION ERRORS
            console.error(`❌ NETWORK ERROR archiving category "${categoryName}":`, networkError);

            if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
                this.handleArchiveError('Network error. Please check your connection and try again.');
            } else {
                this.handleArchiveError('Connection failed. Please try again.');
            }
        } finally {
            // ✅ ALWAYS restore button state
            this.setButtonLoading(deleteBtn, false);
        }
    }

    /**
     * ✅ NEW: Handle successful archive
     */
    handleArchiveSuccess(categoryName) {
        console.log(`🎉 Archive success handler for: ${categoryName}`);

        // ✅ Show success message
        this.showToast('Category archived successfully!', 'success');

        // ✅ Add notification
        this.addNotification({
            title: 'Category Archived',
            message: `${categoryName} has been archived`,
            type: 'warning'
        });

        // ✅ Close modal and refresh
        this.closeDeleteModal();
        this.refreshAllData();

        console.log(`✅ Archive success handling completed for: ${categoryName}`);
    }

    /**
     * ✅ UNCHANGED: Show delete confirmation modal
     */
    showDeleteConfirmation(category) {
        const modal = document.getElementById('delete-modal');
        const preview = document.getElementById('delete-category-preview');

        if (!modal || !preview) return;

        this.currentCategory = category;

        const usageCount = this.summaryData.categoryUsage.get(category.id) || 0;
        const typeClass = category.type === 'INCOME' ? 'income' : 'expense';

        const displayName = category.name;

        preview.innerHTML = `
            <div class="archive-preview">
                <div class="category-info">
                    <div class="category-color-dot" style="background-color: ${category.color || '#6366f1'}"></div>
                    <div class="category-details">
                        <div class="category-name">${this.escapeHtml(displayName)}</div>
                        <div class="category-type ${typeClass}">${category.type.toLowerCase()}</div>
                    </div>
                </div>

                <div class="impact-summary">
                    <div class="impact-item">
                        <div class="impact-icon">
                            <i data-lucide="database"></i>
                        </div>
                        <div class="impact-text">
                            <strong>${usageCount} transactions</strong> will keep this category
                        </div>
                    </div>

                    <div class="impact-item">
                        <div class="impact-icon">
                            <i data-lucide="archive"></i>
                        </div>
                        <div class="impact-text">
                            Category will be <strong>archived</strong> (not deleted)
                        </div>
                    </div>

                    <div class="impact-item">
                        <div class="impact-icon">
                            <i data-lucide="rotate-ccw"></i>
                        </div>
                        <div class="impact-text">
                            You can <strong>restore</strong> it anytime
                        </div>
                    </div>
                </div>

                <div class="archive-explanation">
                    <div class="explanation-icon">💡</div>
                    <div class="explanation-text">
                        Archived categories are hidden from new transactions but preserve your transaction history perfectly.
                    </div>
                </div>
            </div>
        `;

        const modalTitle = modal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Archive Category?';
        }

        const deleteBtn = document.getElementById('confirm-delete');
        if (deleteBtn) {
            deleteBtn.innerHTML = `
                <i data-lucide="archive"></i>
                <span>Archive Category</span>
            `;
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        console.log(`🗂️ Showing archive confirmation for category ${category.id}`);
    }

    /**
     * ✅ NEW: Handle archive error
     */
    handleArchiveError(errorMessage) {
        console.log(`❌ Archive error handler: ${errorMessage}`);
        this.showToast(errorMessage, 'error');
    }

    /**
     * Close delete confirmation modal
     */
    closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.currentCategory = null;
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        this.closeCategoryModal();
        this.closeDeleteModal();
        this.closeFilterPanel();
    }

    /**
     * Toggle filter panel
     */
    toggleFilterPanel() {
        const filterPanel = document.getElementById('category-filter-panel');

        if (filterPanel && filterPanel.classList.contains('active')) {
            this.closeFilterPanel();
        } else {
            this.showFilterPanel();
        }
    }

    /**
     * Show filter panel
     */
    showFilterPanel() {
        const filterPanel = document.getElementById('category-filter-panel');

        if (!filterPanel) {
            console.error('Filter panel not found');
            return;
        }

        this.populateFilterPanel();

        filterPanel.classList.add('active');

        console.log('🔍 Filter panel opened');
    }

    /**
     * Populate filter panel with current values
     */
    populateFilterPanel() {
        const filterType = document.getElementById('filter-category-type');
        const filterUsage = document.getElementById('filter-usage');
        const filterOrigin = document.getElementById('filter-origin');
        const filterSearch = document.getElementById('filter-search');
        const filterSort = document.getElementById('filter-sort');

        if (filterType) filterType.value = this.currentFilter.type;
        if (filterUsage) filterUsage.value = this.currentFilter.usage;
        if (filterOrigin) filterOrigin.value = this.currentFilter.origin;
        if (filterSearch) filterSearch.value = this.currentFilter.search;
        if (filterSort) filterSort.value = this.currentFilter.sort;
    }

    /**
     * Apply filters from panel
     */
    applyFiltersFromPanel() {
        const filterType = document.getElementById('filter-category-type');
        const filterUsage = document.getElementById('filter-usage');
        const filterOrigin = document.getElementById('filter-origin');
        const filterSearch = document.getElementById('filter-search');
        const filterSort = document.getElementById('filter-sort');

        // ✅ CRITICAL: Preserve showArchived state when applying filters
        const currentArchivedState = this.currentFilter.showArchived;

        this.currentFilter = {
            ...this.currentFilter,
            type: filterType?.value || 'all',
            usage: filterUsage?.value || 'all',
            origin: filterOrigin?.value || 'all',
            search: filterSearch?.value || '',
            sort: filterSort?.value || 'newest',
            showArchived: currentArchivedState  // ✅ PRESERVE archived state
        };

        // ✅ FIXED: Reset pagination to page 1 when filters change
        this.currentPage = 1;

        this.applyFiltersAndRender();

        console.log(`🔍 Manual filters applied (archived state preserved: ${currentArchivedState}, pagination reset to 1):`, this.currentFilter);
    }

    /**
     * Apply filters
     */
    applyFilters() {
        // ✅ FIXED: Reset pagination to page 1 when applying filters
        this.currentPage = 1;
        console.log('📄 Reset pagination to page 1 when applying filters');

        this.applyFiltersFromPanel();

        this.closeFilterPanel();

        const activeFilters = this.getActiveFiltersCount();
        if (activeFilters > 0) {
            this.showToast(`Applied ${activeFilters} filter${activeFilters > 1 ? 's' : ''} • Showing ${this.filteredCategories.length} categories`, 'success');
        } else {
            this.showToast(`Showing all ${this.filteredCategories.length} categories`, 'info');
        }

        console.log(`✅ Applied ${activeFilters} filters, showing ${this.filteredCategories.length} categories (pagination reset to 1)`);
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        // ✅ CRITICAL: Preserve showArchived state when clearing filters
        const currentArchivedState = this.currentFilter.showArchived;

        this.currentFilter = {
            type: 'all',
            usage: 'all',
            origin: 'all',
            search: '',
            sort: 'newest',
            showArchived: currentArchivedState  // ✅ PRESERVE archived state
        };

        // ✅ FIXED: Reset pagination to page 1 when clearing filters
        this.currentPage = 1;
        console.log('📄 Reset pagination to page 1 when clearing filters');

        this.applyFiltersAndRender();

        const filterPanel = document.getElementById('category-filter-panel');
        if (filterPanel && filterPanel.classList.contains('active')) {
            this.populateFilterPanel();
        }

        this.showToast('All filters cleared', 'info');
    }

    /**
     * Close filter panel
     */
    closeFilterPanel() {
        const filterPanel = document.getElementById('category-filter-panel');
        if (filterPanel) {
            filterPanel.classList.remove('active');
        }
    }

    /**
     * Initialize notifications
     */
    async initializeNotifications() {
        try {
            // ✅ ENHANCED: Clean up old notifications on startup
            this.cleanupOldNotifications();

            await this.loadNotifications();
            this.updateNotificationBadge();
            console.log('✅ Notifications initialized with 24h persistence');
        } catch (error) {
            console.error('❌ Failed to initialize notifications:', error);
        }
    }

    /**
     * ✅ COMPLETELY FIXED: Toggle notifications with bulletproof handling
     */
    toggleNotifications() {
        const panel = document.getElementById('notifications-panel');
        const button = document.getElementById('notification-btn');

        if (!panel) {
            console.error('❌ Notifications panel not found');
            return;
        }

        console.log('🔔 Notification button clicked, current state:', {
            panelExists: !!panel,
            isActive: panel.classList.contains('active'),
            display: panel.style.display,
            visibility: getComputedStyle(panel).visibility
        });

        // ✅ BULLETPROOF: Always determine state from actual DOM
        const isCurrentlyVisible = panel.classList.contains('active') &&
                                  panel.style.display !== 'none' &&
                                  getComputedStyle(panel).visibility !== 'hidden';

        if (isCurrentlyVisible) {
            console.log('🔔 Closing notifications panel...');
            this.closeNotificationsPanel();
        } else {
            console.log('🔔 Opening notifications panel...');
            this.showNotificationsPanel();
        }

        // ✅ PREVENT event bubbling that might interfere
        event?.stopPropagation();
        event?.preventDefault();
    }

    /**
     * ✅ ENHANCED: Show notifications panel with bulletproof opening and scroller detection
     */
    async showNotificationsPanel() {
        try {
            const panel = document.getElementById('notifications-panel');
            if (!panel) {
                console.error('❌ Notifications panel element not found');
                return;
            }

            console.log('🔔 Opening enhanced notifications panel...');

            // Force close first to ensure clean state
            this.closeNotificationsPanel();

            // Small delay to ensure clean state
            await new Promise(resolve => setTimeout(resolve, 50));

            // Load notifications first
            await this.loadNotifications();

            // Open panel
            panel.style.display = 'block';
            panel.style.visibility = 'visible';
            panel.style.opacity = '1';
            panel.classList.add('active');

            // Render with enhanced scroller logic
            this.renderNotifications();

            // Update badge
            this.updateNotificationBadge();

            // Focus for keyboard navigation if scroller is active
            const container = document.getElementById('notifications-list');
            if (container && container.classList.contains('enhanced-scroller')) {
                setTimeout(() => {
                    container.focus();
                }, 200);
            }

            console.log('✅ Enhanced notifications panel opened successfully');

        } catch (error) {
            console.error('❌ Failed to open notifications panel:', error);
            this.showToast('Failed to load notifications', 'error');
        }
    }

    /**
     * ✅ ENHANCED: Close notifications panel with bulletproof closing
     */
    closeNotificationsPanel() {
        const panel = document.getElementById('notifications-panel');
        if (panel) {
            console.log('🔔 Closing notifications panel...');

            // ✅ BULLETPROOF: Force closed state
            panel.classList.remove('active');
            panel.style.display = 'none';
            panel.style.visibility = 'hidden';
            panel.style.opacity = '0';

            console.log('✅ Notifications panel closed');
        }
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        try {
            this.notifications = await this.generateCategoryNotifications();
        } catch (error) {
            console.error('❌ Failed to load notifications:', error);
            this.notifications = [];
        }
    }

    /**
     * 🕒 ENHANCED: Generate category-related notifications with smart time filtering
     */
    async generateCategoryNotifications() {
        const notifications = [];

        try {
            const activeCategories = this.categories.filter(cat => !cat.isDeleted);

            // ✅ FIXED: Check if these notifications were already marked as read
            const readNotifications = this.getReadNotificationIds();

            const unusedCategories = activeCategories.filter(cat =>
                (this.summaryData.categoryUsage.get(cat.id) || 0) === 0
            );

            if (unusedCategories.length > 0) {
                const notificationId = 'unused-categories'; // ✅ Stable ID
                const timestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago

                notifications.push({
                    id: notificationId,
                    title: 'Unused Categories',
                    message: `You have ${unusedCategories.length} categories that haven't been used yet`,
                    type: 'info',
                    timestamp: timestamp,
                    isRead: readNotifications.includes(notificationId) // ✅ Check if already read
                });
            }

            const frequentCategories = activeCategories.filter(cat =>
                (this.summaryData.categoryUsage.get(cat.id) || 0) >= 20
            );

            if (frequentCategories.length > 0) {
                const notificationId = 'popular-categories'; // ✅ Stable ID
                const timestamp = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(); // 4 hours ago

                notifications.push({
                    id: notificationId,
                    title: 'Popular Categories',
                    message: `${frequentCategories.length} categories are heavily used - consider creating subcategories`,
                    type: 'info',
                    timestamp: timestamp,
                    isRead: readNotifications.includes(notificationId) // ✅ Check if already read
                });
            }

            const incomeCount = activeCategories.filter(cat => cat.type === 'INCOME').length;
            const expenseCount = activeCategories.filter(cat => cat.type === 'EXPENSE').length;

            if (expenseCount > incomeCount * 3) {
                const notificationId = 'category-balance'; // ✅ Stable ID
                const timestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 day ago

                notifications.push({
                    id: notificationId,
                    title: 'Category Balance',
                    message: `You have many more expense categories (${expenseCount}) than income categories (${incomeCount})`,
                    type: 'warning',
                    timestamp: timestamp,
                    isRead: readNotifications.includes(notificationId) // ✅ Check if already read
                });
            }

            // ✅ ENHANCED: Add session notifications with proper read state
            const sessionNotifications = this.getSessionNotifications();
            notifications.push(...sessionNotifications);

            // 🕒 NEW: Filter notifications older than 1 day
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const filteredNotifications = notifications.filter(notification => {
                const notificationTime = new Date(notification.timestamp);
                return notificationTime > oneDayAgo;
            });

            // ✅ Sort all notifications by timestamp (newest first)
            filteredNotifications.sort((a, b) => {
                const timestampA = new Date(a.timestamp);
                const timestampB = new Date(b.timestamp);
                return timestampB - timestampA; // Newest first
            });

            console.log(`🕒 Generated ${filteredNotifications.length} notifications (filtered to last 24h), sorted by time (newest first)`);
            return filteredNotifications;

        } catch (error) {
            console.error('❌ Error generating notifications:', error);
            return [];
        }
    }

    /**
     * ✅ NEW: Get list of read notification IDs
     */
    getReadNotificationIds() {
        try {
            const readIds = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
            console.log('📖 Retrieved read notification IDs:', readIds);
            return readIds;
        } catch (error) {
            console.warn('⚠️ Failed to get read notification IDs:', error);
            return [];
        }
    }

    /**
     * ✅ NEW: Save read notification ID permanently
     */
    saveReadNotificationId(notificationId) {
        try {
            const readIds = this.getReadNotificationIds();
            if (!readIds.includes(notificationId)) {
                readIds.push(notificationId);
                localStorage.setItem('readNotificationIds', JSON.stringify(readIds));
                console.log('💾 Saved read notification ID:', notificationId);
            }
        } catch (error) {
            console.warn('⚠️ Failed to save read notification ID:', error);
        }
    }

    /**
     * ✅ NEW: Save all notification IDs as read
     */
    saveAllNotificationsAsRead() {
        try {
            const allIds = this.notifications.map(n => n.id);
            localStorage.setItem('readNotificationIds', JSON.stringify(allIds));
            console.log('💾 Saved all notifications as read:', allIds);
        } catch (error) {
            console.warn('⚠️ Failed to save all notifications as read:', error);
        }
    }

    /**
     * 🕒 ENHANCED: Get session-specific notifications with 1-day filter
     */
    getSessionNotifications() {
        // ✅ CHANGED: Use localStorage instead of sessionStorage for persistence
        const sessionNotifications = JSON.parse(localStorage.getItem('categoryNotifications') || '[]');
        const readIds = this.getReadNotificationIds(); // ✅ Get read IDs

        // 🕒 CHANGED: Filter notifications up to 1 day old (instead of 1 hour)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        return sessionNotifications
            .filter(notification => {
                const notificationTime = new Date(notification.timestamp);
                // ✅ Keep notifications from the last 24 hours
                return notificationTime > oneDayAgo;
            })
            .map(notification => ({
                ...notification,
                isRead: readIds.includes(notification.id) || notification.isRead // ✅ Preserve read state
            }))
            .sort((a, b) => {
                // ✅ Sort session notifications by timestamp (newest first)
                const timestampA = new Date(a.timestamp);
                const timestampB = new Date(b.timestamp);
                return timestampB - timestampA;
            });
    }

    /**
     * ✅ ENHANCED: Add a new notification with proper timestamp and 24h storage
     */
    addNotification(notification) {
        // ✅ CHANGED: Use localStorage instead of sessionStorage
        const sessionNotifications = JSON.parse(localStorage.getItem('categoryNotifications') || '[]');

        const currentTime = new Date();
        const newNotification = {
            ...notification,
            id: Date.now(),
            timestamp: currentTime.toISOString(), // ✅ Proper ISO timestamp
            isRead: false, // ✅ New notifications start as unread
        };

        // ✅ Insert at the beginning (newest first)
        sessionNotifications.unshift(newNotification);

        // ✅ ENHANCED: Clean up notifications older than 1 day before saving
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const filteredNotifications = sessionNotifications.filter(notif => {
            const notifTime = new Date(notif.timestamp);
            return notifTime > oneDayAgo;
        });

        // ✅ Keep only notifications from last 24 hours (no arbitrary limit of 10)
        localStorage.setItem('categoryNotifications', JSON.stringify(filteredNotifications));

        // ✅ Update badge immediately
        this.updateNotificationBadge();

        console.log(`✅ Added new notification. Total notifications in last 24h: ${filteredNotifications.length}`);
    }

    /**
     * ✅ NEW: Clean up old notifications (called periodically)
     */
    cleanupOldNotifications() {
        try {
            const notifications = JSON.parse(localStorage.getItem('categoryNotifications') || '[]');
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const validNotifications = notifications.filter(notification => {
                const notificationTime = new Date(notification.timestamp);
                return notificationTime > oneDayAgo;
            });

            // ✅ Only update if there were changes
            if (validNotifications.length !== notifications.length) {
                localStorage.setItem('categoryNotifications', JSON.stringify(validNotifications));
                console.log(`🧹 Cleaned up old notifications. Kept ${validNotifications.length} from last 24h`);
            }

        } catch (error) {
            console.warn('⚠️ Failed to cleanup old notifications:', error);
        }
    }

    /**
     * 🎯 SIMPLE: Render notifications with smart time - NO fancy styling
     */
    renderNotifications() {
        const container = document.getElementById('notifications-list');
        const listContainer = document.getElementById('notifications-list-container') ||
                             container?.parentElement;

        if (!container) return;

        const notificationCount = this.notifications.length;
        console.log(`🔔 Rendering ${notificationCount} notifications with simple smart time display`);

        // Simple empty state
        if (notificationCount === 0) {
            container.innerHTML = `
                <div class="no-notifications">
                    <i data-lucide="bell-off"></i>
                    <p>No notifications</p>
                </div>
            `;
            this.removeScrollBehavior(container, listContainer);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        // 🕒 Calculate smart time display for each notification
        const notificationsWithSmartTime = this.notifications.map(notification => ({
            ...notification,
            smartTime: this.smartTime.calculateSmartTime(notification.timestamp)
        })).filter(notification => notification.smartTime !== null); // Filter out notifications older than 1 day

        console.log(`🕒 Filtered to ${notificationsWithSmartTime.length} notifications (within 1 day)`);

        // Update the notifications array to only include valid ones
        this.notifications = notificationsWithSmartTime;

        if (notificationsWithSmartTime.length === 0) {
            container.innerHTML = `
                <div class="no-notifications">
                    <i data-lucide="bell-off"></i>
                    <p>No recent notifications</p>
                </div>
            `;
            this.removeScrollBehavior(container, listContainer);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        // Render notifications with simple smart time - NO fancy classes or animations
        container.innerHTML = notificationsWithSmartTime.map((notification, index) => `
            <div class="notification-item ${notification.isRead ? '' : 'unread'}"
                 onclick="categoriesManager.markNotificationAsRead(${notification.id})"
                 data-notification-id="${notification.id}"
                 data-timestamp="${notification.timestamp}">
                <div class="notification-icon ${notification.type}">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${this.escapeHtml(notification.title)}</div>
                    <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                    <div class="notification-time">${notification.smartTime}</div>
                </div>
            </div>
        `).join('');

        // Apply scrolling behavior if > 3 notifications
        if (notificationsWithSmartTime.length > 3) {
            this.activateEnhancedVerticalScroller(container, listContainer);
        } else {
            this.removeScrollBehavior(container, listContainer);
        }

        // Refresh lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        console.log(`✅ Rendered ${notificationsWithSmartTime.length} notifications with simple time display`);
    }

    /**
     * 🎨 NEW: Activate enhanced VERTICAL scroller for notifications > 3 - SIMPLE VERSION
     */
    activateEnhancedVerticalScroller(container, listContainer) {
        if (!container) return;

        console.log('🎨 Setting up SIMPLE vertical notifications scroller...');

        // ✅ SIMPLE: Just set the class and basic properties
        container.classList.add('enhanced-vertical-scroller');

        // ✅ NO complex wrapper needed - container handles everything
        console.log('✅ Simple vertical scroller activated');
    }

    /**
     * 🎨 NEW: Remove scroll behavior for <= 3 notifications - SIMPLE VERSION
     */
    removeScrollBehavior(container, listContainer) {
        if (!container) return;

        console.log('🎨 Removing vertical scroller behavior...');

        // ✅ SIMPLE: Just remove the class and reset styles
        container.classList.remove('enhanced-vertical-scroller');

        console.log('✅ Standard layout restored');
    }

    /**
     * Update notification badge
     */
    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;

        const unreadCount = this.notifications.filter(n => !n.isRead).length;

        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    /**
     * Get notification icon based on type
     */
    getNotificationIcon(type) {
        const icons = {
            info: '<i data-lucide="info"></i>',
            warning: '<i data-lucide="alert-triangle"></i>',
            success: '<i data-lucide="check-circle"></i>',
            error: '<i data-lucide="x-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    /**
     * ✅ ENHANCED: Mark notification as read with permanent storage and cleanup
     */
    async markNotificationAsRead(notificationId) {
        try {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.isRead = true;
            }

            // ✅ CRITICAL: Save this notification as permanently read
            this.saveReadNotificationId(notificationId);

            // ✅ CHANGED: Update localStorage for session notifications (not sessionStorage)
            const sessionNotifications = JSON.parse(localStorage.getItem('categoryNotifications') || '[]');
            const sessionNotification = sessionNotifications.find(n => n.id === notificationId);
            if (sessionNotification) {
                sessionNotification.isRead = true;
                localStorage.setItem('categoryNotifications', JSON.stringify(sessionNotifications));
            }

            // Update UI with smooth animation
            const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (notificationElement) {
                notificationElement.classList.remove('unread');

                // Add read animation
                notificationElement.style.transition = 'all 0.3s ease';
                notificationElement.style.opacity = '0.8';

                setTimeout(() => {
                    notificationElement.style.opacity = '';
                }, 300);
            }

            this.updateNotificationBadge();

            // Smooth scroll to next unread if current was first unread
            const container = document.getElementById('notifications-list');
            if (container && container.classList.contains('enhanced-vertical-scroller')) {
                const nextUnread = container.querySelector('.notification-item.unread');
                if (nextUnread) {
                    nextUnread.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }
            }

            console.log(`✅ Notification ${notificationId} marked as read permanently`);

        } catch (error) {
            console.error('❌ Failed to mark notification as read:', error);
        }
    }

    /**
     * ✅ FIXED: Mark all notifications as read with permanent storage and cleanup
     */
    async markAllNotificationsAsRead() {
        try {
            console.log('🔔 Marking ALL notifications as read permanently...');

            // ✅ CRITICAL: Mark all current notifications as read
            this.notifications.forEach(notification => {
                notification.isRead = true;
            });

            // ✅ CRITICAL: Save all notification IDs as permanently read
            this.saveAllNotificationsAsRead();

            // ✅ CHANGED: Update localStorage for session notifications (not sessionStorage)
            const sessionNotifications = JSON.parse(localStorage.getItem('categoryNotifications') || '[]');
            sessionNotifications.forEach(notification => {
                notification.isRead = true;
            });
            localStorage.setItem('categoryNotifications', JSON.stringify(sessionNotifications));

            this.showToast('All notifications marked as read', 'success');

            this.updateNotificationBadge();
            this.renderNotifications();

            console.log('✅ All notifications marked as read permanently');

        } catch (error) {
            console.error('❌ Failed to mark all notifications as read:', error);
            this.showToast('Failed to update notifications', 'error');
        }
    }

    /**
     * ✅ BULLETPROOF: Refresh all data with error isolation
     */
    async refreshAllData() {
        try {
            console.log('🔄 Refreshing all data with error isolation...');

            // ✅ SAFE: Each operation isolated - if one fails, others continue
            const refreshOperations = [
                this.loadCategories().catch(error => {
                    console.warn('⚠️ Categories refresh failed:', error);
                    return []; // Return empty array on failure
                }),
                this.loadTransactions().catch(error => {
                    console.warn('⚠️ Transactions refresh failed:', error);
                    return []; // Return empty array on failure
                }),
                this.loadNotifications().catch(error => {
                    console.warn('⚠️ Notifications refresh failed:', error);
                    return []; // Return empty array on failure
                })
            ];

            // ✅ SAFE: Wait for all operations (even if some fail)
            await Promise.allSettled(refreshOperations);

            // ✅ SAFE: Always try to update UI (even with partial data)
            this.calculateSummaryData();
            this.applyFiltersAndRender();
            this.updateNotificationBadge();
            this.updateArchivedToggleButton();
            this.updateViewModeIndicator();

            console.log('✅ Data refresh completed (some operations may have failed safely)');
        } catch (error) {
            console.error('❌ Critical error during data refresh:', error);
            // ✅ SAFE: Don't throw error - just log it
        }
    }

    /**
     * Set button loading state
     */
    setButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<div class="loading-spinner"></div><span>Processing...</span>';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }

    /**
     * Show form field error
     */
    showFieldError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('visible');
        }
    }

    /**
     * Clear all form errors
     */
    clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('visible');
            error.textContent = '';
        });
    }

    /**
     * Update element content safely with optimized hover for truncated text
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;

            // ✅ OPTIMIZED: Better hover experience for truncated category names
            if (id === 'most-used-category' && content.includes('..')) {
                const originalName = this.summaryData.mostUsedCategory.name;

                // ✅ Create better tooltip with clean styling
                element.setAttribute('title', originalName); // Simple, clean tooltip
                element.style.cursor = 'pointer';

                // ✅ Subtle visual hint for hover
                element.style.textDecoration = 'underline';
                element.style.textDecorationStyle = 'dotted';
                element.style.textDecorationColor = 'rgba(255, 255, 255, 0.4)';
                element.style.textUnderlineOffset = '2px';

                // ✅ Add smooth hover effect
                element.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.05)';
                    this.style.transition = 'all 0.2s ease';
                    this.style.color = 'var(--text-primary)';
                });

                element.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1)';
                    this.style.color = '';
                });

            } else if (id === 'most-used-category') {
                // ✅ Clean up if name is not truncated
                element.removeAttribute('title');
                element.style.cursor = '';
                element.style.textDecoration = '';
                element.style.transform = '';
                element.style.transition = '';

                // Remove event listeners
                element.replaceWith(element.cloneNode(true));
            }
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
            <button class="toast-close">&times;</button>
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        setTimeout(() => this.hideToast(toast), type === 'error' ? 5000 : 3000);

        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hideToast(toast);
        });

        console.log(`🔔 Toast: ${type} - ${message}`);
    }

    /**
     * Get icon for toast type
     */
    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    /**
     * Hide toast notification
     */
    hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * ✅ ENHANCED: fetchAPI method to handle DELETE responses properly like in budgets
     */
    async fetchAPI(endpoint, method = 'GET', data = null) {
        const url = `${this.API_BASE}${endpoint}`;

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json; charset=UTF-8',
                'Accept': 'application/json; charset=UTF-8'
            }
        };

        if (data) {
            const jsonString = JSON.stringify(data);
            console.log('📡 Sending JSON:', jsonString);
            options.body = jsonString;
        }

        try {
            console.log(`📡 Making ${method} request to: ${url}`);
            const response = await fetch(url, options);

            console.log(`📡 Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                let errorMessage = `Request failed with status ${response.status}`;

                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorData.message || errorMessage;
                        console.log('📡 Error response JSON:', errorData);
                    } else {
                        const errorText = await response.text();
                        if (errorText) {
                            errorMessage = errorText;
                        }
                        console.log('📡 Error response text:', errorText);
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse error response:', parseError);
                    errorMessage = response.statusText || errorMessage;
                }

                throw new Error(errorMessage);
            }

            // ✅ FIXED: Handle empty responses for DELETE requests (like in budgets)
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');

            // If response is empty (like for DELETE operations)
            if (contentLength === '0' || !contentType) {
                console.log(`✅ ${method} request to ${endpoint} completed successfully (empty response)`);
                return { success: true }; // Return a success object for DELETE operations
            }

            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                console.log('📡 Success response JSON:', result);
                return result;
            } else {
                const result = await response.text();
                console.log('📡 Success response text:', result);
                return { success: true, message: result };
            }

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.error('❌ Network error:', error);
                throw new Error('Network error. Please check your connection and try again.');
            }

            console.error('❌ API Error:', error.message);
            throw error;
        }
    }
}

/**
 * 🕒 SMART NOTIFICATIONS TIME SYSTEM
 * ✅ 0-1 hour: Updates every 15 minutes (15 min ago, 30 min ago, 45 min ago, 1 hour ago)
 * ✅ 1+ hours: Updates every hour (2 hours ago, 3 hours ago, etc.)
 * ✅ Maximum 1 day: Notifications older than 1 day are hidden completely
 * ✅ Auto-refresh: Timer updates the display automatically
 */
class SmartNotificationTime {
    constructor() {
        this.refreshInterval = null;
        this.isRunning = false;
    }

    /**
     * 🕒 Calculate smart time display with 15min/1hour logic
     */
    calculateSmartTime(timestamp) {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffMs = now - notificationTime;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // ✅ FILTER: Hide notifications older than 1 day
        if (diffDays >= 1) {
            return null; // This notification should be hidden
        }

        // ✅ JUST NOW: Less than 5 minutes
        if (diffMinutes < 5) {
            return 'Just now';
        }

        // ✅ 0-1 HOUR: Show in 15-minute intervals
        if (diffMinutes < 60) {
            if (diffMinutes < 15) {
                return 'Just now';
            } else if (diffMinutes < 30) {
                return '15 minutes ago';
            } else if (diffMinutes < 45) {
                return '30 minutes ago';
            } else if (diffMinutes < 60) {
                return '45 minutes ago';
            }
        }

        // ✅ EXACTLY 1 HOUR: Special case
        if (diffMinutes >= 60 && diffHours === 1) {
            return '1 hour ago';
        }

        // ✅ 1+ HOURS: Show in hour intervals (up to 24 hours)
        if (diffHours >= 1 && diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        }

        // ✅ FALLBACK: Should not reach here due to 1-day filter above
        return null;
    }

    /**
     * 🔄 Calculate next refresh time (smart interval)
     */
    calculateNextRefreshInterval() {
        // Find the oldest notification that's still visible
        const now = new Date();
        let nextRefreshMs = 15 * 60 * 1000; // Default: 15 minutes

        if (window.categoriesManager && window.categoriesManager.notifications) {
            const validNotifications = window.categoriesManager.notifications.filter(notification => {
                const time = this.calculateSmartTime(notification.timestamp);
                return time !== null; // Only visible notifications
            });

            if (validNotifications.length > 0) {
                // Find the notification closest to a time boundary
                let shortestWait = 15 * 60 * 1000; // 15 minutes default

                validNotifications.forEach(notification => {
                    const notificationTime = new Date(notification.timestamp);
                    const diffMs = now - notificationTime;
                    const diffMinutes = Math.floor(diffMs / (1000 * 60));

                    if (diffMinutes < 60) {
                        // For notifications under 1 hour, next 15-minute boundary
                        const nextBoundary = Math.ceil((diffMinutes + 1) / 15) * 15;
                        const waitMinutes = nextBoundary - diffMinutes;
                        const waitMs = waitMinutes * 60 * 1000;

                        if (waitMs > 0 && waitMs < shortestWait) {
                            shortestWait = waitMs;
                        }
                    } else {
                        // For notifications over 1 hour, next hour boundary
                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                        const nextHourBoundary = (diffHours + 1) * 60; // in minutes
                        const currentMinutes = Math.floor(diffMs / (1000 * 60));
                        const waitMinutes = nextHourBoundary - currentMinutes;
                        const waitMs = waitMinutes * 60 * 1000;

                        if (waitMs > 0 && waitMs < shortestWait) {
                            shortestWait = waitMs;
                        }
                    }
                });

                nextRefreshMs = Math.max(shortestWait, 30 * 1000); // Minimum 30 seconds
            }
        }

        // Cap at 15 minutes maximum
        return Math.min(nextRefreshMs, 15 * 60 * 1000);
    }

    /**
     * 🚀 Start the smart refresh timer
     */
    startSmartRefresh() {
        if (this.isRunning) {
            return; // Already running
        }

        this.isRunning = true;
        console.log('🕒 Starting smart notifications time refresh...');

        const scheduleNextRefresh = () => {
            if (!this.isRunning) return;

            const nextInterval = this.calculateNextRefreshInterval();
            console.log(`⏰ Next notification time refresh in ${Math.round(nextInterval / 1000)} seconds`);

            this.refreshInterval = setTimeout(() => {
                if (!this.isRunning) return;

                console.log('🔄 Refreshing notification times...');
                this.updateAllNotificationTimes();
                scheduleNextRefresh(); // Schedule the next refresh
            }, nextInterval);
        };

        // Start the cycle
        scheduleNextRefresh();
    }

    /**
     * 🛑 Stop the smart refresh timer
     */
    stopSmartRefresh() {
        this.isRunning = false;
        if (this.refreshInterval) {
            clearTimeout(this.refreshInterval);
            this.refreshInterval = null;
        }
        console.log('🛑 Stopped smart notifications time refresh');
    }

    /**
     * 🔄 SIMPLE: Update all notification times in the DOM - no animations
     */
    updateAllNotificationTimes() {
        const notificationItems = document.querySelectorAll('.notification-item[data-timestamp]');
        let updatedCount = 0;
        let hiddenCount = 0;

        notificationItems.forEach(item => {
            const timestamp = item.dataset.timestamp;
            if (!timestamp) return;

            const timeElement = item.querySelector('.notification-time');
            if (!timeElement) return;

            const newTime = this.calculateSmartTime(timestamp);

            if (newTime === null) {
                // Simply hide notification older than 1 day
                item.style.display = 'none';
                hiddenCount++;
                console.log(`🕒 Hiding notification older than 1 day: ${timestamp}`);
            } else if (newTime !== timeElement.textContent) {
                // Simply update time display
                timeElement.textContent = newTime;
                updatedCount++;
                console.log(`🕒 Updated notification time: ${timeElement.textContent} → ${newTime}`);
            }
        });

        if (updatedCount > 0 || hiddenCount > 0) {
            console.log(`🕒 Simple time refresh completed: ${updatedCount} updated, ${hiddenCount} hidden`);

            // Update badge count if notifications were hidden
            if (hiddenCount > 0 && window.categoriesManager) {
                window.categoriesManager.updateNotificationBadge();
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.categoriesManager = new CategoriesManager();
});