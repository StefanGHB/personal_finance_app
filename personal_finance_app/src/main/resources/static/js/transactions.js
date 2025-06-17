/**
 * Transactions Page JavaScript - Enhanced with Budget Auto-Update
 * Complete transaction management with real-time budget synchronization
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
        this.currentFilter = {
            type: 'all',        // all, INCOME, EXPENSE
            period: 'all',      // all, this-month, last-month, custom
            category: 'all',    // all, categoryId
            search: '',         // search term
            startDate: null,    // custom date range
            endDate: null
        };
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 1;

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

            // ===== SETUP AUTO-REFRESH FOR CROSS-TAB SYNC =====
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
     * Setup cross-tab synchronization for budget updates
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
        });

        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'budgetUpdated' && e.newValue) {
                console.log('🔄 Refreshing transactions after budget update');
                this.refreshAllData();
                localStorage.removeItem('budgetUpdated');
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
            ['transaction-filter', 'click', () => this.toggleFilterPanel()],
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

            // Close filter panel when clicking outside
            if (!e.target.closest('.filter-panel') && !e.target.closest('#transaction-filter')) {
                const filterPanel = document.getElementById('filter-panel');
                if (filterPanel) filterPanel.remove();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
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
     * Helper method to add multiple event listeners
     */
    addEventListeners(listeners) {
        listeners.forEach(([id, event, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
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
     * Apply filters and render with perfect filtering logic
     */
    applyFiltersAndRender() {
        console.log('🔍 Applying filters:', this.currentFilter);

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

        // 4. Apply SEARCH filter
        if (this.currentFilter.search) {
            const searchTerm = this.currentFilter.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(searchTerm) ||
                t.categoryName.toLowerCase().includes(searchTerm)
            );
            console.log(`After search filter (${this.currentFilter.search}):`, filtered.length);
        }

        this.filteredTransactions = filtered;
        this.updatePagination();
        this.renderTransactions();

        console.log('✅ Filters applied successfully. Final count:', filtered.length);
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
     * Render transactions list with improved empty state
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
            // Show simple empty message instead of full empty state
            container.innerHTML = this.getEmptyStateHTML();
            if (emptyState) emptyState.style.display = 'none';
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

        // Refresh icons after rendering transactions
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Get appropriate empty state HTML based on current filters
     */
    getEmptyStateHTML() {
        const hasFilters = this.getActiveFiltersCount() > 0;

        if (hasFilters) {
            // When filters are applied but no results
            return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 2rem; text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.7;">🔍</div>
                    <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">No transactions match your filters</h3>
                    <p style="font-size: 0.925rem; margin-bottom: 1.5rem; max-width: 300px;">Try adjusting your search criteria or clear filters to see all transactions.</p>
                    <button class="btn btn-secondary" onclick="transactionsManager.clearFilters()">
                        <i data-lucide="x"></i>
                        <span>Clear Filters</span>
                    </button>
                </div>
            `;
        } else {
            // When no transactions exist at all
            return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 2rem; text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.7;">💳</div>
                    <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">No transactions yet</h3>
                    <p style="font-size: 0.925rem; margin-bottom: 1.5rem; max-width: 300px;">Start tracking your finances by adding your first transaction.</p>
                    <button class="btn btn-primary" onclick="transactionsManager.openTransactionModal()">
                        <i data-lucide="plus"></i>
                        <span>Add First Transaction</span>
                    </button>
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

            // ===== SIGNAL BUDGET UPDATE TO OTHER TABS =====
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

            // ===== SIGNAL BUDGET UPDATE TO OTHER TABS =====
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
            search: '',
            startDate: null,
            endDate: null
        };
        this.currentPage = 1;
        this.applyFiltersAndRender();
        this.showToast('Showing all transactions', 'info');
    }

    /**
     * Toggle filter panel
     */
    toggleFilterPanel() {
        // Create and show filter panel
        this.showFilterPanel();
        console.log('🔍 Filter panel opened');
    }

    /**
     * Show advanced filter panel with better structure
     */
    showFilterPanel() {
        // Remove existing filter panel if present
        const existingPanel = document.getElementById('filter-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        // Create filter panel
        const filterPanel = document.createElement('div');
        filterPanel.id = 'filter-panel';
        filterPanel.className = 'filter-panel';

        filterPanel.innerHTML = `
            <div class="filter-panel-content">
                <div class="filter-header">
                    <h3>Filter Transactions</h3>
                    <button class="filter-close" onclick="this.closest('.filter-panel').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <div class="filter-body">
                    <div class="filter-group">
                        <label class="filter-label">Transaction Type</label>
                        <select id="filter-type" class="filter-select">
                            <option value="all">All Types</option>
                            <option value="INCOME">Income Only</option>
                            <option value="EXPENSE">Expenses Only</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">Time Period</label>
                        <select id="filter-period" class="filter-select">
                            <option value="all">All Time</option>
                            <option value="this-month">This Month</option>
                            <option value="last-month">Last Month</option>
                            <option value="this-year">This Year</option>
                            <option value="custom">Custom Range</option>
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

                    <div class="filter-group">
                        <label class="filter-label">Category</label>
                        <select id="filter-category" class="filter-select">
                            <option value="all">All Categories</option>
                            ${this.categories.map(cat =>
                                `<option value="${cat.id}">${this.translateCategoryName(cat.name)} (${cat.type === 'INCOME' ? 'Income' : 'Expense'})</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">Search</label>
                        <input type="text" id="filter-search" class="filter-input" placeholder="Search descriptions...">
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

        // Setup event listeners
        document.getElementById('filter-period').addEventListener('change', (e) => {
            const customDateRange = document.getElementById('custom-date-range');
            customDateRange.style.display = e.target.value === 'custom' ? 'block' : 'none';
        });

        // Set current filter values
        this.populateFilterPanel();

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Populate filter panel with current values
     */
    populateFilterPanel() {
        const filterType = document.getElementById('filter-type');
        const filterPeriod = document.getElementById('filter-period');
        const filterCategory = document.getElementById('filter-category');
        const filterSearch = document.getElementById('filter-search');
        const filterStartDate = document.getElementById('filter-start-date');
        const filterEndDate = document.getElementById('filter-end-date');

        if (filterType) filterType.value = this.currentFilter.type;
        if (filterPeriod) filterPeriod.value = this.currentFilter.period;
        if (filterCategory) filterCategory.value = this.currentFilter.category;
        if (filterSearch) filterSearch.value = this.currentFilter.search;
        if (filterStartDate) filterStartDate.value = this.currentFilter.startDate || '';
        if (filterEndDate) filterEndDate.value = this.currentFilter.endDate || '';

        // Show custom date range if needed
        if (this.currentFilter.period === 'custom') {
            const customDateRange = document.getElementById('custom-date-range');
            if (customDateRange) customDateRange.style.display = 'block';
        }
    }

    /**
     * Apply filters from panel with perfect logic
     */
    applyFilters() {
        const filterType = document.getElementById('filter-type');
        const filterPeriod = document.getElementById('filter-period');
        const filterCategory = document.getElementById('filter-category');
        const filterSearch = document.getElementById('filter-search');
        const filterStartDate = document.getElementById('filter-start-date');
        const filterEndDate = document.getElementById('filter-end-date');

        // Update current filter
        this.currentFilter = {
            type: filterType?.value || 'all',
            period: filterPeriod?.value || 'all',
            category: filterCategory?.value || 'all',
            search: filterSearch?.value || '',
            startDate: filterStartDate?.value || null,
            endDate: filterEndDate?.value || null
        };

        // Reset to first page
        this.currentPage = 1;

        // Apply filters and render
        this.applyFiltersAndRender();

        // Close filter panel
        const filterPanel = document.getElementById('filter-panel');
        if (filterPanel) filterPanel.remove();

        // Show confirmation
        const activeFilters = this.getActiveFiltersCount();
        if (activeFilters > 0) {
            this.showToast(`Applied ${activeFilters} filter${activeFilters > 1 ? 's' : ''}`, 'success');
        } else {
            this.showToast('Showing all transactions', 'info');
        }
    }

    /**
     * Clear all filters and apply
     */
    clearFilters() {
        this.currentFilter = {
            type: 'all',
            period: 'all',
            category: 'all',
            search: '',
            startDate: null,
            endDate: null
        };
        this.currentPage = 1;
        this.applyFiltersAndRender();

        // Close filter panel
        const filterPanel = document.getElementById('filter-panel');
        if (filterPanel) filterPanel.remove();

        this.showToast('All filters cleared', 'info');
    }

    /**
     * Get count of active filters
     */
    getActiveFiltersCount() {
        let count = 0;
        if (this.currentFilter.type !== 'all') count++;
        if (this.currentFilter.period !== 'all') count++;
        if (this.currentFilter.category !== 'all') count++;
        if (this.currentFilter.search) count++;
        return count;
    }

    /**
     * Initialize notifications
     */
    async initializeNotifications() {
        try {
            await this.loadNotifications();
            this.updateNotificationBadge();
            console.log('✅ Notifications initialized');
        } catch (error) {
            console.error('❌ Failed to initialize notifications:', error);
        }
    }

    /**
     * Toggle notifications panel
     */
    toggleNotifications() {
        const panel = document.getElementById('notifications-panel');
        if (panel && panel.classList.contains('active')) {
            this.closeNotificationsPanel();
        } else {
            this.showNotificationsPanel();
        }
    }

    /**
     * Show notifications panel
     */
    async showNotificationsPanel() {
        try {
            // Load latest notifications
            await this.loadNotifications();

            const panel = document.getElementById('notifications-panel');
            if (!panel) return;

            // Update notification list
            this.renderNotifications();

            // Show panel
            panel.classList.add('active');

            console.log('🔔 Notifications panel opened');
        } catch (error) {
            console.error('❌ Failed to load notifications:', error);
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
     * Load notifications (enhanced with transaction-related notifications)
     */
    async loadNotifications() {
        try {
            this.notifications = await this.generateTransactionNotifications();
        } catch (error) {
            console.error('❌ Failed to load notifications:', error);
            this.notifications = [];
        }
    }

    /**
     * Generate realistic transaction-related notifications with Euro currency
     */
    async generateTransactionNotifications() {
        const notifications = [];

        try {
            // Check for large expenses in current month
            const largeExpenses = this.summaryData.currentMonth.transactions
                .filter(t => t.type === 'EXPENSE' && parseFloat(t.amount) > 100)
                .sort((a, b) => b.amount - a.amount);

            if (largeExpenses.length > 0) {
                notifications.push({
                    id: Date.now() + 1,
                    title: 'Large Expense Alert',
                    message: `Large expense of €${largeExpenses[0].amount} recorded for ${this.translateCategoryName(largeExpenses[0].categoryName)}`,
                    type: 'warning',
                    time: this.getRelativeTime(largeExpenses[0].transactionDate),
                    isRead: false
                });
            }

            // Check for daily spending pattern
            if (this.summaryData.today.totalCount > 0) {
                const todayExpenses = this.summaryData.today.transactions
                    .filter(t => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                if (todayExpenses > 50) {
                    notifications.push({
                        id: Date.now() + 2,
                        title: 'Daily Spending Update',
                        message: `You've spent €${todayExpenses.toFixed(2)} today across ${this.summaryData.today.totalCount} transactions`,
                        type: 'info',
                        time: '1 hour ago',
                        isRead: false
                    });
                }
            }

            // Monthly progress notification
            if (this.summaryData.currentMonth.totalExpenses > 500) {
                notifications.push({
                    id: Date.now() + 3,
                    title: 'Monthly Spending Summary',
                    message: `This month's expenses: €${this.summaryData.currentMonth.totalExpenses.toFixed(2)} across ${this.summaryData.currentMonth.transactions.filter(t => t.type === 'EXPENSE').length} transactions`,
                    type: 'info',
                    time: '2 hours ago',
                    isRead: false
                });
            }

            // Balance warning if negative
            if (this.summaryData.allTime.balance < 0) {
                notifications.push({
                    id: Date.now() + 4,
                    title: 'Low Balance Alert',
                    message: `Your current balance is €${this.summaryData.allTime.balance.toFixed(2)}. Consider reviewing your expenses.`,
                    type: 'warning',
                    time: '30 minutes ago',
                    isRead: false
                });
            }

            // Add any manually added notifications from user actions
            notifications.push(...this.getSessionNotifications());

        } catch (error) {
            console.error('❌ Error generating notifications:', error);
        }

        return notifications;
    }

    /**
     * Get session-specific notifications (from user actions)
     */
    getSessionNotifications() {
        const sessionNotifications = JSON.parse(sessionStorage.getItem('transactionNotifications') || '[]');
        return sessionNotifications.filter(notification => {
            // Only show notifications from the last hour
            const notificationTime = new Date(notification.timestamp);
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            return notificationTime > oneHourAgo;
        });
    }

    /**
     * Add a new notification
     */
    addNotification(notification) {
        const sessionNotifications = JSON.parse(sessionStorage.getItem('transactionNotifications') || '[]');

        const newNotification = {
            ...notification,
            id: Date.now(),
            time: 'Just now',
            isRead: false,
            timestamp: new Date().toISOString()
        };

        sessionNotifications.unshift(newNotification);

        // Keep only last 10 notifications
        sessionNotifications.splice(10);

        sessionStorage.setItem('transactionNotifications', JSON.stringify(sessionNotifications));

        // Update UI
        this.updateNotificationBadge();
    }

    /**
     * Render notifications in panel
     */
    renderNotifications() {
        const container = document.getElementById('notifications-list');

        if (!container) return;

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
                        <div class="notification-time">${notification.time}</div>
                    </div>
                </div>
            `).join('');
        }

        // Refresh icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
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
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId) {
        try {
            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.isRead = true;
            }

            // Update session storage if it's a session notification
            const sessionNotifications = JSON.parse(sessionStorage.getItem('transactionNotifications') || '[]');
            const sessionNotification = sessionNotifications.find(n => n.id === notificationId);
            if (sessionNotification) {
                sessionNotification.isRead = true;
                sessionStorage.setItem('transactionNotifications', JSON.stringify(sessionNotifications));
            }

            console.log(`✅ Marked notification ${notificationId} as read`);

            // Update UI
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
            // Update local state
            this.notifications.forEach(notification => {
                notification.isRead = true;
            });

            // Update session storage
            const sessionNotifications = JSON.parse(sessionStorage.getItem('transactionNotifications') || '[]');
            sessionNotifications.forEach(notification => {
                notification.isRead = true;
            });
            sessionStorage.setItem('transactionNotifications', JSON.stringify(sessionNotifications));

            console.log('✅ Marked all notifications as read');

            this.showToast('All notifications marked as read', 'success');

            // Update UI
            this.updateNotificationBadge();
            this.renderNotifications();

        } catch (error) {
            console.error('❌ Failed to mark all notifications as read:', error);
            this.showToast('Failed to update notifications', 'error');
        }
    }

    /**
     * Get relative time string
     */
    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        }
    }

    /**
     * Enhanced refresh function that updates everything including summary cards
     */
    async refreshAllData() {
        try {
            console.log('🔄 Refreshing all data including summary cards...');

            await Promise.all([
                this.loadAllTransactions(),
                this.loadCompleteSummaryData(),
                this.loadNotifications()
            ]);

            // Apply current filters and render
            this.applyFiltersAndRender();
            this.updateNotificationBadge();

            console.log('✅ All data refreshed successfully');
        } catch (error) {
            console.error('❌ Error refreshing all data:', error);
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
     * Generic API fetch function with comprehensive error handling
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
            const response = await fetch(url, options);

            // Handle different response types
            if (!response.ok) {
                let errorMessage = `Request failed with status ${response.status}`;

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // If JSON parsing fails, use status text
                    errorMessage = response.statusText || errorMessage;
                }

                throw new Error(errorMessage);
            }

            // Handle different content types
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }

        } catch (error) {
            // Network or other errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw error;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Make instance globally available for onclick handlers
    window.transactionsManager = new TransactionsManager();
});

// Enhanced toast CSS styles with input styling fix
const transactionToastStyles = `
<style>
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--bg-modal);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-lg);
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 300px;
    max-width: 500px;
    z-index: 9999;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: var(--shadow-xl);
}

