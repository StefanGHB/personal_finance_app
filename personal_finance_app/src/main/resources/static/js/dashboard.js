/**
 * Dashboard JavaScript
 * Dashboard-specific functionality only
 */

class PersonalFinanceDashboard {
    constructor() {
        this.charts = {};
        this.notifications = [];
        this.isLoading = false;

        // API Base URL
        this.API_BASE = '/api';

        // Initialize dashboard
        this.init();
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        try {
            this.showLoadingState();

            // Wait for shared components to be ready
            await this.waitForSharedComponents();

            // Setup dashboard-specific event listeners
            this.setupEventListeners();

            // Load dashboard data
            await this.loadDashboardData();

            // Initialize charts
            this.initializeCharts();

            this.hideLoadingState();

            console.log('✅ Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    /**
     * Wait for shared components to be ready
     */
    async waitForSharedComponents() {
        return new Promise((resolve) => {
            const checkShared = () => {
                if (window.navigationManager && document.getElementById('sidebar')) {
                    resolve();
                } else {
                    setTimeout(checkShared, 100);
                }
            };
            checkShared();
        });
    }

    /**
     * Setup dashboard-specific event listeners
     */
    setupEventListeners() {
        // Notifications
        const notificationBtn = document.getElementById('notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', this.toggleNotifications.bind(this));
        }

        const markAllRead = document.getElementById('mark-all-read');
        if (markAllRead) {
            markAllRead.addEventListener('click', this.markAllNotificationsRead.bind(this));
        }

        // Quick action buttons
        const addTransactionBtn = document.getElementById('add-transaction-btn');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => this.openModal('add-transaction-modal'));
        }

        const addBudgetBtn = document.getElementById('add-budget-btn');
        if (addBudgetBtn) {
            addBudgetBtn.addEventListener('click', () => this.openModal('add-budget-modal'));
        }

        // Section action buttons - View All links
        const viewAllBudgets = document.getElementById('view-all-budgets');
        if (viewAllBudgets) {
            viewAllBudgets.addEventListener('click', () => {
                window.location.href = '/budgets';
            });
        }

        const viewAllTransactions = document.getElementById('view-all-transactions');
        if (viewAllTransactions) {
            viewAllTransactions.addEventListener('click', () => {
                window.location.href = '/transactions';
            });
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
            element.addEventListener('click', this.closeModals.bind(this));
        });

        // Modal cancel buttons
        document.querySelectorAll('#cancel-transaction, #cancel-budget').forEach(element => {
            element.addEventListener('click', this.closeModals.bind(this));
        });

