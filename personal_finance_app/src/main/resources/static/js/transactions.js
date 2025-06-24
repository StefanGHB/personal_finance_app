/**
 * Transactions Page JavaScript - Enhanced with Advanced Filtering
 * Complete transaction management with comprehensive filtering system like categories
 * Clean version without style injection - all styles moved to CSS file
 */

class TransactionsManager {
    constructor() {
        this.API_BASE = '/api';
        this.transactions = [];
        this.categories = [];
        this.filteredTransactions = [];
        this.notifications = [];
        this.currentTransaction = null;
        this.isEditing = false;
        this.summaryData = {
            currentMonth: {
                transactions: [],
                totalCount: 0,
                totalIncome: 0,
                totalExpenses: 0
            },
            previousMonth: {
                transactions: [],
                totalCount: 0,
                totalIncome: 0,
                totalExpenses: 0
            },
            allTime: {
                transactions: [],
                totalCount: 0,
                balance: 0
            },
            today: {
                transactions: [],
                totalCount: 0
            }
        };

        // ✅ ENHANCED FILTER SYSTEM - similar to categories
        this.currentFilter = {
            type: 'all',           // all, INCOME, EXPENSE
            period: 'all',         // all, this-month, last-month, this-quarter, this-year, last-90-days, last-180-days, custom
            category: 'all',       // all, categoryId
            amount: 'all',         // all, micro, small, medium, large, very-large, huge, custom
            search: '',            // search term
            sort: 'newest',        // newest, oldest, amount_high, amount_low, alphabetical, category
            startDate: null,       // custom date range
            endDate: null,
            minAmount: null,       // custom amount range
            maxAmount: null,
            showArchived: false    // for future archive functionality
        };

        this.currentPage = 1;
        this.pageSize = 10; // Changed from 20 to 10 for pagination
        this.totalPages = 1;

        // ✅ NEW: Notification timer for auto-refresh
        this.notificationTimer = null;

        this.init();
    }

    /**
     * Initialize the transactions page
     */
    async init() {
        try {
            console.log('🚀 Initializing Transactions Manager...');
            this.showToast('Loading transactions...', 'info');

            // Setup event listeners first
            this.setupEventListeners();
            this.setupFilterEventListeners();

            // Load initial data in parallel for better performance
            await Promise.all([
                this.loadCategories(),
                this.loadAllTransactions(),
                this.loadCompleteSummaryData(),
                this.initializeNotifications()
            ]);

            // Initialize date inputs with current date
            this.initializeDateInputs();

            // Apply initial filters and render
            this.applyFiltersAndRender();

            // Setup auto-refresh for cross-tab sync
            this.setupCrossTabSync();

            // Initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            this.showToast('Transactions loaded successfully!', 'success');
            console.log('✅ Transactions Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Transactions Manager:', error);
            this.showToast('Failed to load transactions page. Please refresh and try again.', 'error');
        }
    }

    /**
     * Setup cross-tab synchronization for budget updates and notifications
     */
    setupCrossTabSync() {
        // Listen for focus events to refresh data
        window.addEventListener('focus', () => {
            const lastRefresh = localStorage.getItem('transactionsLastRefresh');
            const now = Date.now();

            if (!lastRefresh || (now - parseInt(lastRefresh)) > 30000) {
                console.log('🔄 Auto-refreshing transactions after window focus');
                this.refreshAllData();
                localStorage.setItem('transactionsLastRefresh', now.toString());
            }

            // ✅ FIXED: Refresh notifications on window focus preserving localStorage data
            console.log('🔔 Refreshing notifications on window focus with localStorage persistence');
            this.cleanupOldNotifications(); // Clean old notifications first
            this.loadNotifications().then(() => {
                this.updateNotificationBadge();

                // Only re-render if notifications panel is open
                const panel = document.getElementById('notifications-panel');
                if (panel && panel.classList.contains('active')) {
                    this.renderNotifications();
                }
            });
        });

        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'budgetUpdated' && e.newValue) {
                console.log('🔄 Refreshing transactions after budget update');
                this.refreshAllData();
                localStorage.removeItem('budgetUpdated');
            }

