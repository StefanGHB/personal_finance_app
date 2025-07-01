/**
 * Transactions Page JavaScript - FIXED NEWEST FIRST SORTING
 * Complete transaction management with newest transactions always appearing first
 * ✅ COMPLETELY FIXED: New transactions appear at the top of page 1
 * ✅ GUARANTEED: Newest transactions are always shown first
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

        // Enhanced filter system
        this.currentFilter = {
            type: 'all',
            period: 'all',
            category: 'all',
            amount: 'all',
            search: '',
            sort: 'newest', // Always default to newest first
            startDate: null,
            endDate: null,
            minAmount: null,
            maxAmount: null,
            showArchived: false
        };

        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
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

            // Apply initial filters and render (will sort newest first)
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

            // Refresh notifications on window focus preserving localStorage data
            console.log('🔔 Refreshing notifications on window focus with localStorage persistence');
            this.cleanupOldNotifications();
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

            // Listen for notification updates from other tabs
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
     * Setup all event listeners with working pagination
     */
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');

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

        // Global click handler for pagination and other interactions
        document.addEventListener('click', (e) => {
            // Handle pagination buttons
            if (e.target.closest('.pagination-btn')) {
                const button = e.target.closest('.pagination-btn');
                this.handlePaginationClick(e, button);
                return;
            }

            // Handle modal overlays
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }

            // Close notifications panel when clicking outside
            if (!e.target.closest('.notifications-dropdown')) {
                this.closeNotificationsPanel();
            }
        });

        // Keyboard shortcuts
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

        console.log('✅ All event listeners setup completed');
    }

    /**
     * Handle pagination button clicks
     */
    handlePaginationClick(event, button) {
        console.log('📄 Pagination click handler called');

        // Prevent all default behaviors
        event.preventDefault();
        event.stopImmediatePropagation();

        // Check if button is disabled
        if (button.disabled || button.classList.contains('disabled')) {
            console.log('🚫 Pagination button is disabled, ignoring click');
            return;
        }

        // Determine button type and execute action
        if (button.classList.contains('prev-btn')) {
            console.log('⬅️ Previous button clicked');
            this.goToPreviousPage();
        } else if (button.classList.contains('next-btn')) {
            console.log('➡️ Next button clicked');
            this.goToNextPage();
        }
    }

    /**
     * Setup filter event listeners
     */
    setupFilterEventListeners() {
        // Filter button
        const filterButton = document.getElementById('transaction-filter');
        if (filterButton) {
            filterButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFilterPanel();
            });
        }

        // Global event listeners for filter panel
        document.addEventListener('click', (e) => {
            const filterPanel = e.target.closest('.filter-panel');
            const filterButton = e.target.closest('#transaction-filter');

            // Only close if clicking outside both panel and button
            if (!filterPanel && !filterButton) {
                const activePanel = document.getElementById('transaction-filter-panel');
                if (activePanel && activePanel.classList.contains('active')) {
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
                        this.toggleFilterPanel();
                        break;
                }
            }

            if (e.key === 'Escape') {
                const activePanel = document.getElementById('transaction-filter-panel');
                if (activePanel && activePanel.classList.contains('active')) {
                    this.closeFilterPanel();
                }
            }
        });
    }

    /**
     * Normalize search terms with proper Bulgarian support
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
     * Enhanced function to check if text contains search term
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
    addEventListeners(listeners) {
        listeners.forEach(([id, event, handler]) => {
            const element = document.getElementById(id);
            if (element) {
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
     * Populate category select options with English translations
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

        // Apply elegant dropdown styling for transaction modal
        this.applyElegantDropdownStyling(categorySelect, filteredCategories.length);
    }

    /**
     * Apply elegant dropdown styling to category selects
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
     * ✅ FIXED: Load all transactions with GUARANTEED newest first sorting
     */
    async loadAllTransactions() {
        try {
            console.log('📥 Loading all transactions from API...');

            let transactions = await this.fetchAPI('/transactions');
            console.log('📥 Received transactions from API:', transactions.length);

            // ✅ GUARANTEED: Sort transactions newest first IMMEDIATELY
            console.log('🔄 Sorting transactions newest first...');

            transactions = this.sortTransactionsNewestFirst(transactions);

            this.transactions = transactions;

            // Verify the sorting worked
            this.verifyTransactionSorting();

        } catch (error) {
            console.error('❌ Failed to load transactions:', error);
            this.transactions = [];
            this.showToast('Failed to load transactions. Please check your connection and try again.', 'error');
        }
    }

    /**
     * ✅ GUARANTEED: Sort transactions newest first (most recent dates at the top)
     */
    sortTransactionsNewestFirst(transactions) {
        return transactions.sort((a, b) => {
            // Create date objects
            const dateA = new Date(a.transactionDate);
            const dateB = new Date(b.transactionDate);

            // Sort newest first (higher timestamp = more recent = should come first)
            const result = dateB.getTime() - dateA.getTime();

            // If dates are the same, sort by ID descending (newest created first)
            if (result === 0) {
                return parseInt(b.id) - parseInt(a.id);
            }

            return result;
        });
    }

    /**
     * ✅ Verify that transactions are properly sorted newest first
     */
    verifyTransactionSorting() {
        if (this.transactions.length === 0) {
            console.log('📊 No transactions to verify');
            return;
        }

        console.log('🔍 Verifying transaction sorting...');

        // Show first 5 transactions
        console.log('📊 First 5 transactions (should be newest):');
        this.transactions.slice(0, 5).forEach((t, index) => {
            const date = new Date(t.transactionDate);
            console.log(`  ${index + 1}. ${t.description} - ${t.transactionDate} (${date.toLocaleDateString()})`);
        });

        // Verify sorting is correct
        for (let i = 0; i < this.transactions.length - 1; i++) {
            const currentDate = new Date(this.transactions[i].transactionDate);
            const nextDate = new Date(this.transactions[i + 1].transactionDate);

            if (currentDate.getTime() < nextDate.getTime()) {
                console.error('❌ SORTING ERROR: Found newer transaction after older one at index', i);
                console.error(`❌ Current: ${this.transactions[i].description} - ${this.transactions[i].transactionDate}`);
                console.error(`❌ Next: ${this.transactions[i + 1].description} - ${this.transactions[i + 1].transactionDate}`);
                break;
            }
        }

        console.log('✅ Transaction sorting verification complete');
    }

    /**
     * ✅ FIXED: Apply filters and render with guaranteed newest first sorting
     */
    applyFiltersAndRender() {
        console.log('🔍 Applying filters and rendering...');

        // Start with all transactions (already sorted newest first)
        let filtered = [...this.transactions];
        console.log('🔍 Starting with transactions:', filtered.length);

        // Apply TYPE filter
        if (this.currentFilter.type !== 'all') {
            filtered = filtered.filter(t => t.type === this.currentFilter.type);
            console.log(`After type filter (${this.currentFilter.type}):`, filtered.length);
        }

        // Apply PERIOD filter
        if (this.currentFilter.period !== 'all') {
            filtered = this.applyPeriodFilter(filtered);
            console.log(`After period filter (${this.currentFilter.period}):`, filtered.length);
        }

        // Apply CATEGORY filter
        if (this.currentFilter.category !== 'all') {
            filtered = filtered.filter(t => t.categoryId == this.currentFilter.category);
            console.log(`After category filter (${this.currentFilter.category}):`, filtered.length);
        }

        // Apply AMOUNT filter
        if (this.currentFilter.amount !== 'all') {
            filtered = this.applyAmountFilter(filtered);
            console.log(`After amount filter (${this.currentFilter.amount}):`, filtered.length);
        }

        // Apply SEARCH filter
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

        // ✅ APPLY SORTING: Apply user-selected sort or default to newest first
        filtered = this.applySorting(filtered);

        this.filteredTransactions = filtered;
        console.log('🔍 Final filtered transactions:', this.filteredTransactions.length);

        // Update pagination
        this.updatePagination();

        // Render transactions
        this.renderTransactions();

        // Update filter indicators
        this.updateFilterButtonIndicator();

        console.log('✅ Filters applied and rendering complete');
    }

    /**
     * ✅ Apply sorting to filtered transactions
     */
    applySorting(transactions) {
        console.log(`🔄 Applying sort: ${this.currentFilter.sort}`);

        switch (this.currentFilter.sort) {
            case 'oldest':
                return transactions.sort((a, b) => {
                    const dateA = new Date(a.transactionDate);
                    const dateB = new Date(b.transactionDate);
                    return dateA.getTime() - dateB.getTime(); // Oldest first
                });

            case 'amount_high':
                return transactions.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

            case 'amount_low':
                return transactions.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));

            case 'alphabetical':
                return transactions.sort((a, b) => a.description.localeCompare(b.description));

            case 'category':
                return transactions.sort((a, b) => {
                    const categoryA = this.translateCategoryName(a.categoryName || '');
                    const categoryB = this.translateCategoryName(b.categoryName || '');
                    return categoryA.localeCompare(categoryB);
                });

            case 'newest':
            default:
                // ✅ DEFAULT: Newest first (most recent dates at the top)
                return this.sortTransactionsNewestFirst(transactions);
        }
    }

    /**
     * Apply period filter
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
     * Apply amount filter
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
     * Get active filters count
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
     * Update filter button indicator
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
            this.currentPage = Math.max(1, this.totalPages);
        }
    }

    /**
     * ✅ Get current page transactions (already properly sorted)
     */
    getCurrentPageTransactions() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;

        console.log(`📄 Page ${this.currentPage}: Items ${startIndex + 1}-${Math.min(endIndex, this.filteredTransactions.length)} of ${this.filteredTransactions.length}`);

        const pageTransactions = this.filteredTransactions.slice(startIndex, endIndex);

        // Verify that page 1 shows the newest transactions
        if (this.currentPage === 1 && pageTransactions.length > 0) {
            console.log('📄 Page 1 verification - showing newest transactions:');
            pageTransactions.slice(0, 3).forEach((t, index) => {
                const date = new Date(t.transactionDate);
                console.log(`  ${index + 1}. ${t.description} - ${t.transactionDate} (${date.toLocaleDateString()})`);
            });
        }

        return pageTransactions;
    }

    /**
     * Load complete summary data for cards
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

            // Load all data in parallel
            const [allTransactions, currentMonthTransactions, prevMonthTransactions, balanceData] = await Promise.all([
                this.fetchAPI('/transactions').catch(() => []),
                this.fetchAPI(`/transactions/month/${currentYear}/${currentMonth}`).catch(() => []),
                this.fetchAPI(`/transactions/month/${prevYear}/${prevMonth}`).catch(() => []),
                this.fetchAPI('/transactions/balance').catch(() => ({ balance: 0 }))
            ]);

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

            console.log('✅ Complete summary data loaded');

        } catch (error) {
            console.error('❌ Failed to load complete summary data:', error);
            this.showToast('Failed to load summary statistics.', 'warning');
        }
    }

    /**
     * Update all summary cards
     */
    updateAllSummaryCards() {
        try {
            // Card 1: Total Transactions
            this.updateElement('total-transactions', this.summaryData.allTime.totalCount);

            // Card 2: This Month Transactions
            this.updateElement('monthly-transactions', this.summaryData.currentMonth.totalCount);

            // Card 3: Recent Activity (Today)
            this.updateElement('recent-activity', this.summaryData.today.totalCount);

            // Update trend indicators
            this.updateTrendIndicators();

            console.log('✅ All summary cards updated');

        } catch (error) {
            console.error('❌ Error updating summary cards:', error);
        }
    }

    /**
     * Update trend indicators
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

            // Refresh icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

        } catch (error) {
            console.error('❌ Error updating trend indicators:', error);
        }
    }

    /**
     * Render transactions with pagination
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

        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * ✅ Render pagination with working buttons
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
        const currentPageCount = currentEnd - currentStart + 1;

        const prevDisabled = this.currentPage === 1;
        const nextDisabled = this.currentPage === this.totalPages;

        paginationContainer.innerHTML = `
            <div class="pagination-wrapper">
                <button class="pagination-btn prev-btn${prevDisabled ? ' disabled' : ''}"
                        type="button"
                        ${prevDisabled ? 'disabled' : ''}
                        aria-label="Previous page">
                    <i data-lucide="chevron-left"></i>
                </button>

                <div class="pagination-info">
                    <div class="page-info">Page ${this.currentPage} of ${this.totalPages}</div>
                    <div class="showing-info">Showing ${currentPageCount} of ${totalTransactions}</div>
                </div>

                <button class="pagination-btn next-btn${nextDisabled ? ' disabled' : ''}"
                        type="button"
                        ${nextDisabled ? 'disabled' : ''}
                        aria-label="Next page">
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

        console.log(`✅ Pagination rendered - Page ${this.currentPage} of ${this.totalPages}`);
    }

    /**
     * Hide pagination when not needed
     */
    hidePagination() {
        const paginationContainer = document.getElementById('transactions-pagination');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
    }

    /**
     * ✅ Go to previous page
     */
    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            console.log(`📄 Moving to previous page: ${this.currentPage}`);
            this.renderTransactions();
        }
    }

    /**
     * ✅ Go to next page
     */
    goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            console.log(`📄 Moving to next page: ${this.currentPage}`);
            this.renderTransactions();
        }
    }

    /**
     * Get empty state HTML
     */
    getEmptyStateHTML() {
        const hasFilters = this.getActiveFiltersCount() > 0;

        if (hasFilters) {
            // When filters are applied but no results
            const totalTransactions = this.transactions.length;

            return `
                <div class="modern-empty-state filtered-state">
                    <div class="empty-icon-container">
                        <div class="search-icon-wrapper">
                            <div class="search-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

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

                        <div class="empty-actions">
                            <button class="modern-btn secondary-btn" onclick="window.transactionsManager?.clearFilters?.()">
                                <span class="btn-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                        <line x1="10" y1="11" x2="10" y2="17"/>
                                        <line x1="14" y1="11" x2="14" y2="17"/>
                                    </svg>
                                </span>
                                <span class="btn-text">Clear All Filters</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // When no transactions exist at all
            return `
                <div class="modern-empty-state welcome-state">
                    <div class="empty-icon-container">
                        <div class="card-icon-wrapper">
                            <div class="credit-card">
                                <div class="card-chip"></div>
                                <div class="card-stripe"></div>
                            </div>
                        </div>
                    </div>

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

                        <div class="empty-actions">
                            <button class="modern-btn hero-btn" onclick="window.transactionsManager?.openTransactionModal?.()">
                                <span class="btn-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19"/>
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                </span>
                                <span class="btn-text">Add Your First Transaction</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Create HTML for a single transaction
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
     * Toggle filter panel
     */
    toggleFilterPanel() {
        const existingPanel = document.getElementById('transaction-filter-panel');

        if (existingPanel) {
            if (existingPanel.classList.contains('active')) {
                this.closeFilterPanel();
            } else {
                existingPanel.classList.add('active');
            }
        } else {
            this.showFilterPanel();
        }
    }

    /**
     * Show filter panel
     */
    showFilterPanel() {
        try {
            // Remove any existing panels
            const existingPanels = document.querySelectorAll('#transaction-filter-panel');
            existingPanels.forEach(panel => panel.remove());

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
                        <div class="filter-group">
                            <label class="filter-label">Transaction Type</label>
                            <select id="filter-transaction-type" class="filter-select">
                                <option value="all">All Types</option>
                                <option value="INCOME">Income Only</option>
                                <option value="EXPENSE">Expenses Only</option>
                            </select>
                        </div>

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

                        <div class="filter-group" id="custom-amount-range" style="display: none;">
                            <label class="filter-label">Amount Range (€)</label>
                            <div class="date-range">
                                <input type="number" id="filter-min-amount" class="filter-input" placeholder="Min" step="0.01" min="0">
                                <span>to</span>
                                <input type="number" id="filter-max-amount" class="filter-input" placeholder="Max" step="0.01" min="0">
                            </div>
                        </div>

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

            // Setup event listeners for conditional filters
            this.setupFilterEventHandlers();

            // Set current filter values
            this.populateFilterPanel();

            // Show panel
            setTimeout(() => {
                filterPanel.classList.add('active');
            }, 10);

            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

        } catch (error) {
            console.error('❌ Error creating filter panel:', error);
            this.showToast('Failed to create filter panel. Please refresh and try again.', 'error');
        }
    }

    /**
     * Setup filter event handlers with forced scrollable dropdown
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

        // Force category dropdown to show exactly 5 options with scroll
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
     * Populate filter panel with current values
     */
    populateFilterPanel() {
        const elements = {
            'filter-transaction-type': this.currentFilter.type,
            'filter-period': this.currentFilter.period,
            'filter-transaction-category': this.currentFilter.category,
            'filter-amount': this.currentFilter.amount,
            'filter-sort': this.currentFilter.sort,
            'filter-search': this.currentFilter.search,
            'filter-start-date': this.currentFilter.startDate || '',
            'filter-end-date': this.currentFilter.endDate || '',
            'filter-min-amount': this.currentFilter.minAmount || '',
            'filter-max-amount': this.currentFilter.maxAmount || ''
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });

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
     * Apply filters from panel
     */
    applyFilters() {
        // Get values from filter panel
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

        // Update current filter
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

        // ✅ CRITICAL: Reset to page 1 when applying filters
        this.currentPage = 1;

        // Apply filters and render
        this.applyFiltersAndRender();

        // Close filter panel
        this.closeFilterPanel();

        // Show success message
        const activeFilters = this.getActiveFiltersCount();
        if (activeFilters > 0) {
            this.showToast(`Applied ${activeFilters} filter${activeFilters > 1 ? 's' : ''} • Showing ${this.filteredTransactions.length} transactions`, 'success');
        } else {
            this.showToast(`Showing all ${this.filteredTransactions.length} transactions`, 'info');
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        try {
            // Reset all filter values to defaults
            this.currentFilter = {
                type: 'all',
                period: 'all',
                category: 'all',
                amount: 'all',
                search: '',
                sort: 'newest', // Always default to newest first
                startDate: null,
                endDate: null,
                minAmount: null,
                maxAmount: null,
                showArchived: false
            };

            // ✅ CRITICAL: Reset to page 1 when clearing filters
            this.currentPage = 1;

            // Apply the cleared filters and render
            this.applyFiltersAndRender();

            // Update filter panel inputs if open
            const filterPanel = document.getElementById('transaction-filter-panel');
            if (filterPanel && filterPanel.classList.contains('active')) {
                this.populateFilterPanel();
            }

            // Close filter panel
            this.closeFilterPanel();

            // Show success message
            this.showToast('All filters cleared successfully', 'success');

        } catch (error) {
            console.error('❌ Error clearing filters:', error);
            this.showToast('Failed to clear filters. Please try again.', 'error');
        }
    }

    /**
     * Close filter panel
     */
    closeFilterPanel() {
        try {
            const filterPanel = document.getElementById('transaction-filter-panel');
            if (filterPanel) {
                filterPanel.classList.remove('active');
                setTimeout(() => {
                    if (filterPanel && filterPanel.parentNode) {
                        filterPanel.remove();
                    }
                }, 350);
            }
        } catch (error) {
            console.error('❌ Error closing filter panel:', error);
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
     * Handle transaction type toggle
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

        console.log(`🔄 Switched to ${clickedBtn.dataset.type} type`);
    }

    /**
     * Set transaction type programmatically
     */
    setTransactionType(type) {
        const buttons = document.querySelectorAll('.toggle-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        this.populateCategorySelect();
    }

    /**
     * ✅ FIXED: Handle transaction form submission - ALWAYS go to page 1 for new transactions
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

            console.log('💾 Submitting transaction:', transactionData);

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

                // ✅ CRITICAL: For new transactions, ALWAYS go to page 1 to see the newest transaction
                console.log('💾 NEW TRANSACTION: FORCE going to page 1 to show newest transaction');
                this.currentPage = 1;
            }

            // Signal budget update to other tabs
            if (transactionData.type === 'EXPENSE') {
                this.signalBudgetUpdate();
            }

            // ✅ GUARANTEED: Refresh all data (this will reload and re-sort all transactions newest first)
            await this.refreshAllData();
            this.closeTransactionModal();

            console.log('✅ Transaction completed successfully - newest transactions will be shown first');

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
     * Show delete confirmation modal
     */
    showDeleteConfirmation(transaction) {
        const modal = document.getElementById('delete-confirmation-modal');
        const preview = document.getElementById('delete-transaction-preview');

        if (!modal || !preview) {
            console.error('❌ Delete modal elements not found');
            return;
        }

        // Validate transaction data
        if (!transaction || !transaction.id) {
            console.error('❌ Invalid transaction data for deletion:', transaction);
            this.showToast('Invalid transaction data. Cannot delete.', 'error');
            return;
        }

        // Store transaction for deletion
        this.currentTransaction = transaction;

        // Update preview
        const isIncome = transaction.type === 'INCOME';
        const amountClass = isIncome ? 'income' : 'expense';
        const amountPrefix = isIncome ? '+' : '-';
        const categoryName = transaction.categoryName || 'Unknown Category';
        const transactionDate = transaction.transactionDate || 'Unknown Date';

        preview.innerHTML = `
            <div class="transaction-summary">
                <div class="summary-amount ${amountClass}">
                    ${amountPrefix}€${transaction.amount || '0.00'}
                </div>
                <div class="summary-description">${this.escapeHtml(transaction.description || 'No description')}</div>
                <div class="summary-category">${this.escapeHtml(this.translateCategoryName(categoryName))}</div>
                <div class="summary-date">${this.formatDate(transactionDate)}</div>
            </div>
        `;

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        console.log(`🗑️ Showing delete confirmation for transaction ${transaction.id}`);
    }

    /**
     * Confirm transaction deletion
     */
    async confirmDeleteTransaction() {
        if (!this.currentTransaction) {
            console.error('❌ No transaction selected for deletion');
            this.showToast('No transaction selected for deletion.', 'error');
            return;
        }

        const deleteBtn = document.getElementById('confirm-delete-btn');

        try {
            this.setButtonLoading(deleteBtn, true);

            // Store transaction details before deletion
            const transactionId = this.currentTransaction.id;
            const transactionType = this.currentTransaction.type || 'UNKNOWN';
            const transactionDescription = this.currentTransaction.description || 'Unknown transaction';

            console.log(`🗑️ Attempting to delete transaction ${transactionId}`);

            // Make DELETE request
            const result = await this.fetchAPI(`/transactions/${transactionId}`, 'DELETE');

            console.log('✅ Delete API response:', result);

            // Show success message
            this.showToast('Transaction deleted successfully!', 'success');

            // Add notification for deleted transaction
            this.addNotification({
                title: 'Transaction Deleted',
                message: `${transactionDescription} has been removed`,
                type: 'warning'
            });

            // Signal budget update to other tabs if it was an expense
            if (transactionType === 'EXPENSE') {
                this.signalBudgetUpdate();
            }

            // Close modal first
            this.closeDeleteModal();

            // ✅ GUARANTEED: Refresh all data and maintain newest first sorting
            await this.refreshAllData();

            console.log(`✅ Transaction ${transactionId} deleted successfully`);

        } catch (error) {
            console.error('❌ Failed to delete transaction:', error);
            this.showToast(`Failed to delete transaction: ${error.message}`, 'error');
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

            // Clear transaction reference
            if (this.currentTransaction) {
                console.log(`🗑️ Clearing transaction reference for ID: ${this.currentTransaction.id}`);
            }
            this.currentTransaction = null;

            console.log('✅ Delete modal closed and cleaned up');
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
     * Show all transactions (remove filters)
     */
    showAllTransactions() {
        this.currentFilter = {
            type: 'all',
            period: 'all',
            category: 'all',
            amount: 'all',
            search: '',
            sort: 'newest', // Always default to newest first
            startDate: null,
            endDate: null,
            minAmount: null,
            maxAmount: null,
            showArchived: false
        };
        this.currentPage = 1; // Always go to page 1
        this.applyFiltersAndRender();
        this.showToast('Showing all transactions', 'info');
    }

    /**
     * ✅ GUARANTEED: Refresh all data with newest first sorting maintained
     */
    async refreshAllData() {
        try {
            console.log('🔄 Refreshing all data...');
            console.log('🔄 Current page before refresh:', this.currentPage);

            // Load all data in parallel
            await Promise.all([
                this.loadAllTransactions(), // This will sort newest first automatically
                this.loadCompleteSummaryData(),
                this.loadNotifications()
            ]);

            console.log('🔄 All data loaded, applying filters and rendering...');

            // Apply current filters and render (will maintain newest first sorting)
            this.applyFiltersAndRender();

            // Update notification badge
            this.updateNotificationBadge();

            console.log('✅ All data refreshed successfully with newest first sorting maintained');

        } catch (error) {
            console.error('❌ Error in refreshAllData:', error);
            // Don't show toast here as it might conflict with other success messages
        }
    }

    /**
     * Initialize notifications
     */
    async initializeNotifications() {
        try {
            this.cleanupOldNotifications();
            await this.loadNotifications();
            this.updateNotificationBadge();
            this.setupNotificationRefreshTimer();
            console.log('✅ Notifications initialized');
        } catch (error) {
            console.error('❌ Failed to initialize notifications:', error);
        }
    }

    /**
     * Clean up old notifications
     */
    cleanupOldNotifications() {
        try {
            const notifications = JSON.parse(localStorage.getItem('transactionNotifications') || '[]');
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const cleaned = notifications.filter(notification => {
                if (notification.timestamp) {
                    const notificationTime = new Date(notification.timestamp);
                    return notificationTime > oneDayAgo;
                }
                return false;
            });

            if (cleaned.length !== notifications.length) {
                localStorage.setItem('transactionNotifications', JSON.stringify(cleaned));
                console.log(`🧹 Cleaned ${notifications.length - cleaned.length} old notifications`);
            }

        } catch (error) {
            console.error('❌ Error cleaning old notifications:', error);
        }
    }

    /**
     * Setup notification refresh timer
     */
    setupNotificationRefreshTimer() {
        if (this.notificationTimer) {
            clearInterval(this.notificationTimer);
        }

        this.notificationTimer = setInterval(() => {
            this.loadNotifications().then(() => {
                this.updateNotificationBadge();
                const panel = document.getElementById('notifications-panel');
                if (panel && panel.classList.contains('active')) {
                    this.renderNotifications();
                }
            });
        }, 15 * 60 * 1000); // 15 minutes
    }

    /**
     * Toggle notifications panel
     */
    async toggleNotifications() {
        const panel = document.getElementById('notifications-panel');
        if (!panel) return;

        if (panel.classList.contains('active')) {
            this.closeNotificationsPanel();
        } else {
            await this.showNotificationsPanel();
        }
    }

    /**
     * Show notifications panel
     */
    async showNotificationsPanel() {
        try {
            const panel = document.getElementById('notifications-panel');
            if (!panel) return;

            await this.loadNotifications();
            this.renderNotifications();

            setTimeout(() => {
                panel.classList.add('active');
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
     * Load notifications
     */
    async loadNotifications() {
        try {
            const readStates = this.loadReadStates();
            this.notifications = await this.generateTransactionNotifications();

            this.notifications.forEach(notification => {
                if (notification.persistentId && readStates[notification.persistentId]) {
                    notification.isRead = true;
                }
            });

            this.notifications = this.filterAndSortNotifications(this.notifications);

        } catch (error) {
            console.error('❌ Failed to load notifications:', error);
            this.notifications = [];
        }
    }

    /**
     * Load read states
     */
    loadReadStates() {
        try {
            const readStates = JSON.parse(localStorage.getItem('notificationReadStates') || '{}');
            const twoDaysAgo = new Date().getTime() - (2 * 24 * 60 * 60 * 1000);
            const cleanStates = {};

            Object.keys(readStates).forEach(key => {
                if (readStates[key] > twoDaysAgo) {
                    cleanStates[key] = readStates[key];
                }
            });

            localStorage.setItem('notificationReadStates', JSON.stringify(cleanStates));
            return cleanStates;
        } catch (error) {
            console.error('❌ Error loading read states:', error);
            return {};
        }
    }

    /**
     * Save read state
     */
    saveReadState(persistentId) {
        try {
            const readStates = this.loadReadStates();
            readStates[persistentId] = new Date().getTime();
            localStorage.setItem('notificationReadStates', JSON.stringify(readStates));
        } catch (error) {
            console.error('❌ Error saving read state:', error);
        }
    }

    /**
     * Filter and sort notifications
     */
    filterAndSortNotifications(notifications) {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        let filtered = notifications.filter(notification => {
            if (notification.timestamp) {
                const notificationTime = new Date(notification.timestamp);
                return notificationTime > oneDayAgo;
            }
            return true;
        });

        filtered.sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp) : new Date();
            const timeB = b.timestamp ? new Date(b.timestamp) : new Date();
            return timeB - timeA;
        });

        return filtered;
    }

    /**
     * Generate transaction notifications
     */
    async generateTransactionNotifications() {
        const notifications = [];
        const now = new Date();

        try {
            // Check for large expenses
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
                    isRead: false
                });
            }

            // Check for daily spending
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
                        isRead: false
                    });
                }
            }

            // Add session notifications
            notifications.push(...this.getSessionNotifications());

        } catch (error) {
            console.error('❌ Error generating notifications:', error);
        }

        return notifications;
    }

    /**
     * Get session notifications
     */
    getSessionNotifications() {
        const sessionNotifications = JSON.parse(localStorage.getItem('transactionNotifications') || '[]');
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const filtered = sessionNotifications.filter(notification => {
            if (notification.timestamp) {
                const notificationTime = new Date(notification.timestamp);
                return notificationTime > oneDayAgo;
            }
            return false;
        });

        if (filtered.length !== sessionNotifications.length) {
            localStorage.setItem('transactionNotifications', JSON.stringify(filtered));
        }

        return filtered;
    }

    /**
     * Add notification
     */
    addNotification(notification) {
        const sessionNotifications = JSON.parse(localStorage.getItem('transactionNotifications') || '[]');

        const newNotification = {
            ...notification,
            id: Date.now(),
            persistentId: notification.persistentId || ('user-action-' + Date.now()),
            timestamp: new Date().toISOString(),
            isRead: false
        };

        sessionNotifications.unshift(newNotification);
        sessionNotifications.splice(20); // Keep only last 20

        localStorage.setItem('transactionNotifications', JSON.stringify(sessionNotifications));
        this.updateNotificationBadge();
    }

    /**
     * Render notifications
     */
    renderNotifications() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        this.updateNotificationTimestamps();

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

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Update notification timestamps
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
     * Get notification icon
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
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId) {
        try {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (!notification) return;

            notification.isRead = true;

            if (notification.persistentId) {
                this.saveReadState(notification.persistentId);
            }

            const sessionNotifications = JSON.parse(localStorage.getItem('transactionNotifications') || '[]');
            const sessionNotification = sessionNotifications.find(n => n.id === notificationId);
            if (sessionNotification) {
                sessionNotification.isRead = true;
                localStorage.setItem('transactionNotifications', JSON.stringify(sessionNotifications));
            }

            this.updateNotificationBadge();
            this.renderNotifications();

        } catch (error) {
            console.error('❌ Failed to mark notification as read:', error);
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllNotificationsAsRead() {
        try {
            this.notifications.forEach(notification => {
                notification.isRead = true;
                if (notification.persistentId) {
                    this.saveReadState(notification.persistentId);
                }
            });

            const sessionNotifications = JSON.parse(localStorage.getItem('transactionNotifications') || '[]');
            sessionNotifications.forEach(notification => {
                notification.isRead = true;
            });
            localStorage.setItem('transactionNotifications', JSON.stringify(sessionNotifications));

            this.showToast('All notifications marked as read', 'success');
            this.updateNotificationBadge();
            this.renderNotifications();

        } catch (error) {
            console.error('❌ Failed to mark all notifications as read:', error);
            this.showToast('Failed to update notifications', 'error');
        }
    }

    /**
     * Get smart relative time
     */
    getSmartRelativeTime(timestamp) {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

        if (diffInMinutes < 15) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            const quarterHours = Math.floor(diffInMinutes / 15) * 15;
            return `${quarterHours} minutes ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return '1 day ago';
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
     * Generic API fetch function with proper error handling
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

            if (!response.ok) {
                let errorMessage = `Request failed with status ${response.status}`;

                // Special handling for DELETE requests
                if (method === 'DELETE' && response.status === 404) {
                    console.log('ℹ️ DELETE 404: Resource already deleted, treating as success');
                    return { success: true, message: 'Resource deleted successfully' };
                }

                // Try to get error details
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }

                console.warn(`⚠️ API Error: ${errorMessage}`);
                throw new Error(errorMessage);
            }

            // Handle successful responses
            const contentType = response.headers.get('content-type');

            // Special handling for DELETE requests
            if (method === 'DELETE') {
                if (response.status === 204 || !contentType) {
                    console.log(`✅ ${method} request successful (No Content)`);
                    return { success: true, message: 'Resource deleted successfully' };
                }
            }

            // Handle JSON responses
            if (contentType && contentType.includes('application/json')) {
                const result = await response.json();
                console.log(`✅ ${method} request successful (JSON):`, result);
                return result;
            }

            // Handle text responses
            const result = await response.text();

            if (!result && method === 'DELETE') {
                console.log(`✅ ${method} request successful (Empty Response)`);
                return { success: true, message: 'Resource deleted successfully' };
            }

            console.log(`✅ ${method} request successful (Text):`, result);
            return result || { success: true };

        } catch (error) {
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

// ✅ Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Make instance globally available for onclick handlers
    window.transactionsManager = new TransactionsManager();
});