        // Form submissions
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', this.handleTransactionSubmit.bind(this));
        }

        const budgetForm = document.getElementById('budget-form');
        if (budgetForm) {
            budgetForm.addEventListener('submit', this.handleBudgetSubmit.bind(this));
        }

        // Transaction type toggle
        document.querySelectorAll('#add-transaction-modal .toggle-btn').forEach(btn => {
            btn.addEventListener('click', this.handleTransactionTypeToggle.bind(this));
        });

        // Budget type toggle
        document.querySelectorAll('#add-budget-modal .toggle-btn').forEach(btn => {
            btn.addEventListener('click', this.handleBudgetTypeToggle.bind(this));
        });

        // Chart period selectors
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', this.handleChartPeriodChange.bind(this));
        });

        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });

        // Click outside to close notifications
        document.addEventListener('click', (e) => {
            const notificationsPanel = document.getElementById('notifications-panel');
            const notificationBtn = document.getElementById('notification-btn');

            if (notificationsPanel && !notificationsPanel.contains(e.target) &&
                !notificationBtn.contains(e.target)) {
                this.closeNotifications();
            }
        });

        // Summary card click handlers
        document.querySelectorAll('.summary-card').forEach(card => {
            card.addEventListener('click', this.handleSummaryCardClick.bind(this));
        });

        // Chart action buttons
        document.querySelectorAll('.chart-action-btn').forEach(btn => {
            btn.addEventListener('click', this.handleChartAction.bind(this));
        });

        // Insight action buttons
        document.querySelectorAll('.insight-btn').forEach(btn => {
            btn.addEventListener('click', this.handleInsightAction.bind(this));
        });
    }

    /**
     * Load all dashboard data
     */
    async loadDashboardData() {
        try {
            // Load data in parallel for better performance
            const [
                balance,
                monthlyTransactions,
                budgets,
                notifications,
                recentTransactions
            ] = await Promise.all([
                this.loadBalance(),
                this.loadMonthlyTransactions(),
                this.loadCurrentMonthBudgets(),
                this.loadNotifications(),
                this.loadRecentTransactions()
            ]);

            // Update summary cards
            this.updateSummaryCards({
                balance,
                monthlyTransactions,
                budgets
            });

            // Update budget progress
            this.updateBudgetProgress(budgets);

            // Update recent transactions
            this.updateRecentTransactions(recentTransactions);

            // Update notifications
            this.updateNotifications(notifications);

            // Load categories for forms
            await this.loadCategories();

            // Generate financial insights
            this.generateFinancialInsights(monthlyTransactions, budgets);

        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    /**
     * Load user balance
     */
    async loadBalance() {
        try {
            const response = await this.fetchAPI('/transactions/balance');
            return response.balance || 0;
        } catch (error) {
            console.error('❌ Failed to load balance:', error);
            return 0;
        }
    }

    /**
     * Load current month transactions
     */
    async loadMonthlyTransactions() {
        try {
            const transactions = await this.fetchAPI('/transactions/current-month');

            const income = transactions
                .filter(t => t.type === 'INCOME')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const expenses = transactions
                .filter(t => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            return { income, expenses, transactions };
        } catch (error) {
            console.error('❌ Failed to load monthly transactions:', error);
            return { income: 0, expenses: 0, transactions: [] };
        }
    }

    /**
     * Load current month budgets
     */
    async loadCurrentMonthBudgets() {
        try {
            const budgets = await this.fetchAPI('/budgets/current-month');
            return budgets || [];
        } catch (error) {
            console.error('❌ Failed to load budgets:', error);
            return [];
        }
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        try {
            const notifications = await this.fetchAPI('/alerts/unread');
            this.notifications = notifications || [];
            return this.notifications;
        } catch (error) {
            console.error('❌ Failed to load notifications:', error);
            return [];
        }
    }

    /**
     * Load recent transactions
     */
    async loadRecentTransactions() {
        try {
            const transactions = await this.fetchAPI('/transactions/current-month');
            // Sort by date descending and take first 10
            return transactions
                .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
                .slice(0, 10);
        } catch (error) {
            console.error('❌ Failed to load recent transactions:', error);
            return [];
        }
    }

    /**
     * Load categories for form dropdowns
     */
    async loadCategories() {
        try {
            const categories = await this.fetchAPI('/categories');
            this.updateCategoryDropdowns(categories);
        } catch (error) {
            console.error('❌ Failed to load categories:', error);
        }
    }

    /**
     * Update summary cards
     */
    updateSummaryCards({ balance, monthlyTransactions, budgets }) {
        // Update balance card
        this.updateCardValue('total-balance', balance, 'лв');

        // Update income card
        this.updateCardValue('monthly-income', monthlyTransactions.income, 'лв');

        // Update expenses card
        this.updateCardValue('monthly-expenses', monthlyTransactions.expenses, 'лв');

        // Calculate budget status
        const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.plannedAmount || 0), 0);
        const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spentAmount || 0), 0);
        const budgetPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

        this.updateCardValue('budget-status', budgetPercentage, '%');

        // Update trend indicators with real calculations
        this.updateTrendIndicators(balance, monthlyTransactions, budgetPercentage);

        // Update user greeting in header
        if (window.navigationManager?.currentUser) {
            const pageSubtitle = document.querySelector('.page-subtitle');
            if (pageSubtitle) {
                pageSubtitle.textContent = `Welcome back, ${window.navigationManager.currentUser.firstName}! Here's your financial overview`;
            }
        }
    }

    /**
     * Update trend indicators with real data
     */
    updateTrendIndicators(balance, monthlyTransactions, budgetPercentage) {
        // Calculate balance trend
        const balancePositive = balance >= 0;
        this.updateTrendIndicator('balance-trend',
            balancePositive ? 'Positive balance' : 'Negative balance',
            balancePositive);

        // Calculate income trend
        this.updateTrendIndicator('income-trend',
            monthlyTransactions.income > 0 ? 'Income received' : 'No income yet',
            monthlyTransactions.income > 0);

        // Calculate expense trend
        this.updateTrendIndicator('expenses-trend',
            monthlyTransactions.expenses > 0 ? 'Expenses tracked' : 'No expenses yet',
            monthlyTransactions.expenses > 0);

        // Budget trend
        let budgetStatus = 'No budgets set';
        let isPositive = true;

        if (budgetPercentage > 0) {
            if (budgetPercentage <= 70) {
                budgetStatus = 'On track this month';
                isPositive = true;
            } else if (budgetPercentage <= 90) {
                budgetStatus = 'Approaching limits';
                isPositive = false;
            } else {
                budgetStatus = 'Over budget';
                isPositive = false;
            }
        }

        this.updateTrendIndicator('budget-trend', budgetStatus, isPositive);
    }

    /**
     * Update card value with animation
     */
    updateCardValue(elementId, value, suffix) {
        const element = document.querySelector(`#${elementId} .value-amount, #${elementId} .value-percentage`);
        if (element) {
            this.animateNumber(element, 0, value, 1000);
        }
    }

    /**
     * Update trend indicator
     */
    updateTrendIndicator(elementId, text, isPositive = true) {
        const trendElement = document.getElementById(elementId);
        if (!trendElement) return;

        const textElement = trendElement.querySelector('.trend-text');
        const iconElement = trendElement.querySelector('.trend-indicator i');

        if (textElement) {
            textElement.textContent = text;
        }

        if (iconElement) {
            iconElement.setAttribute('data-lucide', isPositive ? 'trending-up' : 'trending-down');

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Animate number counting
     */
    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (difference * easeOut);
            const displayValue = Math.round(current * 100) / 100;

            if (displayValue % 1 === 0) {
                element.textContent = displayValue.toString();
            } else {
                element.textContent = displayValue.toFixed(2);
            }

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }

    /**
     * Update budget progress section
     */
    updateBudgetProgress(budgets) {
        const budgetsGrid = document.getElementById('budgets-grid');
        if (!budgetsGrid) return;

        if (budgets.length === 0) {
            budgetsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <h3>No budgets yet</h3>
                    <p>Create your first budget to start tracking your spending goals</p>
                    <button class="btn btn-primary" onclick="dashboard.openModal('add-budget-modal')">
                        <i data-lucide="plus"></i>
                        <span>Create Budget</span>
                    </button>
                </div>
            `;

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        budgetsGrid.innerHTML = budgets.map(budget => this.createBudgetCard(budget)).join('');

        budgetsGrid.querySelectorAll('.budget-card').forEach((card, index) => {
            card.addEventListener('click', () => this.handleBudgetCardClick(budgets[index]));
        });
    }

    /**
     * Create budget card HTML
     */
    createBudgetCard(budget) {
        const percentage = Math.round(budget.spentPercentage || 0);
        let progressClass = '';

        if (percentage >= 100) {
            progressClass = 'danger';
        } else if (percentage >= 90) {
            progressClass = 'warning';
        }

        const remainingAmount = budget.remainingAmount || 0;
        const isOverBudget = remainingAmount < 0;

        return `
            <div class="budget-card" data-budget-id="${budget.id}">
                <div class="budget-header">
                    <div class="budget-category">
                        <div class="category-color" style="background-color: ${budget.categoryColor || '#6366f1'}"></div>
                        <span class="category-name">${budget.categoryName || 'General Budget'}</span>
                    </div>
                    <div class="budget-amount">${budget.plannedAmount} лв</div>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span class="spent-amount">${budget.spentAmount || 0} лв spent</span>
                        <span class="remaining-amount ${isOverBudget ? 'over-budget' : ''}">
                            ${isOverBudget ? 'Over by ' + Math.abs(remainingAmount) : remainingAmount} лв ${isOverBudget ? '' : 'left'}
                        </span>
                    </div>
                </div>
                ${percentage >= 90 ? `
                    <div class="budget-alert">
                        <i data-lucide="alert-triangle"></i>
                        <span>${percentage >= 100 ? 'Budget exceeded!' : 'Approaching limit'}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Update recent transactions
     */
    updateRecentTransactions(transactions) {
        const transactionsList = document.getElementById('transactions-list');
        if (!transactionsList) return;

        if (transactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💳</div>
                    <h3>No transactions yet</h3>
                    <p>Start tracking your income and expenses</p>
                    <button class="btn btn-primary" onclick="dashboard.openModal('add-transaction-modal')">
                        <i data-lucide="plus"></i>
                        <span>Add Transaction</span>
                    </button>
                </div>
            `;

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        transactionsList.innerHTML = transactions.map(transaction =>
            this.createTransactionItem(transaction)
        ).join('');

        transactionsList.querySelectorAll('.transaction-item').forEach((item, index) => {
            item.addEventListener('click', () => this.handleTransactionClick(transactions[index]));
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Create transaction item HTML
     */
    createTransactionItem(transaction) {
        const isIncome = transaction.type === 'INCOME';
        const icon = isIncome ? 'trending-up' : 'trending-down';
        const typeClass = isIncome ? 'income' : 'expense';
        const amountPrefix = isIncome ? '+' : '-';

        return `
            <div class="transaction-item" data-transaction-id="${transaction.id}">
                <div class="transaction-icon ${typeClass}">
                    <i data-lucide="${icon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description || 'No description'}</div>
                    <div class="transaction-category">${transaction.categoryName}</div>
                </div>
                <div class="transaction-meta">
                    <div class="transaction-amount ${typeClass}">
                        ${amountPrefix}${transaction.amount} лв
                    </div>
                    <div class="transaction-date">${this.formatDate(transaction.transactionDate)}</div>
                </div>
            </div>
        `;
    }

    /**
     * Update notifications
     */
    updateNotifications(notifications) {
        const notificationBadge = document.getElementById('notification-badge');
        const notificationsList = document.getElementById('notifications-list');

        if (notificationBadge) {
            notificationBadge.textContent = notifications.length;
            notificationBadge.style.display = notifications.length > 0 ? 'block' : 'none';
        }

        if (notificationsList) {
            if (notifications.length === 0) {
                notificationsList.innerHTML = `
                    <div class="empty-notifications">
                        <div class="empty-icon">🔔</div>
                        <p>No new notifications</p>
                    </div>
                `;
            } else {
                notificationsList.innerHTML = notifications.map(notification =>
                    this.createNotificationItem(notification)
                ).join('');

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }

    /**
     * Create notification item HTML
     */
    createNotificationItem(notification) {
        const icon = notification.alertType === 'EXCEEDED' ? 'alert-triangle' : 'info';
        const typeClass = notification.alertType === 'EXCEEDED' ? 'danger' : 'warning';

        return `
            <div class="notification-item ${typeClass}" data-id="${notification.id}">
                <div class="notification-icon">
                    <i data-lucide="${icon}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatDate(notification.createdAt)}</div>
                </div>
                <button class="mark-read-btn" onclick="dashboard.markNotificationRead(${notification.id})">
                    <i data-lucide="check"></i>
                </button>
            </div>
        `;
    }

    /**
     * Update category dropdowns
     */
    updateCategoryDropdowns(categories) {
        const transactionCategory = document.getElementById('transaction-category');
        const budgetCategory = document.getElementById('budget-category');

        if (transactionCategory) {
            const allOptions = categories.map(category =>
                `<option value="${category.id}" data-type="${category.type}">${category.name}</option>`
            ).join('');

            transactionCategory.innerHTML = '<option value="">Select category...</option>' + allOptions;
        }

        if (budgetCategory) {
            const expenseCategories = categories
                .filter(category => category.type === 'EXPENSE')
                .map(category =>
                    `<option value="${category.id}">${category.name}</option>`
                ).join('');

            budgetCategory.innerHTML = '<option value="">Select category...</option>' + expenseCategories;
        }
    }

    /**
     * Generate financial insights based on data
     */
    generateFinancialInsights(monthlyTransactions, budgets) {
        const insights = [];

        // Savings opportunity insight
        if (monthlyTransactions.income > monthlyTransactions.expenses) {
            const savingsRate = ((monthlyTransactions.income - monthlyTransactions.expenses) / monthlyTransactions.income * 100);
            insights.push({
                type: 'savings',
                title: 'Savings Opportunity',
                description: `You're saving ${savingsRate.toFixed(1)}% of your income this month. Great job!`,
                progress: Math.min(savingsRate, 100),
                positive: true
            });
        } else if (monthlyTransactions.expenses > monthlyTransactions.income) {
            const deficit = monthlyTransactions.expenses - monthlyTransactions.income;
            insights.push({
                type: 'savings',
                title: 'Spending Alert',
                description: `You're spending ${deficit.toFixed(2)} лв more than your income this month`,
                progress: 100,
                positive: false
            });
        }

        // Budget insight
        const overBudgetCategories = budgets.filter(b => b.spentPercentage >= 90);
        if (overBudgetCategories.length > 0) {
            const category = overBudgetCategories[0];
            insights.push({
                type: 'budget',
                title: 'Budget Alert',
                description: `You're ${category.spentPercentage.toFixed(0)}% through your ${category.categoryName} budget`,
                progress: category.spentPercentage,
                positive: category.spentPercentage < 100
            });
        } else if (budgets.length > 0) {
            insights.push({
                type: 'budget',
                title: 'Budget Status',
                description: 'All your budgets are on track this month',
                progress: 70,
                positive: true
            });
        }

        // Spending trend insight
        if (monthlyTransactions.transactions.length > 0) {
            const expenseTransactions = monthlyTransactions.transactions.filter(t => t.type === 'EXPENSE');
            if (expenseTransactions.length > 0) {
                const avgTransactionAmount = monthlyTransactions.expenses / expenseTransactions.length;
                insights.push({
                    type: 'trend',
                    title: 'Spending Pattern',
                    description: `Your average expense is ${avgTransactionAmount.toFixed(2)} лв per transaction`,
                    progress: 60,
                    positive: true
                });
            }
        }

        this.updateInsightsSection(insights);
    }

    /**
     * Update insights section
     */
    updateInsightsSection(insights) {
        const insightCards = document.querySelectorAll('.insight-card');

        insights.forEach((insight, index) => {
            if (insightCards[index]) {
                const card = insightCards[index];

                const title = card.querySelector('.insight-title');
                const description = card.querySelector('.insight-description');
                const progressFill = card.querySelector('.progress-fill');
                const progressText = card.querySelector('.progress-text');

                if (title) title.textContent = insight.title;
                if (description) description.textContent = insight.description;
                if (progressFill) {
                    progressFill.style.width = `${Math.min(insight.progress, 100)}%`;
                    progressFill.parentElement.className = `progress-bar ${insight.positive ? 'success' : 'warning'}`;
                }
                if (progressText) {
                    progressText.textContent = `${insight.progress.toFixed(0)}%`;
                }
            }
        });
    }

    /**
     * Initialize charts
     */
    initializeCharts() {
        this.initSpendingChart();
        this.initCategoryChart();
    }

    /**
     * Initialize spending overview chart
     */
    async initSpendingChart() {
        const canvas = document.getElementById('spending-chart');
        if (!canvas) return;

        try {
            const spendingData = await this.getSpendingChartData();

            this.charts.spending = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: spendingData.labels,
                    datasets: [{
                        label: 'Income',
                        data: spendingData.income,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }, {
                        label: 'Expenses',
                        data: spendingData.expenses,
                        borderColor: '#f43f5e',
                        backgroundColor: 'rgba(244, 63, 94, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#f43f5e',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#d1d5db',
                                usePointStyle: true,
                                padding: 20,
                                font: { family: 'Inter', size: 12 }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            titleColor: '#f9fafb',
                            bodyColor: '#d1d5db',
                            borderColor: 'rgba(75, 85, 99, 0.3)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} лв`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#9ca3af', font: { family: 'Inter', size: 11 }},
                            grid: { color: 'rgba(75, 85, 99, 0.2)', drawBorder: false }
                        },
                        y: {
                            ticks: {
                                color: '#9ca3af',
                                font: { family: 'Inter', size: 11 },
                                callback: function(value) { return value + ' лв'; }
                            },
                            grid: { color: 'rgba(75, 85, 99, 0.2)', drawBorder: false }
                        }
                    },
                    interaction: { intersect: false, mode: 'index' }
                }
            });
        } catch (error) {
            console.error('❌ Failed to initialize spending chart:', error);
        }
    }

    /**
     * Initialize category breakdown chart
     */
    async initCategoryChart() {
        const canvas = document.getElementById('category-chart');
        if (!canvas) return;

        try {
            const categoryData = await this.getCategoryChartData();

            if (categoryData.labels.length === 0) {
                const container = canvas.parentElement;
                container.innerHTML = `
                    <div class="empty-chart">
                        <div class="empty-icon">📊</div>
                        <p>No expense data this month</p>
                    </div>
                `;
                return;
            }

            this.charts.category = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: categoryData.labels,
                    datasets: [{
                        data: categoryData.data,
                        backgroundColor: categoryData.colors,
                        borderWidth: 0,
                        hoverBorderWidth: 3,
                        hoverBorderColor: '#374151'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            titleColor: '#f9fafb',
                            bodyColor: '#d1d5db',
                            borderColor: 'rgba(75, 85, 99, 0.3)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed.toFixed(2)} лв (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '70%',
                    animation: { animateRotate: true, duration: 1000 }
                }
            });

            this.updateCategoryLegend(categoryData);
        } catch (error) {
            console.error('❌ Failed to initialize category chart:', error);
        }
    }

    /**
     * Get spending chart data
     */
    async getSpendingChartData() {
        try {
            const months = [];
            const income = [];
            const expenses = [];

            const now = new Date();

            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;

                months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

                try {
                    const monthlyTransactions = await this.fetchAPI(`/transactions/month/${year}/${month}`);

                    const monthIncome = monthlyTransactions
                        .filter(t => t.type === 'INCOME')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                    const monthExpenses = monthlyTransactions
                        .filter(t => t.type === 'EXPENSE')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                    income.push(monthIncome);
                    expenses.push(monthExpenses);
                } catch (error) {
                    income.push(0);
                    expenses.push(0);
                }
            }

            return { labels: months, income, expenses };
        } catch (error) {
            console.error('❌ Failed to get spending chart data:', error);
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            }
            return { labels: months, income: [0, 0, 0, 0, 0, 0], expenses: [0, 0, 0, 0, 0, 0] };
        }
    }

    /**
     * Get category chart data
     */
    async getCategoryChartData() {
        try {
            const transactions = await this.fetchAPI('/transactions/current-month');
            const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');

            if (expenseTransactions.length === 0) {
                return { labels: [], data: [], colors: [] };
            }

            const categoryTotals = {};
            expenseTransactions.forEach(transaction => {
                const category = transaction.categoryName;
                categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(transaction.amount);
            });

            const labels = Object.keys(categoryTotals);
            const data = Object.values(categoryTotals);
            const colors = this.generateColors(labels.length);

            return { labels, data, colors };
        } catch (error) {
            console.error('❌ Failed to get category chart data:', error);
            return { labels: [], data: [], colors: [] };
        }
    }

    /**
     * Update category chart legend
     */
    updateCategoryLegend(categoryData) {
        const legend = document.getElementById('category-legend');
        if (!legend) return;

        const total = categoryData.data.reduce((sum, value) => sum + value, 0);

        if (total === 0) {
            legend.innerHTML = '<p class="no-data">No expense data to display</p>';
            return;
        }

        legend.innerHTML = categoryData.labels.map((label, index) => {
            const value = categoryData.data[index];
            const percentage = Math.round((value / total) * 100);

            return `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${categoryData.colors[index]}"></div>
                    <span class="legend-label">${label}</span>
                    <span class="legend-value">${value.toFixed(2)} лв (${percentage}%)</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Generate colors for chart
     */
    generateColors(count) {
        const colors = [
            '#3b82f6', '#06b6d4', '#10b981', '#f59e0b',
            '#f43f5e', '#8b5cf6', '#6366f1', '#14b8a6',
            '#f97316', '#84cc16', '#ec4899', '#64748b'
        ];

        return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
    }

    /**
     * Toggle notifications panel
     */
    toggleNotifications() {
        const panel = document.getElementById('notifications-panel');
        if (panel) {
            panel.classList.toggle('active');
        }
    }

    /**
     * Close notifications panel
     */
    closeNotifications() {
        const panel = document.getElementById('notifications-panel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllNotificationsRead() {
        try {
            await this.fetchAPI('/alerts/read-all', 'PUT');
            await this.loadNotifications();
            this.closeNotifications();
            this.showSuccess('All notifications marked as read');
        } catch (error) {
            console.error('❌ Failed to mark notifications as read:', error);
            this.showError('Failed to mark notifications as read');
        }
    }

    /**
     * Mark single notification as read
     */
    async markNotificationRead(notificationId) {
        try {
            await this.fetchAPI(`/alerts/${notificationId}/read`, 'PUT');
            await this.loadNotifications();
            this.showSuccess('Notification marked as read');
        } catch (error) {
            console.error('❌ Failed to mark notification as read:', error);
            this.showError('Failed to mark notification as read');
        }
    }

    /**
     * Open modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            const dateInput = modal.querySelector('input[type="date"]');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }

            const monthInput = modal.querySelector('input[type="month"]');
            if (monthInput) {
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                monthInput.value = currentMonth;
            }
        }
    }

    /**
     * Close all modals
     */
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';

        document.querySelectorAll('.modal form').forEach(form => {
            form.reset();

            const toggleButtons = form.querySelectorAll('.toggle-btn');
            toggleButtons.forEach((btn, index) => {
                btn.classList.toggle('active', index === 0);
            });

            const categorySelect = form.querySelector('#transaction-category');
            if (categorySelect) {
                Array.from(categorySelect.options).forEach(option => {
                    option.style.display = 'block';
                });
            }

            const categorySelection = form.querySelector('#category-selection');
            if (categorySelection) {
                categorySelection.style.display = 'block';
            }
        });
    }

    /**
     * Handle transaction type toggle
     */
    handleTransactionTypeToggle(event) {
        event.preventDefault();

        const button = event.currentTarget;
        const type = button.dataset.type;

        document.querySelectorAll('#add-transaction-modal .toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        this.filterCategoriesByType(type);
    }

    /**
     * Filter categories by transaction type
     */
    filterCategoriesByType(type) {
        const categorySelect = document.getElementById('transaction-category');
        if (!categorySelect) return;

        Array.from(categorySelect.options).forEach(option => {
            if (option.value === '') {
                option.style.display = 'block';
                return;
            }

            const optionType = option.dataset.type;
            option.style.display = optionType === type ? 'block' : 'none';
        });

        categorySelect.value = '';
    }

    /**
     * Handle budget type toggle
     */
    handleBudgetTypeToggle(event) {
        event.preventDefault();

        const button = event.currentTarget;
        const type = button.dataset.budgetType;

        document.querySelectorAll('#add-budget-modal .toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        const categorySelection = document.getElementById('category-selection');
        const categorySelect = document.getElementById('budget-category');

        if (type === 'category') {
            categorySelection.style.display = 'block';
            categorySelect.required = true;
        } else {
            categorySelection.style.display = 'none';
            categorySelect.required = false;
        }
    }

    /**
     * Handle transaction form submission
     */
    async handleTransactionSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const activeTypeBtn = document.querySelector('#add-transaction-modal .toggle-btn.active');
        const type = activeTypeBtn ? activeTypeBtn.dataset.type : 'EXPENSE';

        const transactionData = {
            categoryId: parseInt(formData.get('categoryId')),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description') || '',
            type: type,
            transactionDate: formData.get('transactionDate')
        };

        if (!transactionData.categoryId) {
            this.showError('Please select a category');
            return;
        }

        if (!transactionData.amount || transactionData.amount <= 0) {
            this.showError('Please enter a valid amount');
            return;
        }

        try {
            this.showLoadingState();
            await this.fetchAPI('/transactions', 'POST', transactionData);
            this.closeModals();
            this.showSuccess('Transaction added successfully!');

            await this.loadDashboardData();
            this.updateCharts();

        } catch (error) {
            console.error('❌ Failed to create transaction:', error);
            this.showError(error.message || 'Failed to create transaction');
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Handle budget form submission
     */
    async handleBudgetSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const activeTypeBtn = document.querySelector('#add-budget-modal .toggle-btn.active');
        const budgetType = activeTypeBtn ? activeTypeBtn.dataset.budgetType : 'category';

        const budgetMonth = formData.get('budgetMonth');
        const [year, month] = budgetMonth.split('-');

        const budgetData = {
            plannedAmount: parseFloat(formData.get('plannedAmount')),
            year: parseInt(year),
            month: parseInt(month)
        };

        if (budgetType === 'category') {
            budgetData.categoryId = parseInt(formData.get('categoryId'));

            if (!budgetData.categoryId) {
                this.showError('Please select a category');
                return;
            }
        }

        if (!budgetData.plannedAmount || budgetData.plannedAmount <= 0) {
            this.showError('Please enter a valid budget amount');
            return;
        }

        try {
            this.showLoadingState();
            const endpoint = budgetType === 'category' ? '/budgets/category' : '/budgets/general';
            await this.fetchAPI(endpoint, 'POST', budgetData);

            this.closeModals();
            this.showSuccess('Budget created successfully!');

            await this.loadDashboardData();

        } catch (error) {
            console.error('❌ Failed to create budget:', error);
            this.showError(error.message || 'Failed to create budget');
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Handle chart period change
     */
    handleChartPeriodChange(event) {
        event.preventDefault();

        const button = event.currentTarget;
        const period = button.dataset.period;

        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        this.updateSpendingChartPeriod(period);
    }

    /**
     * Update spending chart for different periods
     */
    async updateSpendingChartPeriod(period) {
        if (!this.charts.spending) return;

        try {
            let monthsBack;
            switch (period) {
                case '6m': monthsBack = 6; break;
                case '1y': monthsBack = 12; break;
                case 'all': monthsBack = 24; break;
                default: monthsBack = 6;
            }

            const spendingData = await this.getSpendingChartDataForPeriod(monthsBack);

            this.charts.spending.data.labels = spendingData.labels;
            this.charts.spending.data.datasets[0].data = spendingData.income;
            this.charts.spending.data.datasets[1].data = spendingData.expenses;
            this.charts.spending.update('active');

        } catch (error) {
            console.error('❌ Failed to update chart period:', error);
        }
    }

    /**
     * Get spending data for specific period
     */
    async getSpendingChartDataForPeriod(monthsBack) {
        try {
            const months = [];
            const income = [];
            const expenses = [];

            const now = new Date();

            for (let i = monthsBack - 1; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;

                months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

                try {
                    const monthlyTransactions = await this.fetchAPI(`/transactions/month/${year}/${month}`);

                    const monthIncome = monthlyTransactions
                        .filter(t => t.type === 'INCOME')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                    const monthExpenses = monthlyTransactions
                        .filter(t => t.type === 'EXPENSE')
                        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

                    income.push(monthIncome);
                    expenses.push(monthExpenses);
                } catch (error) {
                    income.push(0);
                    expenses.push(0);
                }
            }

            return { labels: months, income, expenses };
        } catch (error) {
            console.error('❌ Failed to get chart data for period:', error);
            return { labels: [], income: [], expenses: [] };
        }
    }

    /**
     * Update charts
     */
    updateCharts() {
        if (this.charts.spending) {
            this.charts.spending.destroy();
        }
        if (this.charts.category) {
            this.charts.category.destroy();
        }

        this.initializeCharts();
    }

    /**
     * Handle summary card clicks
     */
    handleSummaryCardClick(event) {
        const card = event.currentTarget;

        if (card.classList.contains('balance-card')) {
            window.location.href = '/transactions';
        } else if (card.classList.contains('income-card')) {
            window.location.href = '/transactions?type=income';
        } else if (card.classList.contains('expense-card')) {
            window.location.href = '/transactions?type=expense';
        } else if (card.classList.contains('budget-card')) {
            window.location.href = '/budgets';
        }
    }

    /**
     * Handle budget card clicks
     */
    handleBudgetCardClick(budget) {
        window.location.href = `/budgets?id=${budget.id}`;
    }

    /**
     * Handle transaction clicks
     */
    handleTransactionClick(transaction) {
        window.location.href = `/transactions?id=${transaction.id}`;
    }

    /**
     * Handle chart action buttons
     */
    handleChartAction(event) {
        const button = event.currentTarget;
        const action = button.title;

        if (action.includes('Export')) {
            this.exportChart();
        } else if (action.includes('View All')) {
            window.location.href = '/reports';
        }
    }

    /**
     * Handle insight action buttons
     */
    handleInsightAction(event) {
        const button = event.currentTarget;
        const card = button.closest('.insight-card');

        if (card.classList.contains('savings-insight')) {
            window.location.href = '/reports?view=savings';
        } else if (card.classList.contains('budget-insight')) {
            window.location.href = '/budgets';
        } else if (card.classList.contains('trend-insight')) {
            window.location.href = '/reports?view=trends';
        }
    }

    /**
     * Export chart functionality
     */
    exportChart() {
        try {
            if (this.charts.spending) {
                const url = this.charts.spending.toBase64Image();
                const link = document.createElement('a');
                link.download = 'spending-chart.png';
                link.href = url;
                link.click();
                this.showSuccess('Chart exported successfully!');
            }
        } catch (error) {
            console.error('❌ Failed to export chart:', error);
            this.showError('Failed to export chart');
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.isLoading = true;
        document.body.classList.add('loading');

        document.querySelectorAll('.btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.7';
        });
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        this.isLoading = false;
        document.body.classList.remove('loading');

        document.querySelectorAll('.btn').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}"></i>
                </div>
                <div class="toast-message">${message}</div>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    /**
     * Generic API fetch function
     */
    async fetchAPI(endpoint, method = 'GET', data = null) {
        const url = `${this.API_BASE}${endpoint}`;

        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new PersonalFinanceDashboard();
});

// Enhanced styles for dashboard-specific elements
const dashboardStyles = `
    .loading .summary-card,
    .loading .chart-card {
        opacity: 0.7;
        pointer-events: none;
    }

    .loading .summary-card::after,
    .loading .chart-card::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .budget-alert {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: var(--radius-md);
        color: var(--accent-amber);
        font-size: 0.875rem;
        font-weight: 500;
        margin-top: 0.75rem;
    }

    .budget-alert i {
        width: 16px;
        height: 16px;
    }

    .over-budget {
        color: var(--accent-rose) !important;
        font-weight: 600;
    }

    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--gradient-card);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-lg);
        padding: 1rem;
        z-index: 9999;
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s ease;
        min-width: 300px;
        max-width: 400px;
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

    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .toast-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        color: var(--text-primary);
    }

    .toast-message {
        color: var(--text-primary);
        font-weight: 500;
        flex: 1;
        line-height: 1.4;
    }

    .toast-close {
        background: none;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: var(--radius-sm);
        transition: all 0.15s ease;
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .toast-close:hover {
        color: var(--text-primary);
        background: var(--surface-glass);
    }

    .empty-notifications {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
        color: var(--text-tertiary);
    }

    .empty-notifications .empty-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }

    .empty-chart {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        color: var(--text-tertiary);
    }

    .empty-chart .empty-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    .no-data {
        color: var(--text-tertiary);
        font-style: italic;
        text-align: center;
        padding: 1rem;
    }

    .notification-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
        border-bottom: 1px solid var(--border-glass);
        transition: background-color 0.15s ease;
    }

    .notification-item:hover {
        background: var(--surface-glass);
    }

    .notification-item:last-child {
        border-bottom: none;
    }

    .notification-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 0.25rem;
    }

    .notification-item.warning .notification-icon {
        background: rgba(245, 158, 11, 0.2);
        color: var(--accent-amber);
    }

    .notification-item.danger .notification-icon {
        background: rgba(244, 63, 94, 0.2);
        color: var(--accent-rose);
    }

    .notification-content {
        flex: 1;
        min-width: 0;
    }

    .notification-message {
        font-size: 0.925rem;
        color: var(--text-primary);
        line-height: 1.4;
        margin-bottom: 0.25rem;
    }

    .notification-time {
        font-size: 0.825rem;
        color: var(--text-tertiary);
    }

    .mark-read-btn {
        background: var(--surface-glass);
        border: 1px solid var(--border-glass);
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-tertiary);
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;
        margin-top: 0.25rem;
    }

    .mark-read-btn:hover {
        background: var(--accent-emerald);
        color: white;
        border-color: var(--accent-emerald);
    }

    .notifications-list {
        max-height: 400px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--border-primary) transparent;
    }

    .notifications-list::-webkit-scrollbar {
        width: 6px;
    }

    .notifications-list::-webkit-scrollbar-track {
        background: transparent;
    }

    .notifications-list::-webkit-scrollbar-thumb {
        background: var(--border-primary);
        border-radius: 3px;
    }

    .notifications-list::-webkit-scrollbar-thumb:hover {
        background: var(--border-glass);
    }

    @media (max-width: 768px) {
        .toast {
            right: 10px;
            left: 10px;
            transform: translateY(-100px);
            max-width: none;
        }

        .toast.show {
            transform: translateY(0);
        }
    }
`;

const dashboardStyleSheet = document.createElement('style');
dashboardStyleSheet.textContent = dashboardStyles;
document.head.appendChild(dashboardStyleSheet);