            // ✅ NEW: Listen for notification updates from other tabs
            if (e.key === 'transactionNotifications' && e.newValue) {
                console.log('🔔 Notifications updated in another tab, refreshing...');
                this.loadNotifications().then(() => {
                    this.updateNotificationBadge();

                    // Update display if notifications panel is open
                    const panel = document.getElementById('notifications-panel');
                    if (panel && panel.classList.contains('active')) {
                        this.renderNotifications();
                    }
                });
            }
        });
    }

    /**
     * Signal budget update to other tabs
     */
    signalBudgetUpdate() {
        try {
            localStorage.setItem('transactionUpdated', Date.now().toString());
            console.log('📡 Signaled budget update to other tabs');
        } catch (error) {
            console.warn('Failed to signal budget update:', error);
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Primary action buttons
        this.addEventListeners([
            ['add-transaction-btn', 'click', () => this.openTransactionModal()],
            ['add-first-transaction-btn', 'click', () => this.openTransactionModal()],
            ['quick-add-income', 'click', () => this.openTransactionModal('INCOME')],
            ['quick-add-expense', 'click', () => this.openTransactionModal('EXPENSE')]
        ]);

        // Modal controls
        this.addEventListeners([
            ['close-transaction-modal', 'click', () => this.closeTransactionModal()],
            ['cancel-transaction-btn', 'click', () => this.closeTransactionModal()],
            ['close-delete-modal', 'click', () => this.closeDeleteModal()],
            ['cancel-delete-btn', 'click', () => this.closeDeleteModal()],
            ['confirm-delete-btn', 'click', () => this.confirmDeleteTransaction()]
        ]);

        // Form handling
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        }

        // Transaction type toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleTransactionTypeToggle(btn));
        });

        // Navigation and filtering
        this.addEventListeners([
            ['view-all-btn', 'click', () => this.showAllTransactions()],
            ['notification-btn', 'click', () => this.toggleNotifications()],
            ['mark-all-read', 'click', () => this.markAllNotificationsAsRead()]
        ]);

        // Global event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }

            // Close notifications panel when clicking outside
            if (!e.target.closest('.notifications-dropdown')) {
                this.closeNotificationsPanel();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.closeFilterPanel();
            }
            // Keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openTransactionModal();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFilterPanel();
                        break;
                }
            }
        });
    }

    /**
     * ✅ ENHANCED: Setup filter event listeners with improved reliability
     */
    setupFilterEventListeners() {
        // Filter button with multiple event handling approaches
        const filterButton = document.getElementById('transaction-filter');
        if (filterButton) {
            // Remove any existing listeners to prevent conflicts
            filterButton.replaceWith(filterButton.cloneNode(true));
            const newFilterButton = document.getElementById('transaction-filter');

            // Add click listener
            newFilterButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 Filter button clicked');
                this.toggleFilterPanel();
            });

            // Add touch listener for mobile
            newFilterButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📱 Filter button touched');
                this.toggleFilterPanel();
            });

            console.log('✅ Filter button listeners attached');
        } else {
            console.warn('⚠️ Filter button not found, retrying...');
            // Retry after DOM is ready
            setTimeout(() => this.setupFilterEventListeners(), 100);
        }

        // Global event listeners for filter panel with improved handling
        document.addEventListener('click', (e) => {
            const filterPanel = e.target.closest('.filter-panel');
            const filterButton = e.target.closest('#transaction-filter');

            // Only close if clicking outside both panel and button
            if (!filterPanel && !filterButton) {
                const activePanel = document.getElementById('transaction-filter-panel');
                if (activePanel && activePanel.classList.contains('active')) {
                    console.log('🔍 Closing filter panel - outside click');
                    this.closeFilterPanel();
                }
            }
        });

        // Enhanced keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                        e.preventDefault();
                        console.log('⌨️ Filter shortcut pressed');
                        this.toggleFilterPanel();
                        break;
                }
            }

            if (e.key === 'Escape') {
                const activePanel = document.getElementById('transaction-filter-panel');
                if (activePanel && activePanel.classList.contains('active')) {
                    console.log('🔍 Closing filter panel - ESC key');
                    this.closeFilterPanel();
                }
            }
        });
    }

    /**
     * ✅ NEW: Normalize search terms with proper Bulgarian support
     */
    normalizeSearchTerm(text) {
        if (!text) return '';

        // Preserve original letters, only remove excessive spaces
        let normalized = text.toLowerCase().trim();

        // Remove multiple spaces
        normalized = normalized.replace(/\s+/g, ' ');

        console.log(`🔤 Search normalization: "${text}" → "${normalized}" (Bulgarian preserved)`);
        return normalized;
    }

    /**
     * ✅ NEW: Enhanced function to check if text contains search term
     */
    textContainsSearchTerm(text, searchTerm) {
        if (!text || !searchTerm) return false;

        // Normalize both texts for comparison
        const normalizedText = text.toLowerCase().trim();
        const normalizedSearch = searchTerm.toLowerCase().trim();

        // Direct search for exact match
        const exactMatch = normalizedText.includes(normalizedSearch);

        if (exactMatch) {
            console.log(`✅ Search match: "${text}" contains "${searchTerm}"`);
            return true;
        }

        // Additional word-based search for more flexible finding
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
     * Helper method to add multiple event listeners
     */
    addEventListeners(listeners) {
        listeners.forEach(([id, event, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                // Add error handling to event listeners
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
            const categories = await this.fetchAPI('/categories');
            this.categories = categories;
            this.populateCategorySelect();
            console.log('✅ Categories loaded:', categories.length);
        } catch (error) {
            console.error('❌ Failed to load categories:', error);
            this.showToast('Failed to load categories. Some features may be limited.', 'warning');
        }
    }

    /**
     * Translate Bulgarian category names to English
     */
    translateCategoryName(bulgName) {
        const translations = {
            // Income categories
            'Заплата': 'Salary',
            'Бонус': 'Bonus',
            'Фриланс': 'Freelance',
            'Инвестиции': 'Investments',
            'Дивиденти': 'Dividends',
            'Наем': 'Rent Income',
            'Подарък': 'Gift',
            'Възстановяване': 'Refund',
            'Други приходи': 'Other Income',
            'Продажба': 'Sale',
            'Комисионна': 'Commission',
            'Пенсия': 'Pension',
            'Стипендия': 'Scholarship',
            'Лихви': 'Interest',

            // Expense categories
            'Храна': 'Food',
            'Транспорт': 'Transport',
            'Жилище': 'Housing',
            'Комунални услуги': 'Utilities',
            'Здравеопазване': 'Healthcare',
            'Образование': 'Education',
            'Развлечения': 'Entertainment',
            'Дрехи': 'Clothing',
            'Красота': 'Beauty',
            'Спорт': 'Sports',
            'Технологии': 'Technology',
            'Пътувания': 'Travel',
            'Подаръци': 'Gifts',
            'Застраховки': 'Insurance',
            'Данъци': 'Taxes',
            'Кредити': 'Loans',
            'Домашни любимци': 'Pets',
            'Ремонт': 'Repairs',
            'Автомобил': 'Car',
            'Горива': 'Fuel',
            'Паркиране': 'Parking',
            'Такси': 'Taxi',
            'Обществен транспорт': 'Public Transport',
            'Ресторант': 'Restaurant',
            'Кафе': 'Cafe',
            'Пазаруване': 'Shopping',
            'Аптека': 'Pharmacy',
            'Лекар': 'Doctor',
            'Зъболекар': 'Dentist',
            'Фитнес': 'Fitness',
            'Книги': 'Books',
            'Кино': 'Cinema',
            'Театър': 'Theater',
            'Концерт': 'Concert',
            'Игри': 'Games',
            'Хоби': 'Hobbies',
            'Телефон': 'Phone',
            'Интернет': 'Internet',
            'Телевизия': 'TV',
            'Ток': 'Electricity',
            'Вода': 'Water',
            'Газ': 'Gas',
            'Отопление': 'Heating',
            'Наем квартира': 'Rent',
            'Ипотека': 'Mortgage',
            'Други разходи': 'Other Expenses',
            'Разни': 'Miscellaneous',
            'Безплатно': 'Free',
            'Работа': 'Work',
            'Семейство': 'Family',
            'Деца': 'Children',
            'Играчки': 'Toys',
            'Училище': 'School',
            'Университет': 'University',
            'Курсове': 'Courses'
        };

        return translations[bulgName] || bulgName;
    }

    /**
     * Populate category select options with English translations - ENHANCED with elegant styling
     */
    populateCategorySelect() {
        const categorySelect = document.getElementById('transaction-category');
        if (!categorySelect) return;

        // Clear existing options (except placeholder)
        categorySelect.innerHTML = '<option value="">Select a category...</option>';

        // Get current transaction type from toggle
        const activeToggle = document.querySelector('.toggle-btn.active');
        const currentType = activeToggle?.dataset.type || 'EXPENSE';

        // Filter categories by type
        const filteredCategories = this.categories.filter(cat => cat.type === currentType);

        // Add filtered categories with English names
        filteredCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = this.translateCategoryName(category.name);
            option.style.color = category.color || '#6366f1';
            categorySelect.appendChild(option);
        });

        if (filteredCategories.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = `No ${currentType.toLowerCase()} categories available`;
            option.disabled = true;
            categorySelect.appendChild(option);
        }

        // ✅ ENHANCED: Apply elegant dropdown styling for transaction modal
        this.applyElegantDropdownStyling(categorySelect, filteredCategories.length);
    }

    /**
     * ✅ NEW: Apply elegant dropdown styling to category selects
     */
    applyElegantDropdownStyling(selectElement, categoryCount) {
        if (!selectElement) return;

        // Add the elegant dropdown class
        selectElement.classList.add('elegant-category-dropdown');

        // Force scrollable behavior if more than 5 categories
        if (categoryCount > 5) {
            setTimeout(() => {
                selectElement.setAttribute('size', '5');
                selectElement.style.height = 'auto';
                selectElement.style.maxHeight = '200px';
                selectElement.style.overflowY = 'auto';
                selectElement.style.scrollBehavior = 'smooth';

                console.log(`✅ Transaction modal dropdown styled: showing 5 of ${categoryCount} categories with scroll`);
            }, 50);
        }
    }

    /**
     * Load ALL transactions from API
     */
    async loadAllTransactions() {
        try {
            console.log('📥 Loading all transactions from API...');

            const transactions = await this.fetchAPI('/transactions');
            this.transactions = transactions;

            console.log('✅ All transactions loaded:', transactions.length);

        } catch (error) {
            console.error('❌ Failed to load transactions:', error);
            this.transactions = [];
            this.showToast('Failed to load transactions. Please check your connection and try again.', 'error');
        }
    }

    /**
     * ✅ ENHANCED: Apply filters and render with comprehensive filtering logic
     */
    applyFiltersAndRender() {
        console.log('🔍 Applying enhanced filters:', this.currentFilter);

        let filtered = [...this.transactions];

        // 1. Apply TYPE filter first
        if (this.currentFilter.type !== 'all') {
            filtered = filtered.filter(t => t.type === this.currentFilter.type);
            console.log(`After type filter (${this.currentFilter.type}):`, filtered.length);
        }

        // 2. Apply PERIOD filter
        if (this.currentFilter.period !== 'all') {
            filtered = this.applyPeriodFilter(filtered);
            console.log(`After period filter (${this.currentFilter.period}):`, filtered.length);
        }

        // 3. Apply CATEGORY filter
        if (this.currentFilter.category !== 'all') {
            filtered = filtered.filter(t => t.categoryId == this.currentFilter.category);
            console.log(`After category filter (${this.currentFilter.category}):`, filtered.length);
        }

        // 4. Apply AMOUNT filter
        if (this.currentFilter.amount !== 'all') {
            filtered = this.applyAmountFilter(filtered);
            console.log(`After amount filter (${this.currentFilter.amount}):`, filtered.length);
        }

        // 5. Apply SEARCH filter with Bulgarian support
        if (this.currentFilter.search) {
            const searchTerm = this.normalizeSearchTerm(this.currentFilter.search);
            filtered = filtered.filter(t => {
                const transactionDescription = t.description || '';
                const categoryName = this.translateCategoryName(t.categoryName || '');

                return this.textContainsSearchTerm(transactionDescription, searchTerm) ||
                       this.textContainsSearchTerm(categoryName, searchTerm);
            });
            console.log(`After search filter (${this.currentFilter.search}):`, filtered.length);
        }

        // 6. Apply SORTING
        filtered = this.applyCleanSorting(filtered);

        this.filteredTransactions = filtered;
        this.updatePagination();
        this.renderTransactions();

        // Update filter button indicator
        this.updateFilterButtonIndicator();

        console.log('✅ Enhanced filters applied successfully. Final count:', filtered.length);
    }

    /**
     * ✅ ENHANCED: Apply amount filter with realistic ranges
     */
    applyAmountFilter(transactions) {
        switch (this.currentFilter.amount) {
            case 'micro':
                return transactions.filter(t => parseFloat(t.amount) <= 20);
            case 'small':
                return transactions.filter(t => {
                    const amount = parseFloat(t.amount);
                    return amount > 20 && amount <= 100;
                });
            case 'medium':
                return transactions.filter(t => {
                    const amount = parseFloat(t.amount);
                    return amount > 100 && amount <= 500;
                });
            case 'large':
                return transactions.filter(t => {
                    const amount = parseFloat(t.amount);
                    return amount > 500 && amount <= 2000;
                });
            case 'very-large':
                return transactions.filter(t => {
                    const amount = parseFloat(t.amount);
                    return amount > 2000 && amount <= 10000;
                });
            case 'huge':
                return transactions.filter(t => parseFloat(t.amount) > 10000);
            case 'custom':
                if (this.currentFilter.minAmount !== null || this.currentFilter.maxAmount !== null) {
                    return transactions.filter(t => {
                        const amount = parseFloat(t.amount);
                        const min = this.currentFilter.minAmount;
                        const max = this.currentFilter.maxAmount;

                        if (min !== null && max !== null) {
                            return amount >= min && amount <= max;
                        } else if (min !== null) {
                            return amount >= min;
                        } else if (max !== null) {
                            return amount <= max;
                        }
                        return true;
                    });
                }
                return transactions;
            default:
                return transactions;
        }
    }

    /**
     * Apply period filter with correct date logic
     */
    applyPeriodFilter(transactions) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        switch (this.currentFilter.period) {
            case 'this-month':
                return transactions.filter(t => {
                    const tDate = new Date(t.transactionDate);
                    return tDate.getFullYear() === currentYear &&
                           (tDate.getMonth() + 1) === currentMonth;
                });

            case 'last-month':
                const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
                return transactions.filter(t => {
                    const tDate = new Date(t.transactionDate);
                    return tDate.getFullYear() === lastMonthYear &&
                           (tDate.getMonth() + 1) === lastMonth;
                });

            case 'this-year':
                return transactions.filter(t => {
                    const tDate = new Date(t.transactionDate);
                    return tDate.getFullYear() === currentYear;
                });

            case 'this-quarter':
                const quarterStart = new Date(currentYear, Math.floor((currentMonth - 1) / 3) * 3, 1);
                return transactions.filter(t => {
                    const tDate = new Date(t.transactionDate);
                    return tDate >= quarterStart && tDate <= now;
                });

            case 'last-90-days':
                const ninetyDaysAgo = new Date(now);
                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                return transactions.filter(t => {
                    const tDate = new Date(t.transactionDate);
                    return tDate >= ninetyDaysAgo && tDate <= now;
                });

            case 'last-180-days':
                const oneEightyDaysAgo = new Date(now);
                oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);
                return transactions.filter(t => {
                    const tDate = new Date(t.transactionDate);
                    return tDate >= oneEightyDaysAgo && tDate <= now;
                });

            case 'last-7-days':
                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return transactions.filter(t => {
                    const tDate = new Date(t.transactionDate);
                    return tDate >= sevenDaysAgo && tDate <= now;
                });

            case 'last-30-days':
                const thirtyDaysAgo = new Date(now);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return transactions.filter(t => {
                    const tDate = new Date(t.transactionDate);
                    return tDate >= thirtyDaysAgo && tDate <= now;
                });

            case 'custom':
                if (this.currentFilter.startDate && this.currentFilter.endDate) {
                    const startDate = new Date(this.currentFilter.startDate);
                    const endDate = new Date(this.currentFilter.endDate);
                    return transactions.filter(t => {
                        const tDate = new Date(t.transactionDate);
                        return tDate >= startDate && tDate <= endDate;
                    });
                }
                return transactions;

            default:
                return transactions;
        }
    }

    /**
     * ✅ NEW: Apply clean sorting similar to categories
     */
    applyCleanSorting(transactions) {
        switch (this.currentFilter.sort) {
            case 'alphabetical':
                return transactions.sort((a, b) => a.description.localeCompare(b.description));
            case 'amount_high':
                return transactions.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
            case 'amount_low':
                return transactions.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
            case 'category':
                return transactions.sort((a, b) => {
                    const categoryA = this.translateCategoryName(a.categoryName || '');
                    const categoryB = this.translateCategoryName(b.categoryName || '');
                    return categoryA.localeCompare(categoryB);
                });
            case 'oldest':
                return transactions.sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));
            case 'newest':
            default:
                return transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
        }
    }

    /**
     * ✅ NEW: Get active filters text for display
     */
    getActiveFiltersText() {
        const filters = [];

        if (this.currentFilter.type !== 'all') {
            filters.push(`Type: ${this.currentFilter.type}`);
        }
        if (this.currentFilter.period !== 'all') {
            filters.push(`Period: ${this.currentFilter.period}`);
        }
        if (this.currentFilter.category !== 'all') {
            const category = this.categories.find(cat => cat.id == this.currentFilter.category);
            if (category) {
                filters.push(`Category: ${this.translateCategoryName(category.name)}`);
            }
        }
        if (this.currentFilter.amount !== 'all') {
            filters.push(`Amount: ${this.currentFilter.amount}`);
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
     * ✅ NEW: Get count of active filters
     */
    getActiveFiltersCount() {
        let count = 0;
        if (this.currentFilter.type !== 'all') count++;
        if (this.currentFilter.period !== 'all') count++;
        if (this.currentFilter.category !== 'all') count++;
        if (this.currentFilter.amount !== 'all') count++;
        if (this.currentFilter.search) count++;
        return count;
    }

    /**
     * ✅ NEW: Update filter button indicator
     */
    updateFilterButtonIndicator() {
        const filterBtn = document.getElementById('transaction-filter');
        if (!filterBtn) return;

        const activeFiltersCount = this.getActiveFiltersCount();

        if (activeFiltersCount > 0) {
            filterBtn.classList.add('has-filters');
            filterBtn.setAttribute('data-filter-count', activeFiltersCount);
        } else {
            filterBtn.classList.remove('has-filters');
            filterBtn.removeAttribute('data-filter-count');
        }
    }

    /**
     * Update pagination info
     */
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredTransactions.length / this.pageSize);
        if (this.currentPage > this.totalPages) {
            this.currentPage = 1;
        }
    }

    /**
     * Get current page transactions
     */
    getCurrentPageTransactions() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        return this.filteredTransactions.slice(startIndex, endIndex);
    }

    /**
     * Load complete summary data for cards with enhanced error handling
     */
    async loadCompleteSummaryData() {
        try {
            console.log('📊 Loading complete summary data...');

            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1;

            // Calculate previous month
            const prevDate = new Date(currentYear, currentMonth - 2, 1);
            const prevYear = prevDate.getFullYear();
            const prevMonth = prevDate.getMonth() + 1;

            // Today's date string
            const today = currentDate.toISOString().split('T')[0];

            // Load all data in parallel with detailed error handling
            const dataRequests = [
                this.fetchAPI('/transactions').catch(err => {
                    console.warn('Failed to load all transactions:', err);
                    return [];
                }),
                this.fetchAPI(`/transactions/month/${currentYear}/${currentMonth}`).catch(err => {
                    console.warn('Failed to load current month transactions:', err);
                    return [];
                }),
                this.fetchAPI(`/transactions/month/${prevYear}/${prevMonth}`).catch(err => {
                    console.warn('Failed to load previous month transactions:', err);
                    return [];
                }),
                this.fetchAPI('/transactions/balance').catch(err => {
                    console.warn('Failed to load balance:', err);
                    return { balance: 0 };
                })
            ];

            const [allTransactions, currentMonthTransactions, prevMonthTransactions, balanceData] = await Promise.all(dataRequests);

            // Today's transactions
            const todayTransactions = allTransactions.filter(t => t.transactionDate === today);

            // Process current month data
            const currentMonthIncome = currentMonthTransactions
                .filter(t => t.type === 'INCOME')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            const currentMonthExpenses = currentMonthTransactions
                .filter(t => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            // Process previous month data
            const prevMonthIncome = prevMonthTransactions
                .filter(t => t.type === 'INCOME')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            const prevMonthExpenses = prevMonthTransactions
                .filter(t => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            // Store processed data
            this.summaryData = {
                currentMonth: {
                    transactions: currentMonthTransactions,
                    totalCount: currentMonthTransactions.length,
                    totalIncome: currentMonthIncome,
                    totalExpenses: currentMonthExpenses
                },
                previousMonth: {
                    transactions: prevMonthTransactions,
                    totalCount: prevMonthTransactions.length,
                    totalIncome: prevMonthIncome,
                    totalExpenses: prevMonthExpenses
                },
                allTime: {
                    transactions: allTransactions,
                    totalCount: allTransactions.length,
                    balance: parseFloat(balanceData.balance || 0)
                },
                today: {
                    transactions: todayTransactions,
                    totalCount: todayTransactions.length
                }
            };

            // Update all summary cards
            this.updateAllSummaryCards();

            console.log('✅ Complete summary data loaded and processed');

        } catch (error) {
            console.error('❌ Failed to load complete summary data:', error);
            this.showToast('Failed to load summary statistics.', 'warning');

            // Set default values to prevent undefined errors
            this.summaryData = {
                currentMonth: { transactions: [], totalCount: 0, totalIncome: 0, totalExpenses: 0 },
                previousMonth: { transactions: [], totalCount: 0, totalIncome: 0, totalExpenses: 0 },
                allTime: { transactions: [], totalCount: 0, balance: 0 },
                today: { transactions: [], totalCount: 0 }
            };

            this.updateAllSummaryCards();
        }
    }

    /**
     * Update all summary cards with calculated data and trends
     */
    updateAllSummaryCards() {
        try {
            console.log('🔄 Updating all summary cards...');

            // Card 1: Total Transactions
            this.updateElement('total-transactions', this.summaryData.allTime.totalCount);

            // Card 2: This Month Transactions
            this.updateElement('monthly-transactions', this.summaryData.currentMonth.totalCount);

            // Card 3: Recent Activity (Today)
            this.updateElement('recent-activity', this.summaryData.today.totalCount);

            // Update trend indicators with percentage calculations
            this.updateTrendIndicators();

            console.log('✅ All summary cards updated successfully');

        } catch (error) {
            console.error('❌ Error updating summary cards:', error);
        }
    }

    /**
     * Enhanced trend indicators with proper percentage calculations
     */
    updateTrendIndicators() {
        try {
            // Monthly transactions trend
            const currentCount = this.summaryData.currentMonth.totalCount;
            const prevCount = this.summaryData.previousMonth.totalCount;

            let monthlyTrendText = 'No previous data';
            let monthlyTrendIcon = 'trending-up';

            if (prevCount > 0) {
                const percentage = Math.round(((currentCount - prevCount) / prevCount) * 100);
                const isPositive = percentage >= 0;

                monthlyTrendText = `${Math.abs(percentage)}% vs last month`;
                monthlyTrendIcon = isPositive ? 'trending-up' : 'trending-down';

                // Update icon color based on trend
                const trendIndicator = document.querySelector('#monthly-trend .trend-indicator i');
                if (trendIndicator) {
                    trendIndicator.setAttribute('data-lucide', monthlyTrendIcon);
                    trendIndicator.style.color = isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)';
                }
            } else if (currentCount > 0) {
                monthlyTrendText = 'First month data';
                monthlyTrendIcon = 'info';
            }

            this.updateElement('monthly-trend', monthlyTrendText);

            // Today's activity trend
            const todayCount = this.summaryData.today.totalCount;
            let activityText = 'No activity today';

            if (todayCount > 0) {
                activityText = `${todayCount} transaction${todayCount > 1 ? 's' : ''} today`;
            }

            this.updateElement('last-activity', activityText);

            // Refresh icons to apply new data-lucide attributes
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            console.log('✅ Trend indicators updated');

        } catch (error) {
            console.error('❌ Error updating trend indicators:', error);
        }
    }

    /**
     * ✅ ENHANCED: Render transactions with pagination
     */
    renderTransactions() {
        const container = document.getElementById('transactions-list');
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');

        if (!container) return;

        // Hide loading state
        if (loadingState) loadingState.style.display = 'none';

        const currentTransactions = this.getCurrentPageTransactions();

        if (currentTransactions.length === 0) {
            // Show enhanced empty message
            container.innerHTML = this.getEmptyStateHTML();
            if (emptyState) emptyState.style.display = 'none';
            this.hidePagination();
            return;
        }

        // Hide empty state and show transactions
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = currentTransactions.map(transaction =>
            this.createTransactionHTML(transaction)
        ).join('');

        // Add click handlers for transaction items
        container.querySelectorAll('.transaction-item').forEach(item => {
            const transactionId = item.dataset.transactionId;

            // Edit on click
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.transaction-actions')) {
                    this.editTransaction(transactionId);
                }
            });
        });

        // Show pagination if needed
        this.renderPagination();

        // Refresh icons after rendering transactions
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * ✅ ENHANCED: Render pagination with dynamic transaction count
     */
    renderPagination() {
        const totalTransactions = this.filteredTransactions.length;

        // Only show pagination if we have more than 10 transactions
        if (totalTransactions <= this.pageSize) {
            this.hidePagination();
            return;
        }

        // Find or create pagination container
        let paginationContainer = document.getElementById('transactions-pagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'transactions-pagination';
            paginationContainer.className = 'transactions-pagination';

            // Insert after transactions list
            const transactionsContainer = document.querySelector('.transactions-container');
            if (transactionsContainer) {
                transactionsContainer.appendChild(paginationContainer);
            }
        }

        const currentStart = (this.currentPage - 1) * this.pageSize + 1;
        const currentEnd = Math.min(this.currentPage * this.pageSize, totalTransactions);
        const currentPageCount = currentEnd - currentStart + 1; // Actual transactions on current page

        paginationContainer.innerHTML = `
            <div class="pagination-wrapper">
                <button class="pagination-btn prev-btn"
                        onclick="transactionsManager.goToPreviousPage()"
                        ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i data-lucide="chevron-left"></i>
                </button>

                <div class="pagination-info">
                    <div class="page-info">Page ${this.currentPage} of ${this.totalPages}</div>
                    <div class="showing-info">Showing ${currentPageCount} of ${totalTransactions}</div>
                </div>

                <button class="pagination-btn next-btn"
                        onclick="transactionsManager.goToNextPage()"
                        ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                    <i data-lucide="chevron-right"></i>
                </button>
            </div>
        `;

        // Show pagination
        paginationContainer.style.display = 'block';

        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        console.log(`✅ Pagination rendered: Page ${this.currentPage} of ${this.totalPages} (showing ${currentPageCount} of ${totalTransactions})`);
    }

    /**
     * ✅ NEW: Hide pagination when not needed
     */
    hidePagination() {
        const paginationContainer = document.getElementById('transactions-pagination');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }

    /**
     * ✅ NEW: Go to previous page
     */
    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTransactions();
            console.log(`📄 Navigated to previous page: ${this.currentPage}`);
        }
    }

    /**
     * ✅ NEW: Go to next page
     */
    goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderTransactions();
            console.log(`📄 Navigated to next page: ${this.currentPage}`);
        }
    }

    /**
     * ✅ FIXED: Get modern empty state HTML with working clear filters button
     */
    getEmptyStateHTML() {
        const hasFilters = this.getActiveFiltersCount() > 0;

        if (hasFilters) {
            // When filters are applied but no results - SIMPLIFIED VERSION WITHOUT FILTER TAGS
            const totalTransactions = this.transactions.length;

            return `
                <div class="modern-empty-state filtered-state">
                    <!-- Animated Search Icon with Particles -->
                    <div class="empty-icon-container">
                        <div class="search-icon-wrapper">
                            <div class="search-particles">
                                <div class="particle particle-1"></div>
                                <div class="particle particle-2"></div>
                                <div class="particle particle-3"></div>
                                <div class="particle particle-4"></div>
                            </div>
                            <div class="search-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Modern Content Section -->
                    <div class="empty-content">
                        <div class="empty-title">
                            <span class="title-gradient">No matching transactions</span>
                        </div>
                        <div class="empty-subtitle">
                            Found <span class="highlight-number">0</span> of <span class="highlight-number">${totalTransactions}</span> transactions
                        </div>
                        <div class="empty-description">
                            Your search criteria didn't match any transactions. Try adjusting your filters or clear them to explore all your data.
                        </div>

                        <!-- Simple Action Buttons WITHOUT FILTER TAGS -->
                        <div class="empty-actions">
                            <button class="modern-btn secondary-btn" onclick="window.transactionsManager?.clearFilters?.() || (console.log('clearFilters called'))">
                                <span class="btn-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                        <line x1="10" y1="11" x2="10" y2="17"/>
                                        <line x1="14" y1="11" x2="14" y2="17"/>
                                    </svg>
                                </span>
                                <span class="btn-text">Clear All Filters</span>
                                <div class="btn-glow"></div>
                            </button>
                        </div>
                    </div>

                    <!-- Decorative Elements -->
                    <div class="bg-decoration">
                        <div class="floating-shape shape-1"></div>
                        <div class="floating-shape shape-2"></div>
                        <div class="floating-shape shape-3"></div>
                    </div>
                </div>
            `;
        } else {
            // When no transactions exist at all - WORKING VERSION
            return `
                <div class="modern-empty-state welcome-state">
                    <!-- Animated Credit Card Icon -->
                    <div class="empty-icon-container">
                        <div class="card-icon-wrapper">
                            <div class="card-glow"></div>
                            <div class="credit-card">
                                <div class="card-chip"></div>
                                <div class="card-stripe"></div>
                                <div class="card-number">
                                    <span></span><span></span><span></span><span></span>
                                </div>
                                <div class="card-pulse"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Modern Welcome Content -->
                    <div class="empty-content">
                        <div class="empty-title">
                            <span class="title-gradient">Start Your Financial Journey</span>
                        </div>
                        <div class="empty-subtitle">
                            No transactions yet
                        </div>
                        <div class="empty-description">
                            Begin tracking your income and expenses to gain valuable insights into your spending habits and financial health.
                        </div>

                        <!-- Feature Highlights -->
                        <div class="feature-highlights">
                            <div class="feature-item">
                                <div class="feature-icon">📊</div>
                                <div class="feature-text">Track spending patterns</div>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">🎯</div>
                                <div class="feature-text">Set budget goals</div>
                            </div>
                            <div class="feature-item">
                                <div class="feature-icon">📈</div>
                                <div class="feature-text">Analyze trends</div>
                            </div>
                        </div>

                        <!-- Modern CTA Button -->
                        <div class="empty-actions">
                            <button class="modern-btn hero-btn" onclick="window.transactionsManager?.openTransactionModal?.() || (console.log('openTransactionModal called'))">
                                <span class="btn-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19"/>
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                </span>
                                <span class="btn-text">Add Your First Transaction</span>
                                <div class="btn-glow"></div>
                                <div class="btn-sparkles">
                                    <div class="sparkle sparkle-1"></div>
                                    <div class="sparkle sparkle-2"></div>
                                    <div class="sparkle sparkle-3"></div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <!-- Advanced Background Decorations -->
                    <div class="bg-decoration">
                        <div class="floating-shape shape-1"></div>
                        <div class="floating-shape shape-2"></div>
                        <div class="floating-shape shape-3"></div>
                        <div class="floating-shape shape-4"></div>
                        <div class="gradient-orb orb-1"></div>
                        <div class="gradient-orb orb-2"></div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Create HTML for a single transaction with Euro currency + English category names
     */
    createTransactionHTML(transaction) {
        const isIncome = transaction.type === 'INCOME';
        const icon = isIncome ? 'trending-up' : 'trending-down';
        const typeClass = isIncome ? 'income' : 'expense';
        const amountPrefix = isIncome ? '+' : '-';
        const formattedDate = this.formatDate(transaction.transactionDate);

        return `
            <div class="transaction-item" data-transaction-id="${transaction.id}">
                <div class="transaction-icon ${typeClass}">
                    <i data-lucide="${icon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${this.escapeHtml(transaction.description)}</div>
                    <div class="transaction-category" style="color: ${transaction.categoryColor || '#6b7280'}">
                        ${this.escapeHtml(this.translateCategoryName(transaction.categoryName))}
                    </div>
                </div>
                <div class="transaction-meta">
                    <div class="transaction-amount ${typeClass}">
                        ${amountPrefix}€${transaction.amount}
                    </div>
                    <div class="transaction-date">${formattedDate}</div>
                </div>
                <div class="transaction-actions">
                    <button class="action-btn edit-btn" onclick="transactionsManager.editTransaction(${transaction.id})" title="Edit Transaction">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="transactionsManager.deleteTransaction(${transaction.id})" title="Delete Transaction">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * ✅ ENHANCED: Toggle filter panel with improved reliability
     */
    toggleFilterPanel() {
        console.log('🔍 Toggle filter panel called');

        const existingPanel = document.getElementById('transaction-filter-panel');

        if (existingPanel) {
            if (existingPanel.classList.contains('active')) {
                console.log('🔍 Closing existing active panel');
                this.closeFilterPanel();
            } else {
                console.log('🔍 Showing existing inactive panel');
                existingPanel.classList.add('active');
            }
        } else {
            console.log('🔍 Creating new filter panel');
            this.showFilterPanel();
        }
    }

    /**
     * ✅ ENHANCED: Show filter panel with robust error handling
     */
    showFilterPanel() {
        try {
            console.log('🔍 Starting to show filter panel...');

            // Remove any existing panels to prevent conflicts
            const existingPanels = document.querySelectorAll('#transaction-filter-panel');
            existingPanels.forEach(panel => {
                console.log('🗑️ Removing existing panel');
                panel.remove();
            });

            // Small delay to ensure DOM cleanup
            setTimeout(() => {
                this.createAndShowFilterPanel();
            }, 50);

        } catch (error) {
            console.error('❌ Error showing filter panel:', error);
            this.showToast('Failed to open filter panel. Please try again.', 'error');
        }
    }

    /**
     * ✅ NEW: Create and show filter panel
     */
    createAndShowFilterPanel() {
        try {
            console.log('🏗️ Creating filter panel...');

            // Create filter panel
            const filterPanel = document.createElement('div');
            filterPanel.id = 'transaction-filter-panel';
            filterPanel.className = 'filter-panel';

            filterPanel.innerHTML = `
                <div class="filter-panel-content">
                    <div class="filter-header">
                        <h3>Filter Transactions</h3>
                        <button class="filter-close" onclick="transactionsManager.closeFilterPanel()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>

                    <div class="filter-body">
                        <!-- Transaction Type Filter -->
                        <div class="filter-group">
                            <label class="filter-label">Transaction Type</label>
                            <select id="filter-transaction-type" class="filter-select">
                                <option value="all">All Types</option>
                                <option value="INCOME">Income Only</option>
                                <option value="EXPENSE">Expenses Only</option>
                            </select>
                        </div>

                        <!-- Time Period Filter -->
                        <div class="filter-group">
                            <label class="filter-label">Time Period</label>
                            <select id="filter-period" class="filter-select">
                                <option value="all">All Time</option>
                                <option value="this-month">Current Month</option>
                                <option value="last-month">Previous Month</option>
                                <option value="this-quarter">Current Quarter</option>
                                <option value="this-year">Current Year</option>
                                <option value="last-90-days">Last 3 Months</option>
                                <option value="last-180-days">Last 6 Months</option>
                                <option value="custom">Custom Date Range</option>
                            </select>
                        </div>

                        <!-- Custom Date Range -->
                        <div class="filter-group" id="custom-date-range" style="display: none;">
                            <label class="filter-label">Date Range</label>
                            <div class="date-range">
                                <input type="date" id="filter-start-date" class="filter-input">
                                <span>to</span>
                                <input type="date" id="filter-end-date" class="filter-input">
                            </div>
                        </div>

                        <!-- Category Filter with Enhanced Styling -->
                        <div class="filter-group">
                            <label class="filter-label">Category</label>
                            <select id="filter-transaction-category" class="filter-select elegant-category-dropdown">
                                <option value="all">All Categories</option>
                                ${this.categories.map(cat =>
                                    `<option value="${cat.id}" style="color: ${cat.color || '#6366f1'}">${this.translateCategoryName(cat.name)} (${cat.type === 'INCOME' ? 'Income' : 'Expense'})</option>`
                                ).join('')}
                            </select>
                        </div>

                        <!-- Amount Range Filter -->
                        <div class="filter-group">
                            <label class="filter-label">Amount Range</label>
                            <select id="filter-amount" class="filter-select">
                                <option value="all">All Amounts</option>
                                <option value="micro">Micro (≤ €20)</option>
                                <option value="small">Small (€20 - €100)</option>
                                <option value="medium">Medium (€100 - €500)</option>
                                <option value="large">Large (€500 - €2,000)</option>
                                <option value="very-large">Very Large (€2,000 - €10,000)</option>
                                <option value="huge">Huge (> €10,000)</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        <!-- Custom Amount Range -->
                        <div class="filter-group" id="custom-amount-range" style="display: none;">
                            <label class="filter-label">Amount Range (€)</label>
                            <div class="date-range">
                                <input type="number" id="filter-min-amount" class="filter-input" placeholder="Min" step="0.01" min="0">
                                <span>to</span>
                                <input type="number" id="filter-max-amount" class="filter-input" placeholder="Max" step="0.01" min="0">
                            </div>
                        </div>

                        <!-- Sort Order -->
                        <div class="filter-group">
                            <label class="filter-label">Sort By</label>
                            <select id="filter-sort" class="filter-select">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="amount_high">Highest Amount</option>
                                <option value="amount_low">Lowest Amount</option>
                                <option value="alphabetical">Alphabetical</option>
                                <option value="category">By Category</option>
                            </select>
                        </div>

                        <!-- Search Filter -->
                        <div class="filter-group">
                            <label class="filter-label">Search</label>
                            <input type="text" id="filter-search" class="filter-input international-input"
                                   placeholder="Search descriptions or categories...">
                        </div>
                    </div>

                    <div class="filter-actions">
                        <button class="btn btn-secondary" onclick="transactionsManager.clearFilters()">Clear All</button>
                        <button class="btn btn-primary" onclick="transactionsManager.applyFilters()">Apply Filters</button>
                    </div>
                </div>
            `;

            // Add to page
            document.body.appendChild(filterPanel);
            console.log('✅ Filter panel added to DOM');

            // Setup event listeners for conditional filters
            this.setupFilterEventHandlers();

            // Set current filter values
            this.populateFilterPanel();

            // Show panel with small delay for smooth animation
            setTimeout(() => {
                filterPanel.classList.add('active');
                console.log('✅ Filter panel activated');
            }, 10);

            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            console.log('🎉 Enhanced filter panel opened successfully');

        } catch (error) {
            console.error('❌ Error creating filter panel:', error);
            this.showToast('Failed to create filter panel. Please refresh and try again.', 'error');
        }
    }

    /**
     * ✅ ENHANCED: Setup event handlers for filter panel with forced scrollable dropdown
     */
    setupFilterEventHandlers() {
        // Period change handler
        const filterPeriod = document.getElementById('filter-period');
        if (filterPeriod) {
            filterPeriod.addEventListener('change', (e) => {
                const customDateRange = document.getElementById('custom-date-range');
                if (customDateRange) {
                    customDateRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
                }
            });
        }

        // Amount change handler
        const filterAmount = document.getElementById('filter-amount');
        if (filterAmount) {
            filterAmount.addEventListener('change', (e) => {
                const customAmountRange = document.getElementById('custom-amount-range');
                if (customAmountRange) {
                    customAmountRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
                }
            });
        }

        // ✅ ENHANCED: Force category dropdown to show exactly 5 options with scroll
        setTimeout(() => {
            const categoryDropdown = document.getElementById('filter-transaction-category');
            if (categoryDropdown && this.categories.length > 5) {
                // Force the dropdown to behave as a scrollable list
                categoryDropdown.setAttribute('size', '5');
                categoryDropdown.style.height = 'auto';
                categoryDropdown.style.maxHeight = '200px';
                categoryDropdown.style.overflowY = 'auto';
                categoryDropdown.style.scrollBehavior = 'smooth';

                console.log(`✅ Category dropdown forced to show 5 of ${this.categories.length} categories with scroll`);
            }
        }, 100);
    }

    /**
     * ✅ NEW: Populate filter panel with current values
     */
    populateFilterPanel() {
        const filterType = document.getElementById('filter-transaction-type');
        const filterPeriod = document.getElementById('filter-period');
        const filterCategory = document.getElementById('filter-transaction-category');
        const filterAmount = document.getElementById('filter-amount');
        const filterSort = document.getElementById('filter-sort');
        const filterSearch = document.getElementById('filter-search');
        const filterStartDate = document.getElementById('filter-start-date');
        const filterEndDate = document.getElementById('filter-end-date');
        const filterMinAmount = document.getElementById('filter-min-amount');
        const filterMaxAmount = document.getElementById('filter-max-amount');

        if (filterType) filterType.value = this.currentFilter.type;
        if (filterPeriod) filterPeriod.value = this.currentFilter.period;
        if (filterCategory) filterCategory.value = this.currentFilter.category;
        if (filterAmount) filterAmount.value = this.currentFilter.amount;
        if (filterSort) filterSort.value = this.currentFilter.sort;
        if (filterSearch) filterSearch.value = this.currentFilter.search;
        if (filterStartDate) filterStartDate.value = this.currentFilter.startDate || '';
        if (filterEndDate) filterEndDate.value = this.currentFilter.endDate || '';
        if (filterMinAmount) filterMinAmount.value = this.currentFilter.minAmount || '';
        if (filterMaxAmount) filterMaxAmount.value = this.currentFilter.maxAmount || '';

        // Show conditional filters if needed
        if (this.currentFilter.period === 'custom') {
            const customDateRange = document.getElementById('custom-date-range');
            if (customDateRange) customDateRange.style.display = 'block';
        }

        if (this.currentFilter.amount === 'custom') {
            const customAmountRange = document.getElementById('custom-amount-range');
            if (customAmountRange) customAmountRange.style.display = 'block';
        }
    }

    /**
     * ✅ NEW: Apply filters from panel
     */
    applyFiltersFromPanel() {
        const filterType = document.getElementById('filter-transaction-type');
        const filterPeriod = document.getElementById('filter-period');
        const filterCategory = document.getElementById('filter-transaction-category');
        const filterAmount = document.getElementById('filter-amount');
        const filterSort = document.getElementById('filter-sort');
        const filterSearch = document.getElementById('filter-search');
        const filterStartDate = document.getElementById('filter-start-date');
        const filterEndDate = document.getElementById('filter-end-date');
        const filterMinAmount = document.getElementById('filter-min-amount');
        const filterMaxAmount = document.getElementById('filter-max-amount');

        this.currentFilter = {
            ...this.currentFilter,
            type: filterType?.value || 'all',
            period: filterPeriod?.value || 'all',
            category: filterCategory?.value || 'all',
            amount: filterAmount?.value || 'all',
            sort: filterSort?.value || 'newest',
            search: filterSearch?.value || '',
            startDate: filterStartDate?.value || null,
            endDate: filterEndDate?.value || null,
            minAmount: filterMinAmount?.value ? parseFloat(filterMinAmount.value) : null,
            maxAmount: filterMaxAmount?.value ? parseFloat(filterMaxAmount.value) : null
        };

        // Reset pagination to page 1 when filters change
        this.currentPage = 1;

        this.applyFiltersAndRender();

        console.log('🔍 Manual filters applied (pagination reset to 1):', this.currentFilter);
    }

    /**
     * ✅ NEW: Apply filters
     */
    applyFilters() {
        // Reset pagination to page 1 when applying filters
        this.currentPage = 1;
        console.log('📄 Reset pagination to page 1 when applying filters');

        this.applyFiltersFromPanel();

        this.closeFilterPanel();

        const activeFilters = this.getActiveFiltersCount();
        if (activeFilters > 0) {
            this.showToast(`Applied ${activeFilters} filter${activeFilters > 1 ? 's' : ''} • Showing ${this.filteredTransactions.length} transactions`, 'success');
        } else {
            this.showToast(`Showing all ${this.filteredTransactions.length} transactions`, 'info');
        }

        console.log(`✅ Applied ${activeFilters} filters, showing ${this.filteredTransactions.length} transactions (pagination reset to 1)`);
    }

    /**
     * ✅ FIXED: Clear all filters - completely working version
     */
    clearFilters() {
        try {
            console.log('🧹 Clearing all filters...');

            // Reset all filter values to defaults
            this.currentFilter = {
                type: 'all',
                period: 'all',
                category: 'all',
                amount: 'all',
                search: '',
                sort: 'newest',
                startDate: null,
                endDate: null,
                minAmount: null,
                maxAmount: null,
                showArchived: false
            };

            // Reset pagination to page 1 when clearing filters
            this.currentPage = 1;
            console.log('📄 Reset pagination to page 1 when clearing filters');

            // Apply the cleared filters and render
            this.applyFiltersAndRender();

            // Update filter panel inputs if open
            const filterPanel = document.getElementById('transaction-filter-panel');
            if (filterPanel && filterPanel.classList.contains('active')) {
                this.populateFilterPanel();
            }

            // Close filter panel if open
            this.closeFilterPanel();

            // Show success message
            this.showToast('All filters cleared successfully', 'success');

            console.log('✅ All filters cleared successfully');

        } catch (error) {
            console.error('❌ Error clearing filters:', error);
            this.showToast('Failed to clear filters. Please try again.', 'error');
        }
    }

    /**
     * ✅ ENHANCED: Close filter panel with improved cleanup
     */
    closeFilterPanel() {
        try {
            console.log('🔍 Closing filter panel...');

            const filterPanel = document.getElementById('transaction-filter-panel');
            if (filterPanel) {
                // Remove active class for animation
                filterPanel.classList.remove('active');

                // Remove panel after animation with cleanup
                setTimeout(() => {
                    if (filterPanel && filterPanel.parentNode) {
                        filterPanel.remove();
                        console.log('✅ Filter panel removed successfully');
                    }
                }, 350); // Slightly longer than CSS transition
            } else {
                console.log('⚠️ No filter panel found to close');
            }
        } catch (error) {
            console.error('❌ Error closing filter panel:', error);
            // Force remove any existing panels
            document.querySelectorAll('#transaction-filter-panel').forEach(panel => panel.remove());
        }
    }

    /**
     * Initialize date inputs with sensible defaults
     */
    initializeDateInputs() {
        const dateInput = document.getElementById('transaction-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Open transaction modal
     */
    openTransactionModal(type = null, transaction = null) {
        const modal = document.getElementById('transaction-modal');
        const form = document.getElementById('transaction-form');
        const title = document.getElementById('modal-title');

        if (!modal || !form) return;

        // Reset form
        form.reset();
        this.clearFormErrors();

        // Set mode
        this.isEditing = !!transaction;
        this.currentTransaction = transaction;

        // Update modal title based on type/mode
        if (title) {
            if (this.isEditing) {
                title.textContent = 'Edit Transaction';
            } else if (type === 'INCOME') {
                title.textContent = 'Add New Income';
            } else if (type === 'EXPENSE') {
                title.textContent = 'Add New Expense';
            } else {
                title.textContent = 'Add New Transaction';
            }
        }

        // Set transaction type
        if (type || (transaction && transaction.type)) {
            this.setTransactionType(type || transaction.type);
        }

        // Populate form if editing
        if (this.isEditing && transaction) {
            this.populateTransactionForm(transaction);
        }

        // Set current date if not editing
        if (!this.isEditing) {
            this.initializeDateInputs();
        }

        // Update categories for current type
        this.populateCategorySelect();

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus first input
        setTimeout(() => {
            const firstInput = form.querySelector('input:not([type="hidden"]), select');
            if (firstInput) firstInput.focus();
        }, 100);

        console.log(`📝 Opened transaction modal: ${this.isEditing ? 'Edit' : 'Create'} mode${type ? ` (${type})` : ''}`);
    }

    /**
     * Populate form with transaction data for editing
     */
    populateTransactionForm(transaction) {
        const elements = {
            'transaction-id': transaction.id,
            'transaction-amount': transaction.amount,
            'transaction-category': transaction.categoryId,
            'transaction-description': transaction.description,
            'transaction-date': transaction.transactionDate
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
    }

    /**
     * Close transaction modal
     */
    closeTransactionModal() {
        const modal = document.getElementById('transaction-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';

            // Reset state
            this.isEditing = false;
            this.currentTransaction = null;

            console.log('❌ Closed transaction modal');
        }
    }

    /**
     * Handle transaction type toggle - ENHANCED with elegant dropdown styling
     */
    handleTransactionTypeToggle(clickedBtn) {
        // Remove active class from all toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        clickedBtn.classList.add('active');

        // Update categories for new type
        this.populateCategorySelect();

        console.log(`🔄 Switched to ${clickedBtn.dataset.type} type with elegant dropdown`);
    }

    /**
     * Set transaction type programmatically - ENHANCED with elegant dropdown styling
     */
    setTransactionType(type) {
        const buttons = document.querySelectorAll('.toggle-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        this.populateCategorySelect();
    }

    /**
     * Handle transaction form submission - ENHANCED WITH BUDGET SIGNAL
     */
    async handleTransactionSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = document.getElementById('submit-transaction-btn');

        try {
            // Validate form
            if (!this.validateTransactionForm(form)) {
                this.showToast('Please correct the errors and try again.', 'error');
                return;
            }

            // Show loading state
            this.setButtonLoading(submitBtn, true);

            // Prepare data
            const formData = new FormData(form);
            const transactionData = this.prepareTransactionData(formData);

            // Submit transaction
            let result;
            if (this.isEditing) {
                result = await this.updateTransaction(this.currentTransaction.id, transactionData);
                this.showToast('Transaction updated successfully!', 'success');

                // Add notification for updated transaction
                this.addNotification({
                    title: 'Transaction Updated',
                    message: `${transactionData.description} - €${transactionData.amount} updated`,
                    type: 'info'
                });
            } else {
                result = await this.createTransaction(transactionData);
                this.showToast('Transaction created successfully!', 'success');

                // Add notification for new transaction
                this.addNotification({
                    title: 'New Transaction Added',
                    message: `${transactionData.type.toLowerCase()} of €${transactionData.amount} added successfully`,
                    type: 'success'
                });
            }

            // Signal budget update to other tabs
            if (transactionData.type === 'EXPENSE') {
                this.signalBudgetUpdate();
            }

            // Refresh all data including summary cards
            await this.refreshAllData();
            this.closeTransactionModal();

            console.log(`✅ Transaction ${this.isEditing ? 'updated' : 'created'} successfully`);

        } catch (error) {
            console.error('❌ Transaction submission failed:', error);
            this.showToast(
                error.message || `Failed to ${this.isEditing ? 'update' : 'create'} transaction. Please try again.`,
                'error'
            );
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    /**
     * Validate transaction form
     */
    validateTransactionForm(form) {
        let isValid = true;
        this.clearFormErrors();

        // Validate amount
        const amount = form.amount.value;
        if (!amount || parseFloat(amount) <= 0) {
            this.showFieldError('amount-error', 'Amount must be greater than 0');
            isValid = false;
        }

        // Validate category
        if (!form.categoryId.value) {
            this.showFieldError('category-error', 'Please select a category');
            isValid = false;
        }

        // Validate description
        if (!form.description.value.trim()) {
            this.showFieldError('description-error', 'Description is required');
            isValid = false;
        }

        // Validate date
        if (!form.transactionDate.value) {
            this.showFieldError('date-error', 'Date is required');
            isValid = false;
        } else {
            const selectedDate = new Date(form.transactionDate.value);
            const today = new Date();
            if (selectedDate > today) {
                this.showFieldError('date-error', 'Date cannot be in the future');
                isValid = false;
            }
        }

        return isValid;
    }

    /**
     * Prepare transaction data for API
     */
    prepareTransactionData(formData) {
        const activeToggle = document.querySelector('.toggle-btn.active');

        return {
            amount: parseFloat(formData.get('amount')),
            categoryId: parseInt(formData.get('categoryId')),
            description: formData.get('description').trim(),
            type: activeToggle.dataset.type,
            transactionDate: formData.get('transactionDate')
        };
    }

    /**
     * Create new transaction
     */
    async createTransaction(transactionData) {
        return await this.fetchAPI('/transactions', 'POST', transactionData);
    }

    /**
     * Update existing transaction
     */
    async updateTransaction(id, transactionData) {
        return await this.fetchAPI(`/transactions/${id}`, 'PUT', transactionData);
    }

    /**
     * Edit transaction
     */
    async editTransaction(transactionId) {
        try {
            const transaction = await this.fetchAPI(`/transactions/${transactionId}`);
            this.openTransactionModal(null, transaction);
        } catch (error) {
            console.error('❌ Failed to load transaction for editing:', error);
            this.showToast('Failed to load transaction details. Please try again.', 'error');
        }
    }

    /**
     * Delete transaction
     */
    deleteTransaction(transactionId) {
        const transaction = this.transactions.find(t => t.id == transactionId);
        if (!transaction) {
            this.showToast('Transaction not found.', 'error');
            return;
        }

        // Show delete confirmation
        this.showDeleteConfirmation(transaction);
    }

    /**
     * Show delete confirmation modal with Euro currency
     */
    showDeleteConfirmation(transaction) {
        const modal = document.getElementById('delete-confirmation-modal');
        const preview = document.getElementById('delete-transaction-preview');

        if (!modal || !preview) return;

        // Store transaction for deletion
        this.currentTransaction = transaction;

        // Update preview
        const isIncome = transaction.type === 'INCOME';
        const amountClass = isIncome ? 'income' : 'expense';
        const amountPrefix = isIncome ? '+' : '-';

        preview.innerHTML = `
            <div class="transaction-summary">
                <div class="summary-amount ${amountClass}">
                    ${amountPrefix}€${transaction.amount}
                </div>
                <div class="summary-description">${this.escapeHtml(transaction.description)}</div>
                <div class="summary-category">${this.escapeHtml(this.translateCategoryName(transaction.categoryName))}</div>
                <div class="summary-date">${this.formatDate(transaction.transactionDate)}</div>
            </div>
        `;

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        console.log(`🗑️ Showing delete confirmation for transaction ${transaction.id}`);
    }

    /**
     * Confirm transaction deletion - ENHANCED WITH BUDGET SIGNAL
     */
    async confirmDeleteTransaction() {
        if (!this.currentTransaction) return;

        const deleteBtn = document.getElementById('confirm-delete-btn');

        try {
            this.setButtonLoading(deleteBtn, true);

            // Store transaction type before deletion
            const transactionType = this.currentTransaction.type;

            await this.fetchAPI(`/transactions/${this.currentTransaction.id}`, 'DELETE');

            this.showToast('Transaction deleted successfully!', 'success');

            // Add notification for deleted transaction
            this.addNotification({
                title: 'Transaction Deleted',
                message: `${this.currentTransaction.description} has been removed`,
                type: 'warning'
            });

            // Signal budget update to other tabs
            if (transactionType === 'EXPENSE') {
                this.signalBudgetUpdate();
            }

            // Refresh all data including summary cards
            await this.refreshAllData();
            this.closeDeleteModal();

            console.log(`✅ Transaction ${this.currentTransaction.id} deleted successfully`);

        } catch (error) {
            console.error('❌ Failed to delete transaction:', error);
            this.showToast('Failed to delete transaction. Please try again.', 'error');
        } finally {
            this.setButtonLoading(deleteBtn, false);
        }
    }

    /**
     * Close delete confirmation modal
     */
    closeDeleteModal() {
        const modal = document.getElementById('delete-confirmation-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.currentTransaction = null;
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        this.closeTransactionModal();
        this.closeDeleteModal();
    }

    /**
     * Show all transactions (remove filters) and apply
     */
    showAllTransactions() {
        this.currentFilter = {
            type: 'all',
            period: 'all',
            category: 'all',
            amount: 'all',
            search: '',
            sort: 'newest',
            startDate: null,
            endDate: null,
            minAmount: null,
            maxAmount: null,
            showArchived: false
        };
        this.currentPage = 1;
        this.applyFiltersAndRender();
        this.showToast('Showing all transactions', 'info');
    }

    /**
     * ✅ ENHANCED: Initialize notifications with localStorage persistence and cleanup
     */
    async initializeNotifications() {
        try {
            // Clean up old notifications from localStorage on startup
            this.cleanupOldNotifications();

            await this.loadNotifications();
            this.updateNotificationBadge();

            // Setup automatic notification time updates every 15 minutes
            this.setupNotificationRefreshTimer();

            console.log('✅ Notifications initialized with localStorage persistence and auto-refresh');
        } catch (error) {
            console.error('❌ Failed to initialize notifications:', error);
        }
    }

    /**
     * ✅ NEW: Clean up old notifications from localStorage
     */
    cleanupOldNotifications() {
        try {
            const notifications = JSON.parse(localStorage.getItem('transactionNotifications') || '[]');
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Filter out notifications older than 1 day
            const cleaned = notifications.filter(notification => {
                if (notification.timestamp) {
                    const notificationTime = new Date(notification.timestamp);
                    return notificationTime > oneDayAgo;
                }
                return false;
            });

            // Save cleaned notifications back to localStorage
            if (cleaned.length !== notifications.length) {
                localStorage.setItem('transactionNotifications', JSON.stringify(cleaned));
                console.log(`🧹 Cleaned ${notifications.length - cleaned.length} old notifications from localStorage`);
            }

        } catch (error) {
            console.error('❌ Error cleaning old notifications:', error);
        }
    }

    /**
     * ✅ FIXED: Setup automatic notification refresh with read state preservation
     */
    setupNotificationRefreshTimer() {
        // Clear any existing timer
        if (this.notificationTimer) {
            clearInterval(this.notificationTimer);
        }

        // Update notification times every 15 minutes
        this.notificationTimer = setInterval(() => {
            console.log('⏰ Auto-updating notification timestamps');

            // Reload notifications preserving read states
            this.loadNotifications().then(() => {
                this.updateNotificationBadge();

                // Update display if notifications panel is open
                const panel = document.getElementById('notifications-panel');
                if (panel && panel.classList.contains('active')) {
                    this.renderNotifications();
                    console.log('🔔 Auto-refreshed notifications display');
                }
            });
        }, 15 * 60 * 1000); // 15 minutes in milliseconds

        console.log('⏰ Notification refresh timer setup (15 minutes interval)');
    }

    /**
     * ✅ COMPLETELY FIXED: Toggle notifications panel - always works
     */
    async toggleNotifications() {
        console.log('🔔 Toggle notifications called');

        const panel = document.getElementById('notifications-panel');
        if (!panel) {
            console.warn('⚠️ Notifications panel not found');
            return;
        }

        if (panel.classList.contains('active')) {
            console.log('🔔 Closing notifications panel');
            this.closeNotificationsPanel();
        } else {
            console.log('🔔 Opening notifications panel');
            await this.showNotificationsPanel();
        }
    }

    /**
     * ✅ COMPLETELY FIXED: Show notifications panel - guaranteed to work every time
     */
    async showNotificationsPanel() {
        try {
            console.log('🔔 Starting to show notifications panel...');

            const panel = document.getElementById('notifications-panel');
            if (!panel) {
                console.error('❌ Notifications panel not found in DOM');
                return;
            }

            // Force load fresh notifications every time
            console.log('🔔 Force loading fresh notifications...');
            await this.loadNotifications();

            console.log('🔔 Notifications loaded:', this.notifications.length);

            // Force render notifications
            console.log('🔔 Force rendering notifications...');
            this.renderNotifications();

            // Show panel with delay to ensure rendering
            setTimeout(() => {
                panel.classList.add('active');
                console.log('✅ Notifications panel opened successfully');
            }, 50);

        } catch (error) {
            console.error('❌ Failed to show notifications panel:', error);
            this.showToast('Failed to load notifications', 'error');
        }
    }

    /**
     * Close notifications panel
     */
    closeNotificationsPanel() {
        const panel = document.getElementById('notifications-panel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    /**
     * ✅ COMPLETELY REWRITTEN: Load notifications with proper read state persistence
     */
    async loadNotifications() {
        try {
            console.log('🔔 Loading notifications with proper state persistence...');

            // Load the persistent read states from storage first
            const readStates = this.loadReadStates();
            console.log('🔔 Loaded read states:', Object.keys(readStates).length);

            // Generate fresh notifications
            this.notifications = await this.generateTransactionNotifications();

            // Apply saved read states to all notifications
            this.notifications.forEach(notification => {
                if (notification.persistentId && readStates[notification.persistentId]) {
                    notification.isRead = true;
                    console.log(`🔔 Applied read state to: ${notification.persistentId}`);
                }
            });

            // Filter out notifications older than 1 day and sort by time
            this.notifications = this.filterAndSortNotifications(this.notifications);

            console.log('✅ Notifications loaded with states applied:', this.notifications.length);
        } catch (error) {
            console.error('❌ Failed to load notifications:', error);
            this.notifications = [];
        }
    }

    /**
     * ✅ NEW: Load persistent read states from dedicated storage
     */
    loadReadStates() {
        try {
            const readStates = JSON.parse(localStorage.getItem('notificationReadStates') || '{}');

            // Clean old read states (older than 2 days)
            const twoDaysAgo = new Date().getTime() - (2 * 24 * 60 * 60 * 1000);
            const cleanStates = {};

            Object.keys(readStates).forEach(key => {
                if (readStates[key] > twoDaysAgo) {
                    cleanStates[key] = readStates[key];
                }
            });

            // Save cleaned states back
            localStorage.setItem('notificationReadStates', JSON.stringify(cleanStates));

            return cleanStates;
        } catch (error) {
            console.error('❌ Error loading read states:', error);
            return {};
        }
    }

    /**
     * ✅ NEW: Save persistent read state
     */
    saveReadState(persistentId) {
        try {
            const readStates = this.loadReadStates();
            readStates[persistentId] = new Date().getTime();
            localStorage.setItem('notificationReadStates', JSON.stringify(readStates));
            console.log(`💾 Saved read state for: ${persistentId}`);
        } catch (error) {
            console.error('❌ Error saving read state:', error);
        }
    }

    /**
     * ✅ NEW: Filter notifications older than 1 day and sort by recency
     */
    filterAndSortNotifications(notifications) {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Filter out notifications older than 1 day
        let filtered = notifications.filter(notification => {
            if (notification.timestamp) {
                const notificationTime = new Date(notification.timestamp);
                return notificationTime > oneDayAgo;
            }
            return true; // Keep notifications without timestamp for safety
        });

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp) : new Date();
            const timeB = b.timestamp ? new Date(b.timestamp) : new Date();
            return timeB - timeA;
        });

        console.log(`🔔 Filtered ${notifications.length - filtered.length} old notifications, kept ${filtered.length}`);
        return filtered;
    }

    /**
     * ✅ SIMPLIFIED: Generate notifications without complex read state logic
     */
    async generateTransactionNotifications() {
        const notifications = [];
        const now = new Date();

        try {
            // Check for large expenses in current month
            const largeExpenses = this.summaryData.currentMonth.transactions
                .filter(t => t.type === 'EXPENSE' && parseFloat(t.amount) > 100)
                .sort((a, b) => b.amount - a.amount);

            if (largeExpenses.length > 0) {
                const expenseTime = new Date(largeExpenses[0].transactionDate + 'T10:00:00');
                notifications.push({
                    id: Date.now() + 1,
                    persistentId: 'large-expense-' + largeExpenses[0].id,
                    title: 'Large Expense Alert',
                    message: `Large expense of €${largeExpenses[0].amount} recorded for ${this.translateCategoryName(largeExpenses[0].categoryName)}`,
                    type: 'warning',
                    timestamp: expenseTime.toISOString(),
                    isRead: false // Will be updated by loadNotifications
                });
            }

            // Check for daily spending pattern
            if (this.summaryData.today.totalCount > 0) {
                const todayExpenses = this.summaryData.today.transactions
                    .filter(t => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                if (todayExpenses > 50) {
                    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                    notifications.push({
                        id: Date.now() + 2,
                        persistentId: 'daily-spending-' + new Date().toDateString(),
                        title: 'Daily Spending Update',
                        message: `You've spent €${todayExpenses.toFixed(2)} today across ${this.summaryData.today.totalCount} transactions`,
                        type: 'info',
                        timestamp: oneHourAgo.toISOString(),
                        isRead: false // Will be updated by loadNotifications
                    });
                }
            }

            // Monthly progress notification
            if (this.summaryData.currentMonth.totalExpenses > 500) {
                const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
                notifications.push({
                    id: Date.now() + 3,
                    persistentId: 'monthly-summary-' + now.getFullYear() + '-' + (now.getMonth() + 1),
                    title: 'Monthly Spending Summary',
                    message: `This month's expenses: €${this.summaryData.currentMonth.totalExpenses.toFixed(2)} across ${this.summaryData.currentMonth.transactions.filter(t => t.type === 'EXPENSE').length} transactions`,
                    type: 'info',
                    timestamp: twoHoursAgo.toISOString(),
                    isRead: false // Will be updated by loadNotifications
                });
            }

            // Balance warning if negative
            if (this.summaryData.allTime.balance < 0) {
                const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
                notifications.push({
                    id: Date.now() + 4,
                    persistentId: 'low-balance-warning',
                    title: 'Low Balance Alert',
                    message: `Your current balance is €${this.summaryData.allTime.balance.toFixed(2)}. Consider reviewing your expenses.`,
                    type: 'warning',
                    timestamp: thirtyMinutesAgo.toISOString(),
                    isRead: false // Will be updated by loadNotifications
                });
            }

            // Add session notifications (user actions)
            notifications.push(...this.getSessionNotifications());

        } catch (error) {
            console.error('❌ Error generating notifications:', error);
        }

        return notifications;
    }

    /**
     * ✅ FIXED: Get session notifications with localStorage persistence
     */
    getSessionNotifications() {
        // Use localStorage instead of sessionStorage to persist across tab closures
        const sessionNotifications = JSON.parse(localStorage.getItem('transactionNotifications') || '[]');
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Filter out notifications older than 1 day
        const filtered = sessionNotifications.filter(notification => {
            if (notification.timestamp) {
                const notificationTime = new Date(notification.timestamp);
                return notificationTime > oneDayAgo;
            }
            return false; // Remove notifications without proper timestamp
        });

        // Update localStorage to remove old notifications
        if (filtered.length !== sessionNotifications.length) {
            localStorage.setItem('transactionNotifications', JSON.stringify(filtered));
            console.log(`🔔 Cleaned ${sessionNotifications.length - filtered.length} old session notifications`);
        }

        return filtered;
    }

    /**
     * ✅ FIXED: Add notification with localStorage persistence
     */
    addNotification(notification) {
        // Use localStorage instead of sessionStorage to persist across tab closures
        const sessionNotifications = JSON.parse(localStorage.getItem('transactionNotifications') || '[]');

        const newNotification = {
            ...notification,
            id: Date.now(),
            persistentId: notification.persistentId || ('user-action-' + Date.now()),
            timestamp: new Date().toISOString(),
            isRead: false
        };

        sessionNotifications.unshift(newNotification);

        // Keep only last 20 notifications (increased from 10)
        sessionNotifications.splice(20);

        localStorage.setItem('transactionNotifications', JSON.stringify(sessionNotifications));

        // Update UI
        this.updateNotificationBadge();

        console.log('✅ New notification added to localStorage:', newNotification.title);
    }

    /**
     * ✅ ENHANCED: Render notifications with dynamic time updates
     */
    renderNotifications() {
        const container = document.getElementById('notifications-list');

        if (!container) {
            console.warn('⚠️ Notifications list container not found');
            return;
        }

        // Update timestamps for all notifications before rendering
        this.updateNotificationTimestamps();

        // Render notifications
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="no-notifications">
                    <i data-lucide="bell-off"></i>
                    <p>No notifications</p>
                </div>
            `;
        } else {
            container.innerHTML = this.notifications.map(notification => `
                <div class="notification-item ${notification.isRead ? '' : 'unread'}"
                     onclick="transactionsManager.markNotificationAsRead(${notification.id})">
                    <div class="notification-icon ${notification.type}">
                        ${this.getNotificationIcon(notification.type)}
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${this.escapeHtml(notification.title)}</div>
                        <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                        <div class="notification-time">${notification.dynamicTime || 'Just now'}</div>
                    </div>
                </div>
            `).join('');
        }

        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        console.log('✅ Notifications rendered:', this.notifications.length);
    }

    /**
     * ✅ NEW: Update notification timestamps dynamically
     */
    updateNotificationTimestamps() {
        this.notifications.forEach(notification => {
            if (notification.timestamp) {
                notification.dynamicTime = this.getSmartRelativeTime(notification.timestamp);
            }
        });
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
     * ✅ FIXED: Mark notification as read with localStorage persistence
     */
    async markNotificationAsRead(notificationId) {
        try {
            console.log(`🔔 Marking notification ${notificationId} as read`);

            // Find the notification in current array
            const notification = this.notifications.find(n => n.id === notificationId);
            if (!notification) {
                console.warn(`⚠️ Notification ${notificationId} not found`);
                return;
            }

            // Mark as read in current state
            notification.isRead = true;
            console.log(`✅ Local notification ${notificationId} marked as read`);

            // Save to persistent storage if it has a persistent ID
            if (notification.persistentId) {
                this.saveReadState(notification.persistentId);
                console.log(`💾 Persistent read state saved for: ${notification.persistentId}`);
            }

            // Also update localStorage for user action notifications
            const sessionNotifications = JSON.parse(localStorage.getItem('transactionNotifications') || '[]');
            const sessionNotification = sessionNotifications.find(n => n.id === notificationId);
            if (sessionNotification) {
                sessionNotification.isRead = true;
                localStorage.setItem('transactionNotifications', JSON.stringify(sessionNotifications));
                console.log(`✅ localStorage updated for ID: ${notificationId}`);
            }

            // Immediately update UI
            this.updateNotificationBadge();
            this.renderNotifications();

        } catch (error) {
            console.error('❌ Failed to mark notification as read:', error);
        }
    }

    /**
     * ✅ FIXED: Mark all notifications as read with localStorage persistence
     */
    async markAllNotificationsAsRead() {
        try {
            console.log('🔔 Marking all notifications as read');

            // Mark all notifications as read in current state
            this.notifications.forEach(notification => {
                notification.isRead = true;

                // Save persistent read state for each notification
                if (notification.persistentId) {
                    this.saveReadState(notification.persistentId);
                }
            });

            // Update all localStorage notifications
            const sessionNotifications = JSON.parse(localStorage.getItem('transactionNotifications') || '[]');
            sessionNotifications.forEach(notification => {
                notification.isRead = true;
            });
            localStorage.setItem('transactionNotifications', JSON.stringify(sessionNotifications));

            console.log('✅ All notifications marked as read with localStorage persistence');

            this.showToast('All notifications marked as read', 'success');

            // Update UI immediately
            this.updateNotificationBadge();
            this.renderNotifications();

        } catch (error) {
            console.error('❌ Failed to mark all notifications as read:', error);
            this.showToast('Failed to update notifications', 'error');
        }
    }

    /**
     * ✅ NEW: Smart relative time with 15-minute and hourly intervals
     */
    getSmartRelativeTime(timestamp) {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

        // Just now (0-14 minutes)
        if (diffInMinutes < 15) {
            return 'Just now';
        }
        // 15-minute intervals up to 1 hour
        else if (diffInMinutes < 60) {
            const quarterHours = Math.floor(diffInMinutes / 15) * 15;
            return `${quarterHours} minutes ago`;
        }
        // Hourly intervals up to 24 hours
        else if (diffInMinutes < 1440) { // 24 * 60 = 1440 minutes in a day
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        // Should not reach here as notifications older than 1 day are filtered out
        else {
            return '1 day ago';
        }
    }

    /**
     * ✅ DEBUGGING: Enhanced refresh function with detailed logging
     */
    async refreshAllData() {
        try {
            console.log('🔥 DEBUG: refreshAllData started');

            await Promise.all([
                this.loadAllTransactions().then(() => console.log('🔥 DEBUG: loadAllTransactions completed')).catch(err => console.error('🔥 DEBUG: loadAllTransactions failed:', err)),
                this.loadCompleteSummaryData().then(() => console.log('🔥 DEBUG: loadCompleteSummaryData completed')).catch(err => console.error('🔥 DEBUG: loadCompleteSummaryData failed:', err)),
                this.loadNotifications().then(() => console.log('🔥 DEBUG: loadNotifications completed')).catch(err => console.error('🔥 DEBUG: loadNotifications failed:', err))
            ]);

            console.log('🔥 DEBUG: All parallel data loading completed');

            // Apply current filters and render
            console.log('🔥 DEBUG: Starting applyFiltersAndRender');
            this.applyFiltersAndRender();
            console.log('🔥 DEBUG: applyFiltersAndRender completed');

            console.log('🔥 DEBUG: Starting updateNotificationBadge');
            this.updateNotificationBadge();
            console.log('🔥 DEBUG: updateNotificationBadge completed');

            console.log('✅ All data refreshed successfully');
        } catch (error) {
            console.error('🔥 DEBUG: Error in refreshAllData:', error);
            // Don't show toast here as it might conflict with deletion success message
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const loadingState = document.getElementById('loading-state');
        const transactionsList = document.getElementById('transactions-list');
        const emptyState = document.getElementById('empty-state');

        if (loadingState) loadingState.style.display = 'flex';
        if (transactionsList) transactionsList.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loadingState = document.getElementById('loading-state');
        const transactionsList = document.getElementById('transactions-list');

        if (loadingState) loadingState.style.display = 'none';
        if (transactionsList) transactionsList.style.display = 'block';
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
     * Update element content safely
     */
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
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
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
            <button class="toast-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto hide
        setTimeout(() => this.hideToast(toast), type === 'error' ? 5000 : 3000);

        // Close button
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
     * ✅ ENHANCED: Generic API fetch function with better error handling for deletion
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

        try {
            console.log(`🌐 Making ${method} request to: ${url}`);
            const response = await fetch(url, options);

            // Handle different response types
            if (!response.ok) {
                let errorMessage = `Request failed with status ${response.status}`;

                // Special handling for DELETE requests
                if (method === 'DELETE' && response.status === 404) {
                    console.log('ℹ️ DELETE 404: Resource already deleted, treating as success');
                    return { success: true, message: 'Resource deleted' };
                }

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // If JSON parsing fails, use status text
                    errorMessage = response.statusText || errorMessage;
                }

                console.warn(`⚠️ API Error: ${errorMessage}`);
                throw new Error(errorMessage);
            }

            // Handle different content types
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                console.log(`✅ ${method} request successful:`, result);
                return result;
            } else {
                const result = await response.text();
                console.log(`✅ ${method} request successful (text):`, result);
                return result;
            }

        } catch (error) {
            // Network or other errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                const networkError = new Error('Network error. Please check your connection and try again.');
                console.error('❌ Network error:', networkError.message);
                throw networkError;
            }
            console.error(`❌ API Error for ${method} ${url}:`, error.message);
            throw error;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Make instance globally available for onclick handlers
    window.transactionsManager = new TransactionsManager();
});