.toast.show {
    transform: translateX(0);
    opacity: 1;
}

.toast-success {
    border-left: 4px solid var(--accent-emerald);
}

.toast-error {
    border-left: 4px solid var(--accent-rose);
}

.toast-warning {
    border-left: 4px solid var(--accent-amber);
}

.toast-info {
    border-left: 4px solid var(--accent-cyan);
}

.toast-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
}

.toast-message {
    flex: 1;
    color: var(--text-primary);
    font-weight: 500;
}

.toast-close {
    background: none;
    border: none;
    color: var(--text-tertiary);
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
}

.toast-close:hover {
    color: var(--text-primary);
    background: var(--surface-glass);
}

.loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.transaction-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.transaction-item:hover .transaction-actions {
    opacity: 1;
}

.action-btn {
    background: var(--surface-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-sm);
    padding: 0.25rem;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all 0.2s ease;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-btn:hover {
    background: var(--surface-glass-hover);
    color: var(--text-primary);
}

.delete-btn:hover {
    color: var(--accent-rose);
    border-color: var(--accent-rose);
}

.transaction-summary {
    text-align: center;
    padding: 1rem;
}

.summary-amount {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.summary-amount.income {
    color: var(--accent-emerald);
}

.summary-amount.expense {
    color: var(--accent-rose);
}

.summary-description {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
}

.summary-category {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
}

.summary-date {
    color: var(--text-tertiary);
    font-size: 0.875rem;
}

/* Enhanced filter panel styles */
.filter-panel {
    position: fixed;
    top: 0;
    right: -400px;
    height: 100vh;
    width: 400px;
    background: var(--bg-modal);
    backdrop-filter: blur(20px);
    border-left: 1px solid var(--border-glass);
    z-index: 3000;
    transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-xl);
}

.filter-panel.active {
    right: 0;
}

.filter-panel-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
}

.filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-glass);
}

.filter-header h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
}

.filter-close {
    background: var(--surface-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-md);
    padding: 0.5rem;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all var(--duration-fast) ease;
}

.filter-close:hover {
    background: var(--surface-glass-hover);
    color: var(--text-primary);
}

.filter-body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.filter-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.filter-select,
.filter-input {
    background-color: #1f2937 !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: var(--radius-lg);
    padding: 0.875rem;
    font-size: 0.925rem;
    transition: all var(--duration-fast) ease;
    width: 100%;
}

.filter-select {
    appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1rem;
    padding-right: 2.5rem;
}

.filter-select option {
    background-color: #1f2937 !important;
    color: #ffffff !important;
    padding: 8px 12px !important;
    font-size: 0.925rem;
    font-weight: 500;
}

.filter-select:focus,
.filter-input:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: var(--surface-glass-hover);
}

.date-range {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.date-range span {
    color: var(--text-secondary);
    font-size: 0.875rem;
    white-space: nowrap;
}

.date-range input {
    flex: 1;
}

.filter-actions {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-glass);
    margin-top: auto;
}

.filter-actions .btn {
    flex: 1;
}

/* Amount input styling to prevent spinner overlap with currency */
.input-group {
    position: relative;
    display: flex;
    align-items: center;
}

.input-group .form-input {
    padding-right: 3rem !important; /* Make space for currency symbol */
}

.input-suffix {
    position: absolute;
    right: 1rem;
    color: var(--text-tertiary);
    font-weight: 600;
    pointer-events: none;
    z-index: 10;
    background: var(--surface-glass);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
}

/* Hide number input spinners to prevent overlap */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type="number"] {
    -moz-appearance: textfield;
}

/* Cross-tab sync notification styles */
.sync-notification {
    position: fixed;
    top: 80px;
    right: 20px;
    background: var(--gradient-success);
    border-radius: var(--radius-lg);
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 9998;
    transform: translateY(-20px);
    opacity: 0;
    transition: all 0.3s ease;
    font-size: 0.875rem;
    color: white;
    font-weight: 600;
    box-shadow: var(--shadow-lg);
}

.sync-notification.show {
    transform: translateY(0);
    opacity: 1;
}

.sync-notification i {
    width: 16px;
    height: 16px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
    .toast {
        width: calc(100% - 2rem);
        right: 1rem;
        left: 1rem;
        transform: translateY(-100%);
    }

    .toast.show {
        transform: translateY(0);
    }

    .filter-panel {
        width: 100%;
        right: -100%;
    }

    .sync-notification {
        right: 10px;
        left: 10px;
        width: auto;
    }
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
    .toast,
    .filter-panel,
    .sync-notification {
        transition: opacity 0.2s ease;
    }

    .loading-spinner {
        animation: none;
        border: 2px solid var(--primary-500);
    }
}

/* Focus styles for keyboard navigation */
.action-btn:focus,
.filter-close:focus {
    outline: 2px solid var(--primary-500);
    outline-offset: 2px;
}

/* Print styles */
@media print {
    .toast,
    .filter-panel,
    .transaction-actions {
        display: none !important;
    }

    .transaction-item {
        page-break-inside: avoid;
        border: 1px solid #000;
    }
}
</style>
`;

// Inject transaction styles
document.head.insertAdjacentHTML('beforeend', transactionToastStyles);