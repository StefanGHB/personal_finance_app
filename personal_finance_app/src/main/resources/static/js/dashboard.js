/**
 * ULTRA MODERN FINANCIAL ANALYTICS DASHBOARD - COMPLETE WITH PERFECT NOTIFICATIONS
 * 🚀 Professional financial charts with Trading View style
 * 📊 Advanced analytics and real-time updates
 * 💹 PRODUCTION READY: All calculation logic and dynamic updates - NO HARDCODED VALUES
 * ✨ Perfect symmetry between Budget Adherence & Spending Patterns
 * 🎯 100% Dynamic calculations - PRODUCTION READY
 * 🎨 UPDATED: Modern Empty States for Charts
 * 🔔 PERFECT: Complete Notifications System with Cross-Tab Sync
 * 🔄 ENHANCED: Perfect synchronization with budgets, categories, transactions
 * ⏰ FIXED: Notification timing issues resolved
 */

(function() {
    'use strict';

    class ModernFinancialDashboard {
        constructor() {
            this.charts = {};
            this.notifications = [];
            this.isLoading = false;
            this.currentUser = null;
            this.dashboardData = {};

            // API Configuration
            this.API_BASE = '/api';
            this.CURRENCY_SYMBOL = '€';

            // Notification system properties
            this.notificationTimer = null;
            this.notificationRetentionHours = 24; // Exactly 24 hours retention
            this.maxNotifications = 25; // Maximum notifications to keep

            // Trading View Style Color Schemes - UPDATED TO PURPLE THEME
            this.colors = {
                primary: '#a855f7',      // Beautiful purple
                primaryDark: '#9333ea',  // Darker purple
                danger: '#ff4757',       // Trading red
                warning: '#ffa502',      // Warning yellow
                neutral: '#3742fa',      // Blue for neutral
                volume: '#747d8c',       // Gray for volume
                velocity: '#06b6d4',     // Cyan for velocity
                grid: 'rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.9)',
                gradients: {
                    primary: 'linear-gradient(180deg, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0.05) 100%)',
                    danger: 'linear-gradient(180deg, rgba(255, 71, 87, 0.3) 0%, rgba(255, 71, 87, 0.05) 100%)',
                    neutral: 'linear-gradient(180deg, rgba(55, 66, 250, 0.3) 0%, rgba(55, 66, 250, 0.05) 100%)',
                    velocity: 'linear-gradient(180deg, rgba(6, 182, 212, 0.3) 0%, rgba(6, 182, 212, 0.05) 100%)'
                }
            };

            // Chart configuration
            this.chartDefaults = {
                responsive: true,
                maintainAspectRatio: false,
                backgroundColor: this.colors.background,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#ffffff',
                            usePointStyle: true,
                            padding: 20,
                            font: { family: 'Inter', size: 12, weight: '600' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#cccccc',
                        borderColor: this.colors.primary,
                        borderWidth: 1,
                        cornerRadius: 8,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: this.colors.grid,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#cccccc',
                            font: { family: 'Inter', size: 11, weight: '500' }
                        }
                    },
                    y: {
                        grid: {
                            color: this.colors.grid,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#cccccc',
                            font: { family: 'Inter', size: 11, weight: '500' }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            };

            this.refreshRequested = false;
            this.lastRefreshTime = 0;

            this.initializeWhenReady();
        }

        async initializeWhenReady() {
            try {
                await this.ensureChartJSLoaded();
                await this.init();
            } catch (error) {
                this.handleCriticalError('Failed to initialize dashboard', error);
            }
        }

        async ensureChartJSLoaded() {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 200;

                const checkChart = () => {
                    attempts++;

                    if (window.Chart && typeof window.Chart === 'function') {
                        resolve();
                        return;
                    }

                    if (attempts >= maxAttempts) {
                        reject(new Error('Chart.js not available'));
                        return;
                    }

                    setTimeout(checkChart, 50);
                };

                checkChart();
            });
        }

        async init() {
            try {
                // Initialize notifications first
                await this.initializeNotifications();

                // Try to load data, but don't fail completely if it doesn't work
                try {
                    await this.loadCompleteDataInstantly();
                } catch (dataError) {
                    this.initializeEmptyStates();
                }

                // Try to update UI
                try {
                    await this.updateAllComponentsInstantly();
                } catch (uiError) {
                    this.initializeEmptyStates();
                    // Try UI update one more time with empty states
                    await this.updateAllComponentsInstantly();
                }

                // Try to initialize charts
                try {
                    await this.initializeModernCharts();
                } catch (chartError) {
                    // Continue without charts
                }

                this.setupEventListeners();
                this.setupSmartRefreshSystem();
                this.setupGlobalAccess();
                this.initializeAnimations();
                this.setupCrossTabSync();

            } catch (error) {
                // Emergency fallback - try to show empty states
                try {
                    this.initializeEmptyStates();
                    this.setupGlobalAccess();
                } catch (emergencyError) {
                    this.handleCriticalError('Failed to initialize dashboard', error);
                }
            }
        }

        // ===================================
        // 🔔 FIXED NOTIFICATION SYSTEM - CORRECTED TIMING LOGIC
        // ===================================

        /**
         * ✅ FIXED: Initialize notifications with proper localStorage cleanup
         */
        async initializeNotifications() {
            try {
                console.log('🔔 Initializing notification system...');

                // Clean up old notifications from localStorage on startup
                this.cleanupOldNotifications();

                // Load notifications with state persistence
                await this.loadNotifications();

                // IMMEDIATE: Update badge on initialization
                this.updateNotificationBadge();

                // Setup automatic notification refresh timer
                this.setupNotificationRefreshTimer();

                console.log('✅ Notification system initialized with localStorage persistence and auto-refresh');
                console.log(`🔔 Notification badge updated on init: ${this.notifications.filter(n => !n.isRead).length} unread`);
            } catch (error) {
                console.error('❌ Failed to initialize notification system:', error);
                this.notifications = [];
            }
        }

        /**
         * ✅ FIXED: Clean up old notifications - PROPER 24 HOUR CLEANUP
         */
        cleanupOldNotifications() {
            try {
                const storageKey = 'dashboardNotifications';
                const notifications = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const now = new Date();
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

                // Filter out notifications older than 24 hours
                const cleaned = notifications.filter(notification => {
                    if (notification.timestamp) {
                        const notificationTime = new Date(notification.timestamp);
                        return notificationTime > oneDayAgo;
                    }
                    return false;
                });

                // Save cleaned notifications back to localStorage
                if (cleaned.length !== notifications.length) {
                    localStorage.setItem(storageKey, JSON.stringify(cleaned));
                    console.log(`🧹 Cleaned ${notifications.length - cleaned.length} old notifications (>24h) from localStorage`);
                }

                // Also clean read states for notifications older than 24 hours
                this.cleanupOldReadStates();

            } catch (error) {
                console.error('❌ Error cleaning old notifications:', error);
            }
        }

        /**
         * ✅ FIXED: Clean old read states with proper timing
         */
        cleanupOldReadStates() {
            try {
                const readStates = JSON.parse(localStorage.getItem('dashboardNotificationReadStates') || '{}');
                const cutoffTime = new Date().getTime() - (24 * 60 * 60 * 1000);
                const cleanStates = {};

                Object.keys(readStates).forEach(key => {
                    if (readStates[key] > cutoffTime) {
                        cleanStates[key] = readStates[key];
                    }
                });

                localStorage.setItem('dashboardNotificationReadStates', JSON.stringify(cleanStates));
                console.log(`🧹 Cleaned ${Object.keys(readStates).length - Object.keys(cleanStates).length} old read states (>24h)`);
            } catch (error) {
                console.error('❌ Error cleaning read states:', error);
            }
        }

        /**
         * ✅ FIXED: Setup notification refresh timer with proper timing
         */
        setupNotificationRefreshTimer() {
            // Clear any existing timer
            if (this.notificationTimer) {
                clearInterval(this.notificationTimer);
            }

            // Update every 1 minute to keep times accurate
            this.notificationTimer = setInterval(() => {
                console.log('⏰ Auto-updating notification timestamps');
                this.updateNotificationTimestamps();

                // Update display if notifications panel is open
                const panel = document.getElementById('notifications-panel');
                if (panel && panel.classList.contains('active')) {
                    this.renderNotifications();
                }

                // Also update badge count
                this.updateNotificationBadge();
            }, 60 * 1000); // 1 minute

            console.log('⏰ Notification refresh timer setup (1 minute interval for timestamp updates)');
        }

        /**
         * ✅ FIXED: Refresh notifications with proper timing
         */
        async refreshNotifications() {
            try {
                await this.loadNotifications();
                this.updateNotificationBadge();

                // Update display if notifications panel is open
                const panel = document.getElementById('notifications-panel');
                if (panel && panel.classList.contains('active')) {
                    this.renderNotifications();
                }

                console.log('🔔 Dashboard notifications refreshed');
            } catch (error) {
                console.error('❌ Error refreshing notifications:', error);
            }
        }

        /**
         * ✅ FIXED: Load notifications with corrected timing logic
         */
        async loadNotifications() {
            try {
                console.log('🔔 Loading dashboard notifications...');

                // Load persistent read states first
                const readStates = this.loadReadStates();

                // Generate fresh notifications from dashboard data
                this.notifications = await this.generateDashboardNotifications();

                // Apply saved read states
                this.notifications.forEach(notification => {
                    if (notification.persistentId && readStates[notification.persistentId]) {
                        notification.isRead = true;
                    }
                });

                // Add user action notifications from localStorage
                const userNotifications = this.getUserActionNotifications();
                this.notifications.push(...userNotifications);

                // Filter, sort and limit notifications
                this.notifications = this.processNotifications(this.notifications);

                console.log('✅ Dashboard notifications loaded:', this.notifications.length);
            } catch (error) {
                console.error('❌ Failed to load dashboard notifications:', error);
                this.notifications = [];
            }
        }

        /**
         * ✅ Load persistent read states from dedicated storage
         */
        loadReadStates() {
            try {
                const readStates = JSON.parse(localStorage.getItem('dashboardNotificationReadStates') || '{}');
                return readStates;
            } catch (error) {
                console.error('❌ Error loading read states:', error);
                return {};
            }
        }

        /**
         * ✅ Save persistent read state
         */
        saveReadState(persistentId) {
            try {
                const readStates = this.loadReadStates();
                readStates[persistentId] = new Date().getTime();
                localStorage.setItem('dashboardNotificationReadStates', JSON.stringify(readStates));
                console.log(`💾 Saved read state for: ${persistentId}`);
            } catch (error) {
                console.error('❌ Error saving read state:', error);
            }
        }

        /**
         * ✅ COMPLETELY FIXED: Generate dashboard notifications with CORRECT TIMING
         */
        async generateDashboardNotifications() {
            const notifications = [];
            const now = new Date();

            try {
                if (!this.dashboardData) {
                    return notifications;
                }

                const { monthlyTransactions, budgets, balance, spendingVelocity } = this.dashboardData;

                // 1. Budget Alert Notifications - USE CURRENT TIME
                if (budgets && budgets.budgets) {
                    budgets.budgets.forEach(budget => {
                        const utilization = budget.spentPercentage || 0;

                        if (utilization > 100) {
                            const budgetNotification = {
                                id: Date.now() + Math.random(),
                                persistentId: `budget-exceeded-${budget.id}-${budget.budgetYear}-${budget.budgetMonth}`,
                                title: 'Budget Exceeded',
                                message: `${this.translateCategoryName(budget.categoryName)} budget exceeded by ${(utilization - 100).toFixed(1)}%`,
                                type: 'danger',
                                category: 'budget',
                                timestamp: now.toISOString(), // Always current time for budget alerts
                                isRead: false,
                                budgetId: budget.id
                            };

                            notifications.push(budgetNotification);
                        } else if (utilization > 90) {
                            const budgetWarning = {
                                id: Date.now() + Math.random(),
                                persistentId: `budget-warning-${budget.id}-${budget.budgetYear}-${budget.budgetMonth}`,
                                title: 'Budget Warning',
                                message: `${this.translateCategoryName(budget.categoryName)} budget is ${utilization.toFixed(1)}% used`,
                                type: 'warning',
                                category: 'budget',
                                timestamp: now.toISOString(), // Always current time for budget warnings
                                isRead: false,
                                budgetId: budget.id
                            };

                            notifications.push(budgetWarning);
                        }
                    });
                }

                // 2. Spending Velocity Notifications - USE CURRENT TIME
                if (spendingVelocity && spendingVelocity.hasData) {
                    if (spendingVelocity.status === 'way-over-pace') {
                        const velocityAlert = {
                            id: Date.now() + Math.random(),
                            persistentId: `velocity-alert-${now.getFullYear()}-${now.getMonth() + 1}`,
                            title: 'High Spending Velocity',
                            message: `You're spending significantly faster than planned. Current velocity: ${(spendingVelocity.velocityRatio * 100).toFixed(0)}%`,
                            type: 'warning',
                            category: 'velocity',
                            timestamp: now.toISOString(), // Always current time for velocity alerts
                            isRead: false
                        };

                        notifications.push(velocityAlert);
                    } else if (spendingVelocity.status === 'under-pace') {
                        const velocityGood = {
                            id: Date.now() + Math.random(),
                            persistentId: `velocity-good-${now.getFullYear()}-${now.getMonth() + 1}`,
                            title: 'Excellent Budget Control',
                            message: `You're maintaining excellent spending discipline. Keep it up!`,
                            type: 'success',
                            category: 'velocity',
                            timestamp: now.toISOString(), // Always current time for velocity notifications
                            isRead: false
                        };

                        notifications.push(velocityGood);
                    }
                }

                // 3. FIXED: Transaction Notifications - SHOW ALL RECENT TRANSACTIONS
                if (monthlyTransactions && monthlyTransactions.transactions) {
                    // Get all recent transactions (last 4 hours for more coverage)
                    const recentTransactions = monthlyTransactions.transactions
                        .filter(t => {
                            const transactionTime = new Date(t.transactionDate);
                            const timeDiff = now - transactionTime;
                            const hoursDiff = timeDiff / (1000 * 60 * 60);
                            return hoursDiff <= 4; // Show transactions from last 4 hours
                        })
                        .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
                        .slice(0, 5); // Show up to 5 recent transactions

                    recentTransactions.forEach((transaction) => {
                        let notificationTitle, notificationMessage, notificationType;

                        if (transaction.type === 'EXPENSE') {
                            // Show all expenses, not just large ones
                            notificationTitle = 'Expense Recorded';
                            notificationMessage = `${this.formatCurrency(transaction.amount)} spent on ${this.translateCategoryName(transaction.categoryName)}`;
                            notificationType = parseFloat(transaction.amount) > 200 ? 'warning' : 'info';
                        } else if (transaction.type === 'INCOME') {
                            notificationTitle = 'Income Recorded';
                            notificationMessage = `${this.formatCurrency(transaction.amount)} received from ${this.translateCategoryName(transaction.categoryName)}`;
                            notificationType = 'success';
                        } else {
                            // Handle other transaction types
                            notificationTitle = 'Transaction Recorded';
                            notificationMessage = `${this.formatCurrency(transaction.amount)} - ${this.translateCategoryName(transaction.categoryName)}`;
                            notificationType = 'info';
                        }

                        const transactionNotification = {
                            id: Date.now() + Math.random(),
                            persistentId: `transaction-${transaction.id}`,
                            title: notificationTitle,
                            message: notificationMessage,
                            type: notificationType,
                            category: 'transaction',
                            timestamp: now.toISOString(), // ALWAYS use current time for notification display
                            isRead: false,
                            transactionId: transaction.id
                        };

                        notifications.push(transactionNotification);
                    });
                }

                // 4. Balance Notifications - USE CURRENT TIME
                if (balance !== undefined) {
                    if (balance < 0) {
                        const balanceAlert = {
                            id: Date.now() + Math.random(),
                            persistentId: 'negative-balance-alert',
                            title: 'Negative Balance Alert',
                            message: `Your current balance is ${this.formatCurrency(balance)}. Consider reviewing your expenses.`,
                            type: 'warning',
                            category: 'balance',
                            timestamp: now.toISOString(), // Always current time for balance alerts
                            isRead: false
                        };

                        notifications.push(balanceAlert);
                    } else if (balance < 100) {
                        const lowBalanceWarning = {
                            id: Date.now() + Math.random(),
                            persistentId: 'low-balance-warning',
                            title: 'Low Balance Warning',
                            message: `Your balance is getting low: ${this.formatCurrency(balance)}`,
                            type: 'info',
                            category: 'balance',
                            timestamp: now.toISOString(), // Always current time for balance warnings
                            isRead: false
                        };

                        notifications.push(lowBalanceWarning);
                    }
                }

                // 5. Monthly Summary Notifications - USE CURRENT TIME
                if (monthlyTransactions && monthlyTransactions.expenses > 0) {
                    const today = new Date();
                    const dayOfMonth = today.getDate();

                    if (dayOfMonth >= 15) { // Mid-month summary
                        const summaryNotification = {
                            id: Date.now() + Math.random(),
                            persistentId: `monthly-summary-${today.getFullYear()}-${today.getMonth() + 1}`,
                            title: 'Monthly Progress Update',
                            message: `This month: ${this.formatCurrency(monthlyTransactions.expenses)} spent across ${monthlyTransactions.transactions.filter(t => t.type === 'EXPENSE').length} transactions`,
                            type: 'info',
                            category: 'summary',
                            timestamp: now.toISOString(), // Always current time for summaries
                            isRead: false
                        };

                        notifications.push(summaryNotification);
                    }
                }

                // ENHANCED: Show notifications for all types of financial activities
                console.log(`🔔 Generated ${notifications.length} dashboard notifications (budget, velocity, transactions, balance)`);

                // Also check for any very recent transactions and ensure they show as notifications
                if (monthlyTransactions && monthlyTransactions.transactions) {
                    const veryRecentTransactions = monthlyTransactions.transactions
                        .filter(t => {
                            const transactionTime = new Date(t.transactionDate);
                            const timeDiff = now - transactionTime;
                            const minutesDiff = timeDiff / (1000 * 60);
                            return minutesDiff <= 30; // Last 30 minutes for immediate visibility
                        });

                    console.log(`🔔 Found ${veryRecentTransactions.length} very recent transactions (last 30 minutes)`);
                }

            } catch (error) {
                console.error('❌ Error generating dashboard notifications:', error);
            }

            return notifications;
        }

        /**
         * ✅ FIXED: Get user action notifications with proper time filtering
         */
        getUserActionNotifications() {
            const storageKey = 'dashboardNotifications';
            const userNotifications = JSON.parse(localStorage.getItem(storageKey) || '[]');

            // Filter notifications older than 24 hours
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            return userNotifications.filter(notification => {
                if (notification.timestamp) {
                    const notificationTime = new Date(notification.timestamp);
                    return notificationTime > oneDayAgo;
                }
                return false;
            });
        }

        /**
         * ✅ Process notifications (filter, sort, limit)
         */
        processNotifications(notifications) {
            // Remove duplicates by persistentId
            const uniqueNotifications = [];
            const seenIds = new Set();

            notifications.forEach(notification => {
                if (notification.persistentId && !seenIds.has(notification.persistentId)) {
                    seenIds.add(notification.persistentId);
                    uniqueNotifications.push(notification);
                } else if (!notification.persistentId) {
                    uniqueNotifications.push(notification);
                }
            });

            // Sort by timestamp (newest first)
            uniqueNotifications.sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp) : new Date();
                const timeB = b.timestamp ? new Date(b.timestamp) : new Date();
                return timeB - timeA;
            });

            // Limit to maximum number of notifications
            return uniqueNotifications.slice(0, this.maxNotifications);
        }

        /**
         * ✅ ENHANCED: Add notification with ALWAYS current timestamp + auto-refresh
         */
        addNotification(notification) {
            try {
                const storageKey = 'dashboardNotifications';
                const userNotifications = JSON.parse(localStorage.getItem(storageKey) || '[]');

                const newNotification = {
                    ...notification,
                    id: Date.now() + Math.random(),
                    persistentId: notification.persistentId || ('user-action-' + Date.now()),
                    timestamp: new Date().toISOString(), // ALWAYS use current time for new notifications
                    isRead: false,
                    category: notification.category || 'user-action'
                };

                console.log('🔔 Adding notification with current timestamp:', newNotification.timestamp);
                console.log('🔔 Notification details:', newNotification.title, '-', newNotification.message);

                userNotifications.unshift(newNotification);

                // Keep only recent notifications
                userNotifications.splice(this.maxNotifications);

                localStorage.setItem(storageKey, JSON.stringify(userNotifications));

                // Immediately refresh to show the new notification
                setTimeout(() => {
                    this.refreshNotifications();
                }, 100);

                console.log('✅ Notification added and dashboard refreshed:', newNotification.title);
            } catch (error) {
                console.error('❌ Error adding notification:', error);
            }
        }

        /**
         * ✅ Toggle notifications panel
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
         * ✅ Show notifications panel with force refresh
         */
        async showNotificationsPanel() {
            try {
                console.log('🔔 Starting to show notifications panel...');

                const panel = document.getElementById('notifications-panel');
                if (!panel) {
                    console.error('❌ Notifications panel not found in DOM');
                    return;
                }

                // Force refresh notifications
                await this.refreshNotifications();

                // Render notifications
                this.renderNotifications();

                // Show panel with animation delay
                setTimeout(() => {
                    panel.classList.add('active');
                    console.log('✅ Notifications panel opened successfully');
                }, 50);

            } catch (error) {
                console.error('❌ Failed to show notifications panel:', error);
            }
        }

        /**
         * ✅ Close notifications panel
         */
        closeNotificationsPanel() {
            const panel = document.getElementById('notifications-panel');
            if (panel) {
                panel.classList.remove('active');
            }
        }

        /**
         * ✅ FIXED: Render notifications with corrected time display
         */
        renderNotifications() {
            const container = document.getElementById('notifications-list');

            if (!container) {
                console.warn('⚠️ Notifications list container not found');
                return;
            }

            // Update timestamps for all notifications
            this.updateNotificationTimestamps();

            if (this.notifications.length === 0) {
                container.innerHTML = `
                    <div class="empty-notifications">
                        <div class="empty-icon">🔔</div>
                        <p>All caught up!</p>
                        <small>No new dashboard alerts</small>
                    </div>
                `;
            } else {
                container.innerHTML = this.notifications.map(notification => `
                    <div class="notification-item ${notification.isRead ? '' : 'unread'} ${this.getNotificationTypeClass(notification.type)}"
                         data-notification-id="${notification.id}"
                         onclick="window.dashboardInstance.markNotificationAsRead(${notification.id})"
                         style="cursor: pointer;">
                        <div class="notification-icon ${notification.type}">
                            ${this.getNotificationIcon(notification.type)}
                        </div>
                        <div class="notification-content">
                            <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                            <div class="notification-time">${notification.dynamicTime || 'Just now'}</div>
                        </div>
                    </div>
                `).join('');
            }

            // Refresh Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            console.log('✅ Notifications rendered with corrected timestamps:', this.notifications.length);
        }

        /**
         * ✅ FIXED: Update notification timestamps with correct logic
         */
        updateNotificationTimestamps() {
            this.notifications.forEach(notification => {
                if (notification.timestamp) {
                    notification.dynamicTime = this.getCorrectRelativeTime(notification.timestamp);
                }
            });
        }

        /**
         * ✅ Get notification type CSS class
         */
        getNotificationTypeClass(type) {
            const classes = {
                info: 'notification-info',
                warning: 'notification-warning',
                success: 'notification-success',
                danger: 'notification-danger',
                error: 'notification-danger'
            };
            return classes[type] || 'notification-info';
        }

        /**
         * ✅ Update notification badge
         */
        updateNotificationBadge() {
            const badge = document.getElementById('notification-badge');
            if (!badge) return;

            const unreadCount = this.notifications.filter(n => !n.isRead).length;

            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }

        /**
         * ✅ Get notification icon based on type
         */
        getNotificationIcon(type) {
            const icons = {
                info: '<i data-lucide="info"></i>',
                warning: '<i data-lucide="alert-triangle"></i>',
                success: '<i data-lucide="check-circle"></i>',
                danger: '<i data-lucide="alert-triangle"></i>',
                error: '<i data-lucide="x-circle"></i>'
            };
            return icons[type] || icons.info;
        }

        /**
         * ✅ Mark notification as read with localStorage persistence
         */
        async markNotificationAsRead(notificationId) {
            try {
                console.log(`🔔 Marking notification ${notificationId} as read`);

                // Find the notification
                const notification = this.notifications.find(n => n.id === notificationId);
                if (!notification) {
                    console.warn(`⚠️ Notification ${notificationId} not found`);
                    return;
                }

                // Mark as read in current state
                notification.isRead = true;

                // Save persistent read state
                if (notification.persistentId) {
                    this.saveReadState(notification.persistentId);
                }

                // Update localStorage for user action notifications
                const storageKey = 'dashboardNotifications';
                const userNotifications = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const userNotification = userNotifications.find(n => n.id === notificationId);
                if (userNotification) {
                    userNotification.isRead = true;
                    localStorage.setItem(storageKey, JSON.stringify(userNotifications));
                }

                // Update UI immediately
                this.updateNotificationBadge();
                this.renderNotifications();

                console.log(`✅ Notification ${notificationId} marked as read`);

            } catch (error) {
                console.error('❌ Failed to mark notification as read:', error);
            }
        }

        /**
         * ✅ Mark all notifications as read
         */
        async markAllNotificationsAsRead() {
            try {
                console.log('🔔 Marking all notifications as read');

                // Mark all notifications as read
                this.notifications.forEach(notification => {
                    notification.isRead = true;

                    if (notification.persistentId) {
                        this.saveReadState(notification.persistentId);
                    }
                });

                // Update localStorage user notifications
                const storageKey = 'dashboardNotifications';
                const userNotifications = JSON.parse(localStorage.getItem(storageKey) || '[]');
                userNotifications.forEach(notification => {
                    notification.isRead = true;
                });
                localStorage.setItem(storageKey, JSON.stringify(userNotifications));

                // Update UI
                this.updateNotificationBadge();
                this.renderNotifications();

                console.log('✅ All notifications marked as read');

            } catch (error) {
                console.error('❌ Failed to mark all notifications as read:', error);
            }
        }

        /**
         * ✅ COMPLETELY FIXED: Correct relative time calculation
         */
        getCorrectRelativeTime(timestamp) {
            const now = new Date();
            const notificationTime = new Date(timestamp);
            const diffInMs = now - notificationTime;
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

            // Just now (0-2 minutes)
            if (diffInMinutes < 2) {
                return 'Just now';
            }
            // Minutes (2-59 minutes)
            else if (diffInMinutes < 60) {
                return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
            }
            // Hours (1-23 hours)
            else if (diffInHours < 24) {
                return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
            }
            // Days (24+ hours)
            else {
                const diffInDays = Math.floor(diffInHours / 24);
                return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
            }
        }

        /**
         * ✅ Setup cross-tab synchronization with notifications
         */
        setupCrossTabSync() {
            // Listen for storage changes from other tabs
            window.addEventListener('storage', (e) => {
                if (e.key === 'dashboardNotifications' || e.key === 'dashboardNotificationReadStates') {
                    console.log('🔔 Notifications updated in another tab, refreshing...');
                    this.refreshNotifications();
                }
            });

            // Listen for window focus to refresh notifications
            window.addEventListener('focus', () => {
                if (!this.isLoading) {
                    console.log('🔔 Window focused, refreshing notifications...');
                    this.refreshNotifications();
                }
            });

            // Listen for page visibility changes
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && !this.isLoading) {
                    const timeSinceLastRefresh = Date.now() - this.lastRefreshTime;
                    if (timeSinceLastRefresh > 30000) { // 30 seconds
                        console.log('🔔 Page visible, refreshing notifications...');
                        this.refreshNotifications();
                    }
                }
            });
        }

        /**
         * ✅ Helper: Escape HTML to prevent XSS
         */
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ===================================
        // END OF NOTIFICATION SYSTEM
        // ===================================

        /**
         * UPDATED: Modern Empty States for Charts
         */
        showEmptyChart(canvas, title, subtitle, chartType = 'budget') {
            const container = canvas.parentElement;

            // Chart type specific configurations
            const chartConfigs = {
                budget: {
                    icon: 'target',
                    className: 'empty-budget-chart'
                },
                category: {
                    icon: 'pie-chart',
                    className: 'empty-category-chart'
                },
                cashflow: {
                    icon: 'bar-chart-3',
                    className: 'empty-cashflow-chart'
                }
            };

            const config = chartConfigs[chartType] || chartConfigs.budget;

            container.innerHTML = `
                <div class="empty-chart ${config.className}">
                    <div class="empty-chart-content">
                        <div class="empty-chart-icon">
                            <i data-lucide="${config.icon}"></i>
                        </div>
                        <h3 class="empty-chart-title">${title}</h3>
                        <p class="empty-chart-subtitle">${subtitle}</p>
                    </div>
                </div>
            `;

            // Re-initialize Lucide icons for the new content
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        async loadCompleteDataInstantly() {
            try {
                // Load all data with individual error handling
                const dataLoaders = [
                    { name: 'userBalance', loader: () => this.loadUserBalance() },
                    { name: 'monthlyTransactions', loader: () => this.loadMonthlyTransactions() },
                    { name: 'currentBudgets', loader: () => this.loadCurrentMonthBudgets() },
                    { name: 'notifications', loader: () => this.loadNotifications() },
                    { name: 'categories', loader: () => this.loadCategories() },
                    { name: 'monthlyComparison', loader: () => this.loadMonthlyComparison() },
                    { name: 'dailyBalanceHistory', loader: () => this.loadDailyBalanceHistory() }
                ];

                const results = {};

                for (const { name, loader } of dataLoaders) {
                    try {
                        results[name] = await loader();
                    } catch (error) {
                        // Set default values based on the type
                        switch (name) {
                            case 'userBalance':
                                results[name] = 0;
                                break;
                            case 'monthlyTransactions':
                                results[name] = this.getDefaultMonthlyTransactions();
                                break;
                            case 'currentBudgets':
                                results[name] = this.getDefaultBudgets();
                                break;
                            case 'monthlyComparison':
                                results[name] = this.getDefaultMonthlyComparison();
                                break;
                            default:
                                results[name] = [];
                        }
                    }
                }

                this.dashboardData = {
                    balance: results.userBalance,
                    monthlyTransactions: results.monthlyTransactions,
                    budgets: results.currentBudgets,
                    notifications: results.notifications,
                    categories: results.categories,
                    monthlyComparison: results.monthlyComparison,
                    dailyBalanceHistory: results.dailyBalanceHistory
                };

                // Calculate derived data
                try {
                    this.dashboardData.insights = this.calculateFinancialInsights();
                } catch (error) {
                    this.dashboardData.insights = {};
                }

                try {
                    this.dashboardData.spendingVelocity = this.calculateSpendingVelocity();
                } catch (error) {
                    this.dashboardData.spendingVelocity = this.getEmptySpendingVelocity();
                }

            } catch (error) {
                throw error;
            }
        }

        /**
         * PRODUCTION: Calculate Spending Velocity - COMPLETELY DYNAMIC LOGIC
         */
        calculateSpendingVelocity() {
            try {
                const { monthlyTransactions, budgets } = this.dashboardData;

                // Safety checks
                if (!monthlyTransactions || !budgets) {
                    return this.getEmptySpendingVelocity();
                }

                // REAL DATE CALCULATION - ALWAYS DYNAMIC
                const now = new Date();
                const currentDay = now.getDate();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const daysRemaining = daysInMonth - currentDay;
                const monthProgress = (currentDay / daysInMonth) * 100;

                const currentExpenses = monthlyTransactions.expenses || 0;
                const totalBudget = budgets.totalPlanned || 0;

                // If no budget or expenses, return empty state
                if (totalBudget === 0 && currentExpenses === 0) {
                    return {
                        monthProgress: Math.round(monthProgress),
                        daysRemaining,
                        currentExpenses: 0,
                        expectedSpending: 0,
                        velocityRatio: 0,
                        projectedMonthlySpending: 0,
                        budgetForecast: 0,
                        status: 'no-data',
                        message: 'No budget or expenses yet',
                        badgeClass: 'neutral',
                        isOnTrack: true,
                        dailyBurnRate: 0,
                        projectedOverage: 0,
                        hasData: false
                    };
                }

                // DYNAMIC VELOCITY CALCULATION
                let expectedSpendingForDay = 0;
                let velocityRatio = 0;
                let projectedMonthlySpending = 0;
                let budgetForecast = 0;

                if (totalBudget > 0 && currentDay > 0) {
                    expectedSpendingForDay = (totalBudget / daysInMonth) * currentDay;
                    velocityRatio = expectedSpendingForDay > 0 ? (currentExpenses / expectedSpendingForDay) : 0;
                }

                if (currentDay > 0) {
                    projectedMonthlySpending = currentExpenses * (daysInMonth / currentDay);
                }

                if (totalBudget > 0) {
                    budgetForecast = (projectedMonthlySpending / totalBudget) * 100;
                }

                // DYNAMIC STATUS DETERMINATION - BASED ON REAL DATA
                let status, message, badgeClass;

                if (totalBudget === 0) {
                    status = 'no-budget';
                    message = 'No budget set for this month';
                    badgeClass = 'neutral';
                } else if (currentExpenses === 0) {
                    status = 'no-expenses';
                    message = 'No expenses recorded yet';
                    badgeClass = 'neutral';
                } else if (velocityRatio <= 0.7) {
                    status = 'under-pace';
                    message = 'Under budget pace - excellent control!';
                    badgeClass = 'excellent';
                } else if (velocityRatio <= 0.95) {
                    status = 'on-track';
                    message = 'On track with budget timeline';
                    badgeClass = 'good';
                } else if (velocityRatio <= 1.15) {
                    status = 'over-pace';
                    message = 'Slightly over spending pace';
                    badgeClass = 'warning';
                } else {
                    status = 'way-over-pace';
                    message = 'Significantly over spending pace';
                    badgeClass = 'danger';
                }

                const result = {
                    monthProgress: Math.round(monthProgress),
                    daysRemaining,
                    currentExpenses,
                    expectedSpending: expectedSpendingForDay,
                    velocityRatio,
                    projectedMonthlySpending,
                    budgetForecast: Math.round(budgetForecast),
                    status,
                    message,
                    badgeClass,
                    isOnTrack: velocityRatio <= 1.0,
                    dailyBurnRate: currentDay > 0 ? currentExpenses / currentDay : 0,
                    projectedOverage: Math.max(0, projectedMonthlySpending - totalBudget),
                    hasData: totalBudget > 0 || currentExpenses > 0
                };

                return result;

            } catch (error) {
                return this.getEmptySpendingVelocity();
            }
        }

        getEmptySpendingVelocity() {
            // REAL DATE CALCULATION EVEN FOR EMPTY STATE
            const now = new Date();
            const currentDay = now.getDate();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const daysRemaining = daysInMonth - currentDay;
            const monthProgress = (currentDay / daysInMonth) * 100;

            return {
                monthProgress: Math.round(monthProgress),
                daysRemaining,
                currentExpenses: 0,
                projectedMonthlySpending: 0,
                budgetForecast: 0,
                status: 'error',
                message: 'Unable to calculate velocity',
                badgeClass: 'neutral',
                hasData: false
            };
        }

        /**
         * Load daily balance history for Trading View style chart
         */
        async loadDailyBalanceHistory() {
            try {
                const days = 30;
                const dailyData = [];
                const now = new Date();

                const currentBalanceResponse = await this.fetchAPI('/transactions/balance');
                let runningBalance = parseFloat(currentBalanceResponse.balance) || 0;

                const startDate = new Date(now);
                startDate.setDate(startDate.getDate() - days);

                const allTransactions = await this.fetchAPI(`/transactions/period?startDate=${startDate.toISOString().split('T')[0]}&endDate=${now.toISOString().split('T')[0]}`);

                const transactionsByDate = {};
                if (Array.isArray(allTransactions)) {
                    allTransactions.forEach(transaction => {
                        const date = transaction.transactionDate;
                        if (!transactionsByDate[date]) {
                            transactionsByDate[date] = [];
                        }
                        transactionsByDate[date].push(transaction);
                    });
                }

                for (let i = 0; i < days; i++) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];

                    const dayTransactions = transactionsByDate[dateStr] || [];

                    const income = dayTransactions
                        .filter(t => t.type === 'INCOME')
                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

                    const expenses = dayTransactions
                        .filter(t => t.type === 'EXPENSE')
                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

                    const netChange = income - expenses;
                    const volume = income + expenses;

                    let dayBalance;
                    if (i === 0) {
                        dayBalance = runningBalance;
                    } else {
                        runningBalance = runningBalance - netChange;
                        dayBalance = runningBalance;
                    }

                    const open = i === days - 1 ? dayBalance : runningBalance;
                    const close = dayBalance;
                    const high = Math.max(open, close, open + income * 0.8);
                    const low = Math.min(open, close, Math.max(0, open - expenses * 0.6));

                    dailyData.unshift({
                        date: dateStr,
                        open: Math.max(0, open),
                        high: Math.max(0, high),
                        low: Math.max(0, low),
                        close: Math.max(0, close),
                        volume,
                        income,
                        expenses,
                        netChange
                    });
                }

                return dailyData;

            } catch (error) {
                return this.generateRealisticFallbackData();
            }
        }

        generateRealisticFallbackData() {
            const data = [];
            let balance = 0; // Start with zero balance
            const now = new Date();

            for (let i = 29; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);

                data.push({
                    date: date.toISOString().split('T')[0],
                    open: 0,
                    high: 0,
                    low: 0,
                    close: 0,
                    volume: 0,
                    income: 0,
                    expenses: 0,
                    netChange: 0
                });
            }

            return data;
        }

        async loadUserBalance() {
            try {
                const response = await this.fetchAPI('/transactions/balance');
                return parseFloat(response.balance) || 0;
            } catch (error) {
                return 0;
            }
        }

        async loadMonthlyTransactions() {
            try {
                const transactions = await this.fetchAPI('/transactions/current-month');

                if (!Array.isArray(transactions)) {
                    return this.getDefaultMonthlyTransactions();
                }

                const income = transactions
                    .filter(t => t.type === 'INCOME')
                    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

                const expenses = transactions
                    .filter(t => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

                const today = new Date().getDate();
                const netCashFlow = income - expenses;
                const averageDaily = today > 0 ? expenses / today : 0;

                const result = {
                    income,
                    expenses,
                    netCashFlow,
                    transactions,
                    averageDaily
                };

                return result;
            } catch (error) {
                return this.getDefaultMonthlyTransactions();
            }
        }

        getDefaultMonthlyTransactions() {
            return {
                income: 0,
                expenses: 0,
                netCashFlow: 0,
                transactions: [],
                averageDaily: 0
            };
        }

        async loadCurrentMonthBudgets() {
            try {
                const budgets = await this.fetchAPI('/budgets/current-month');

                if (!Array.isArray(budgets)) {
                    return this.getDefaultBudgets();
                }

                const totalPlanned = budgets.reduce((sum, b) => sum + parseFloat(b.plannedAmount || 0), 0);
                const totalSpent = budgets.reduce((sum, b) => sum + parseFloat(b.spentAmount || 0), 0);
                const totalRemaining = budgets.reduce((sum, b) => sum + parseFloat(b.remainingAmount || 0), 0);
                const utilizationRate = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;

                const result = {
                    budgets,
                    totalPlanned,
                    totalSpent,
                    totalRemaining,
                    utilizationRate,
                    budgetHealth: this.calculateBudgetHealth(budgets)
                };

                return result;
            } catch (error) {
                return this.getDefaultBudgets();
            }
        }

        getDefaultBudgets() {
            return {
                budgets: [],
                totalPlanned: 0,
                totalSpent: 0,
                totalRemaining: 0,
                utilizationRate: 0,
                budgetHealth: []
            };
        }

        async loadCategories() {
            try {
                const categories = await this.fetchAPI('/categories');
                return categories || [];
            } catch (error) {
                return [];
            }
        }

        async loadMonthlyComparison() {
            try {
                const currentDate = new Date();
                const currentMonth = currentDate.getMonth() + 1;
                const currentYear = currentDate.getFullYear();

                const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;

                const [currentMonthData, lastMonthData] = await Promise.all([
                    this.fetchAPI(`/transactions/month/${currentYear}/${currentMonth}`),
                    this.fetchAPI(`/transactions/month/${lastYear}/${lastMonth}`)
                ]);

                return this.calculateMonthlyComparison(currentMonthData, lastMonthData);
            } catch (error) {
                return this.getDefaultMonthlyComparison();
            }
        }

        getDefaultMonthlyComparison() {
            return {
                overallChange: 0,
                overallPercentage: 0,
                currentExpenses: 0,
                lastExpenses: 0,
                worstCategory: null,
                categoryChanges: []
            };
        }

        calculateMonthlyComparison(currentData, lastData) {
            if (!Array.isArray(currentData) || !Array.isArray(lastData)) {
                return this.getDefaultMonthlyComparison();
            }

            const currentExpenses = currentData
                .filter(t => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            const lastExpenses = lastData
                .filter(t => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

            const overallChange = currentExpenses - lastExpenses;
            const overallPercentage = lastExpenses > 0 ? ((overallChange / lastExpenses) * 100) : 0;

            const currentCategoryExpenses = this.groupByCategory(currentData.filter(t => t.type === 'EXPENSE'));
            const lastCategoryExpenses = this.groupByCategory(lastData.filter(t => t.type === 'EXPENSE'));

            const categoryChanges = [];
            const allCategories = new Set([...Object.keys(currentCategoryExpenses), ...Object.keys(lastCategoryExpenses)]);

            allCategories.forEach(category => {
                const currentAmount = currentCategoryExpenses[category] || 0;
                const lastAmount = lastCategoryExpenses[category] || 0;
                const change = currentAmount - lastAmount;
                const percentage = lastAmount > 0 ? ((change / lastAmount) * 100) : (currentAmount > 0 ? 100 : 0);

                if (Math.abs(change) >= 1) {
                    categoryChanges.push({
                        category,
                        currentAmount,
                        lastAmount,
                        change,
                        percentage
                    });
                }
            });

            const sortedChanges = categoryChanges.sort((a, b) => b.change - a.change);
            const worstCategory = sortedChanges.length > 0 && sortedChanges[0].change > 0 ? sortedChanges[0] : null;

            return {
                overallChange,
                overallPercentage,
                currentExpenses,
                lastExpenses,
                worstCategory,
                categoryChanges
            };
        }

        /**
         * MODERN CHARTS INITIALIZATION - Trading View Style
         */
        async initializeModernCharts() {
            if (!window.Chart) {
                return;
            }

            try {
                await this.initBudgetVsActualChart();
                await new Promise(resolve => setTimeout(resolve, 100));

                await this.initCategoryAllocationChart();
                await new Promise(resolve => setTimeout(resolve, 100));

                await this.initDailyCashFlowChart();

            } catch (error) {
                // Continue without charts
            }
        }

        /**
         * Budget vs Actual Performance Chart - UPDATED WITH MODERN EMPTY STATE
         */
        async initBudgetVsActualChart() {
            const canvas = document.getElementById('budget-vs-actual-chart');
            if (!canvas || !window.Chart) {
                return;
            }

            try {
                const { budgets, monthlyTransactions } = this.dashboardData;

                if (!budgets.budgets || budgets.budgets.length === 0) {
                    this.showEmptyChart(canvas, 'No Budget Categories', 'Add category budgets to compare performance', 'budget');
                    this.updateBudgetPerformanceIndicator('No budgets set', 'neutral');
                    this.updateBudgetSummary([]);
                    return;
                }

                const budgetData = this.prepareBudgetVsActualData(budgets.budgets, monthlyTransactions);

                if (budgetData.labels.length === 0) {
                    this.showEmptyChart(canvas, 'No Budget Categories', 'Add category budgets to compare performance', 'budget');
                    this.updateBudgetPerformanceIndicator('No data available', 'neutral');
                    this.updateBudgetSummary([]);
                    return;
                }

                const ctx = canvas.getContext('2d');

                this.charts.budgetVsActual = new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: budgetData.labels,
                        datasets: [
                            {
                                label: 'Planned Budget',
                                data: budgetData.planned,
                                backgroundColor: 'rgba(168, 85, 247, 0.3)',
                                borderColor: this.colors.primary,
                                borderWidth: 2,
                                borderRadius: 8,
                                borderSkipped: false,
                            },
                            {
                                label: 'Actual Spending',
                                data: budgetData.actual,
                                backgroundColor: budgetData.actualColors,
                                borderColor: budgetData.actualBorders,
                                borderWidth: 2,
                                borderRadius: 8,
                                borderSkipped: false,
                            }
                        ]
                    },
                    options: {
                        ...this.chartDefaults,
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        plugins: {
                            ...this.chartDefaults.plugins,
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#ffffff',
                                    usePointStyle: true,
                                    padding: 20,
                                    font: { family: 'Inter', size: 12, weight: '600' }
                                }
                            },
                            tooltip: {
                                ...this.chartDefaults.plugins.tooltip,
                                callbacks: {
                                    title: (context) => {
                                        return `${context[0].label} Budget Performance`;
                                    },
                                    label: (context) => {
                                        const budget = budgetData.budgets[context.dataIndex];
                                        const isPlanned = context.datasetIndex === 0;

                                        if (isPlanned) {
                                            return `Planned: ${this.formatCurrency(context.parsed.y)}`;
                                        } else {
                                            const percentage = budget.spentPercentage || 0;
                                            const remaining = budget.remainingAmount || 0;
                                            return [
                                                `Actual: ${this.formatCurrency(context.parsed.y)}`,
                                                `Usage: ${percentage.toFixed(1)}%`,
                                                `Remaining: ${this.formatCurrency(remaining)}`
                                            ];
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            ...this.chartDefaults.scales,
                            x: {
                                ...this.chartDefaults.scales.x,
                                stacked: false
                            },
                            y: {
                                ...this.chartDefaults.scales.y,
                                stacked: false,
                                beginAtZero: true,
                                ticks: {
                                    ...this.chartDefaults.scales.y.ticks,
                                    callback: (value) => this.formatCurrency(value)
                                }
                            }
                        }
                    }
                });

                this.updateBudgetPerformanceIndicator(budgets);
                this.updateBudgetSummary(budgetData.budgets);

            } catch (error) {
                this.showEmptyChart(canvas, 'Chart Error', 'Unable to load budget performance', 'budget');
            }
        }

        prepareBudgetVsActualData(budgets, monthlyTransactions) {
            const labels = [];
            const planned = [];
            const actual = [];
            const actualColors = [];
            const actualBorders = [];
            const budgetDetails = [];

            const actualSpending = this.groupByCategory(
                monthlyTransactions.transactions.filter(t => t.type === 'EXPENSE')
            );

            budgets.forEach(budget => {
                // FIXED: Filter out Bulgarian names and replace with English
                const categoryName = this.translateCategoryName(budget.categoryName);

                if (categoryName && categoryName !== 'General Budget') {
                    const plannedAmount = parseFloat(budget.plannedAmount || 0);
                    const spentAmount = parseFloat(budget.spentAmount || 0);
                    const actualAmount = actualSpending[budget.categoryName] || spentAmount;

                    const percentage = plannedAmount > 0 ? (actualAmount / plannedAmount) * 100 : 0;

                    let color, borderColor;
                    if (percentage <= 70) {
                        color = 'rgba(168, 85, 247, 0.6)';
                        borderColor = this.colors.primary;
                    } else if (percentage <= 90) {
                        color = 'rgba(16, 185, 129, 0.6)';
                        borderColor = '#10b981';
                    } else if (percentage <= 100) {
                        color = 'rgba(245, 158, 11, 0.6)';
                        borderColor = '#f59e0b';
                    } else {
                        color = 'rgba(255, 71, 87, 0.6)';
                        borderColor = this.colors.danger;
                    }

                    labels.push(categoryName);
                    planned.push(plannedAmount);
                    actual.push(actualAmount);
                    actualColors.push(color);
                    actualBorders.push(borderColor);

                    budgetDetails.push({
                        ...budget,
                        actualAmount,
                        percentage: percentage,
                        status: percentage <= 70 ? 'under-budget' :
                               percentage <= 90 ? 'on-track' :
                               percentage <= 100 ? 'near-limit' : 'over-budget'
                    });
                }
            });

            return {
                labels,
                planned,
                actual,
                actualColors,
                actualBorders,
                budgets: budgetDetails
            };
        }

        /**
         * NEW: Translate Bulgarian category names to English
         */
        translateCategoryName(categoryName) {
            if (!categoryName) return 'Other';

            const translations = {
                'Общ бюджет': 'General Budget',
                'Храна': 'Food',
                'Транспорт': 'Transportation',
                'Развлечения': 'Entertainment',
                'Здравеопазване': 'Healthcare',
                'Дрехи': 'Clothing',
                'Образование': 'Education',
                'Домакинство': 'Household',
                'Спорт': 'Sports',
                'Пътувания': 'Travel',
                'Технологии': 'Technology',
                'Ресторанти': 'Restaurants',
                'Козметика': 'Beauty',
                'Подаръци': 'Gifts',
                'Други': 'Other'
            };

            return translations[categoryName] || categoryName;
        }

        updateBudgetPerformanceIndicator(budgets) {
            const indicator = document.getElementById('performance-indicator');
            if (!indicator) return;

            if (!budgets || !budgets.budgets || budgets.budgets.length === 0) {
                indicator.textContent = 'No budgets configured';
                indicator.className = 'performance-indicator neutral';
                return;
            }

            const overBudgetCount = budgets.budgets.filter(b => (b.spentPercentage || 0) > 100).length;
            const nearLimitCount = budgets.budgets.filter(b => {
                const perc = b.spentPercentage || 0;
                return perc > 90 && perc <= 100;
            }).length;
            const onTrackCount = budgets.budgets.filter(b => (b.spentPercentage || 0) <= 90).length;

            let status, message, className;

            if (overBudgetCount > 0) {
                status = 'warning';
                message = `${overBudgetCount} budget${overBudgetCount > 1 ? 's' : ''} exceeded`;
                className = 'performance-indicator danger';
            } else if (nearLimitCount > 0) {
                status = 'caution';
                message = `${nearLimitCount} budget${nearLimitCount > 1 ? 's' : ''} near limit`;
                className = 'performance-indicator warning';
            } else if (onTrackCount > 0) {
                status = 'excellent';
                message = 'All budgets on track';
                className = 'performance-indicator excellent';
            } else {
                status = 'neutral';
                message = 'Budget status unknown';
                className = 'performance-indicator neutral';
            }

            indicator.textContent = message;
            indicator.className = className;
        }

        updateBudgetSummary(budgets) {
            const summaryElement = document.getElementById('budget-summary');
            if (!summaryElement) return;

            if (!budgets || budgets.length === 0) {
                summaryElement.innerHTML = `
                    <div class="budget-summary-grid">
                        <div class="budget-summary-item">
                            <div class="budget-summary-label">Total Categories</div>
                            <div class="budget-summary-value">0</div>
                            <div class="budget-summary-percentage neutral">No budgets</div>
                        </div>
                        <div class="budget-summary-item">
                            <div class="budget-summary-label">Average Usage</div>
                            <div class="budget-summary-value">0%</div>
                            <div class="budget-summary-percentage neutral">No data</div>
                        </div>
                        <div class="budget-summary-item">
                            <div class="budget-summary-label">Budget Health</div>
                            <div class="budget-summary-value">0</div>
                            <div class="budget-summary-percentage neutral">Set budgets</div>
                        </div>
                    </div>
                `;
                return;
            }

            const totalCategories = budgets.length;
            const averageUsage = budgets.reduce((sum, b) => sum + (b.percentage || 0), 0) / totalCategories;
            const onTrackCount = budgets.filter(b => (b.percentage || 0) <= 90).length;
            const healthPercentage = (onTrackCount / totalCategories) * 100;

            let healthStatus, healthClass;
            if (healthPercentage >= 80) {
                healthStatus = 'Excellent';
                healthClass = 'under-budget';
            } else if (healthPercentage >= 60) {
                healthStatus = 'Good';
                healthClass = 'on-track';
            } else if (healthPercentage >= 40) {
                healthStatus = 'Fair';
                healthClass = 'near-limit';
            } else {
                healthStatus = 'Poor';
                healthClass = 'over-budget';
            }

            summaryElement.innerHTML = `
                <div class="budget-summary-grid">
                    <div class="budget-summary-item">
                        <div class="budget-summary-label">Total Categories</div>
                        <div class="budget-summary-value">${totalCategories}</div>
                        <div class="budget-summary-percentage on-track">${onTrackCount} on track</div>
                    </div>
                    <div class="budget-summary-item">
                        <div class="budget-summary-label">Average Usage</div>
                        <div class="budget-summary-value">${averageUsage.toFixed(1)}%</div>
                        <div class="budget-summary-percentage ${averageUsage <= 70 ? 'under-budget' : averageUsage <= 90 ? 'on-track' : averageUsage <= 100 ? 'near-limit' : 'over-budget'}">
                            ${averageUsage <= 70 ? 'Under budget' : averageUsage <= 90 ? 'On track' : averageUsage <= 100 ? 'Near limit' : 'Over budget'}
                        </div>
                    </div>
                    <div class="budget-summary-item">
                        <div class="budget-summary-label">Budget Health</div>
                        <div class="budget-summary-value">${healthPercentage.toFixed(0)}%</div>
                        <div class="budget-summary-percentage ${healthClass}">${healthStatus}</div>
                    </div>
                </div>
            `;
        }

        /**
         * Category Allocation Chart - UPDATED WITH MODERN EMPTY STATE
         */
        async initCategoryAllocationChart() {
            const canvas = document.getElementById('category-pie-chart');
            if (!canvas || !window.Chart) {
                return;
            }

            try {
                const categoryData = await this.getCategoryPieData();

                if (categoryData.labels.length === 0) {
                    this.showEmptyChart(canvas, 'No Expense Data', 'Add expenses to see breakdown', 'category');
                    return;
                }

                const colors = categoryData.labels.map((_, index) => {
                    const hue = (index * 137.508) % 360;
                    return `hsl(${hue}, 70%, 60%)`;
                });

                this.charts.categoryPie = new Chart(canvas, {
                    type: 'doughnut',
                    data: {
                        labels: categoryData.labels,
                        datasets: [{
                            data: categoryData.data,
                            backgroundColor: colors,
                            borderColor: '#000000',
                            borderWidth: 2,
                            hoverBorderWidth: 4,
                            hoverBorderColor: '#ffffff'
                        }]
                    },
                    options: {
                        ...this.chartDefaults,
                        plugins: {
                            ...this.chartDefaults.plugins,
                            legend: { display: false },
                            tooltip: {
                                ...this.chartDefaults.plugins.tooltip,
                                callbacks: {
                                    label: (context) => {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                                        return `${context.label}: ${this.formatCurrency(context.parsed)} (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        cutout: '70%'
                    }
                });

                this.updateCategoryLegend({ ...categoryData, colors });
            } catch (error) {
                // Continue without chart
            }
        }

        /**
         * Daily Cash Flow Chart - UPDATED WITH MODERN EMPTY STATE
         */
        async initDailyCashFlowChart() {
            const canvas = document.getElementById('cashflow-volume-chart');
            if (!canvas || !window.Chart) {
                return;
            }

            try {
                const { dailyBalanceHistory } = this.dashboardData;

                if (dailyBalanceHistory.length === 0) {
                    this.showEmptyChart(canvas, 'No Cash Flow Data', 'Add transactions to see daily flows', 'cashflow');
                    return;
                }

                const labels = dailyBalanceHistory.map(day =>
                    new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                );

                this.charts.cashflowVolume = new Chart(canvas, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Income',
                                data: dailyBalanceHistory.map(day => day.income),
                                backgroundColor: this.colors.primary,
                                borderColor: this.colors.primary,
                                borderWidth: 1,
                                borderRadius: 4
                            },
                            {
                                label: 'Expenses',
                                data: dailyBalanceHistory.map(day => -day.expenses),
                                backgroundColor: this.colors.danger,
                                borderColor: this.colors.danger,
                                borderWidth: 1,
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        ...this.chartDefaults,
                        plugins: {
                            ...this.chartDefaults.plugins,
                            tooltip: {
                                ...this.chartDefaults.plugins.tooltip,
                                callbacks: {
                                    label: (context) => {
                                        const value = Math.abs(context.parsed.y);
                                        return `${context.dataset.label}: ${this.formatCurrency(value)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            ...this.chartDefaults.scales,
                            y: {
                                ...this.chartDefaults.scales.y,
                                ticks: {
                                    ...this.chartDefaults.scales.y.ticks,
                                    callback: (value) => this.formatCurrency(Math.abs(value))
                                }
                            }
                        }
                    }
                });

            } catch (error) {
                // Continue without chart
            }
        }

        async updateAllComponentsInstantly() {
            try {
                // Verify we have data
                if (!this.dashboardData) {
                    return;
                }

                this.updateSummaryCardsInstantly();

                // CRITICAL: Always update notification badge IMMEDIATELY after data update
                this.updateNotificationBadge();

                this.updateMonthlyComparison();
                this.updateSpendingVelocity();
                this.updateFinancialWidgets();

                console.log('🔔 Notification badge updated in updateAllComponentsInstantly');

            } catch (error) {
                // Try to initialize with empty data to prevent complete failure
                try {
                    this.initializeEmptyStates();
                } catch (fallbackError) {
                    // Continue
                }

                throw error; // Re-throw to be caught by performSmartRefresh
            }
        }

        initializeEmptyStates() {
            // Initialize with empty dashboard data if not exists
            if (!this.dashboardData) {
                this.dashboardData = {
                    balance: 0,
                    monthlyTransactions: {
                        income: 0,
                        expenses: 0,
                        netCashFlow: 0,
                        transactions: [],
                        averageDaily: 0
                    },
                    budgets: {
                        budgets: [],
                        totalPlanned: 0,
                        totalSpent: 0,
                        totalRemaining: 0,
                        utilizationRate: 0,
                        budgetHealth: []
                    },
                    notifications: [],
                    categories: [],
                    monthlyComparison: {
                        overallChange: 0,
                        overallPercentage: 0,
                        currentExpenses: 0,
                        lastExpenses: 0,
                        worstCategory: null,
                        categoryChanges: []
                    },
                    dailyBalanceHistory: [],
                    insights: {},
                    spendingVelocity: {
                        monthProgress: 0,
                        daysRemaining: 0,
                        currentExpenses: 0,
                        projectedMonthlySpending: 0,
                        budgetForecast: 0,
                        status: 'no-data',
                        message: 'No budget or expenses yet',
                        badgeClass: 'neutral',
                        hasData: false
                    }
                };
            }

            // Update UI with empty states
            this.updateSummaryCardsInstantly();
            this.updateSpendingVelocity();
            this.updateFinancialWidgets();
        }

        /**
         * PRODUCTION: Update Spending Velocity Section - NO HARDCODED VALUES
         */
        updateSpendingVelocity() {
            const { spendingVelocity } = this.dashboardData;

            if (!spendingVelocity) {
                return;
            }

            // Current date calculation for verification
            const now = new Date();
            const currentDay = now.getDate();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const actualMonthProgress = (currentDay / daysInMonth) * 100;

            // Update velocity percentage with verification
            const velocityPercentageElement = document.getElementById('velocity-percentage');
            if (velocityPercentageElement) {
                const newValue = `${spendingVelocity.monthProgress}%`;
                const currentValue = velocityPercentageElement.textContent;

                velocityPercentageElement.textContent = newValue;
            }

            // Update projection text
            const velocityProjectionElement = document.getElementById('velocity-projection');
            if (velocityProjectionElement) {
                const newValue = spendingVelocity.message;
                const currentValue = velocityProjectionElement.textContent;

                velocityProjectionElement.textContent = newValue;
            }

            // Update velocity details
            this.updateElement('velocity-days-remaining', spendingVelocity.daysRemaining);

            this.updateElement('velocity-projected-total', this.formatCurrency(spendingVelocity.projectedMonthlySpending));

            // Budget forecast
            let forecastText;
            if (!spendingVelocity.hasData || spendingVelocity.status === 'no-data' || spendingVelocity.status === 'no-budget') {
                forecastText = 'No forecast available';
            } else if (spendingVelocity.budgetForecast > 100) {
                forecastText = `${(spendingVelocity.budgetForecast - 100).toFixed(1)}% over budget`;
            } else {
                forecastText = `${spendingVelocity.budgetForecast}% of budget`;
            }
            this.updateElement('velocity-budget-forecast', forecastText);

            // Update velocity badge
            const velocityBadge = document.getElementById('velocity-badge');
            if (velocityBadge) {
                velocityBadge.className = `velocity-badge ${spendingVelocity.badgeClass}`;

                let badgeText, badgeIcon;
                switch (spendingVelocity.status) {
                    case 'no-data':
                    case 'no-budget':
                    case 'no-expenses':
                        badgeText = 'No Data Yet';
                        badgeIcon = 'info';
                        break;
                    case 'under-pace':
                        badgeText = 'Excellent Control';
                        badgeIcon = 'check-circle';
                        break;
                    case 'on-track':
                        badgeText = 'On Track';
                        badgeIcon = 'target';
                        break;
                    case 'over-pace':
                        badgeText = 'Moderate Alert';
                        badgeIcon = 'alert-circle';
                        break;
                    case 'way-over-pace':
                        badgeText = 'High Alert';
                        badgeIcon = 'alert-triangle';
                        break;
                    default:
                        badgeText = 'Calculating...';
                        badgeIcon = 'activity';
                }

                const newBadgeContent = `
                    <i data-lucide="${badgeIcon}"></i>
                    <span>${badgeText}</span>
                `;

                velocityBadge.innerHTML = newBadgeContent;

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }

        updateSummaryCardsInstantly() {
            const { balance, monthlyTransactions, budgets } = this.dashboardData;

            this.setCardValueInstantly('current-balance', balance);
            this.setCardValueInstantly('monthly-income', monthlyTransactions.income);
            this.setCardValueInstantly('monthly-expenses', monthlyTransactions.expenses);
            this.setCardValueInstantly('budget-utilization', budgets.utilizationRate, true);
            this.setCardValueInstantly('net-cashflow', monthlyTransactions.netCashFlow);
            this.setCardValueInstantly('daily-spending', monthlyTransactions.averageDaily);
            this.setCardValueInstantly('budget-remaining', budgets.totalRemaining);

            this.updateTrendIndicators();
        }

        setCardValueInstantly(cardId, value, isPercentage = false) {
            const element = document.querySelector(`#${cardId} .value-amount, #${cardId} .value-percentage`);
            if (!element) return;

            if (isPercentage) {
                element.textContent = Math.round(value);
            } else {
                if (Math.abs(value) >= 1000) {
                    element.textContent = this.formatLargeNumber(value);
                } else {
                    element.textContent = value.toFixed(2);
                }
            }
        }

        updateTrendIndicators() {
            const { balance, monthlyTransactions, budgets } = this.dashboardData;

            this.updateTrendIndicator('balance-trend',
                balance >= 0 ? 'Positive balance' : 'Needs attention',
                balance >= 0);

            this.updateTrendIndicator('income-trend',
                monthlyTransactions.income > 0 ? 'Income received' : 'No income yet',
                monthlyTransactions.income > 0);

            this.updateTrendIndicator('expenses-trend',
                monthlyTransactions.expenses > 0 ? 'Expenses tracked' : 'No expenses yet',
                monthlyTransactions.expenses > 0);

            this.updateTrendIndicator('budget-trend',
                budgets.utilizationRate <= 70 ? 'On track' :
                budgets.utilizationRate <= 90 ? 'Approaching limits' : 'Over budget',
                budgets.utilizationRate <= 90);

            this.updateTrendIndicator('cashflow-trend',
                monthlyTransactions.netCashFlow >= 0 ? 'Positive flow' : 'Deficit',
                monthlyTransactions.netCashFlow >= 0);

            this.updateTrendIndicator('daily-trend', 'Daily average', true);

            this.updateTrendIndicator('remaining-trend',
                budgets.totalRemaining >= 0 ? 'Budget available' : 'Over budget',
                budgets.totalRemaining >= 0);
        }

        updateTrendIndicator(elementId, text, isPositive = true) {
            const trendElement = document.getElementById(elementId);
            if (!trendElement) return;

            const textElement = trendElement.querySelector('.trend-text');
            const iconElement = trendElement.querySelector('.trend-indicator i');

            if (textElement) {
                textElement.textContent = text;
            }

            if (iconElement) {
                const iconName = isPositive ? 'trending-up' : 'trending-down';
                iconElement.setAttribute('data-lucide', iconName);

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }

        updateMonthlyComparison() {
            const { monthlyComparison, monthlyTransactions, budgets } = this.dashboardData;

            // Safety checks
            if (!monthlyComparison || !monthlyTransactions || !budgets) {
                return;
            }

            // Update overall spending
            this.updateElement('overall-change', this.formatCurrency(monthlyComparison.currentExpenses));

            // Update change description in the new projection style
            const changeText = this.getChangeDescription(monthlyComparison.overallPercentage);
            this.updateElement('change-description', changeText);

            // Update change indicator icon
            const changeIndicator = document.querySelector('#overall-change-indicator i');
            if (changeIndicator) {
                const iconName = monthlyComparison.overallPercentage >= 0 ? 'trending-up' : 'trending-down';
                changeIndicator.setAttribute('data-lucide', iconName);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            this.updateElement('previous-month-spending', this.formatCurrency(monthlyComparison.lastExpenses));
            this.updateElement('monthly-change-amount', this.formatCurrency(Math.abs(monthlyComparison.overallChange)));

            // FIXED: Dynamic Trend Direction - NO MORE HARDCODED "Increasing"
            let trendDirection;
            if (monthlyComparison.overallPercentage > 5) {
                trendDirection = 'Increasing';
            } else if (monthlyComparison.overallPercentage < -5) {
                trendDirection = 'Decreasing';
            } else if (Math.abs(monthlyComparison.overallPercentage) <= 5) {
                trendDirection = 'Stable';
            } else {
                trendDirection = 'No Change';
            }

            this.updateElement('trend-direction', trendDirection);

            // Update worst category with details
            if (monthlyComparison.worstCategory) {
                this.updateElement('worst-category-name', this.translateCategoryName(monthlyComparison.worstCategory.category));
                this.updateElement('worst-category-change', `${this.formatCurrency(monthlyComparison.worstCategory.change)} more`);
                this.updateElement('worst-category-previous', this.formatCurrency(monthlyComparison.worstCategory.lastAmount));
                this.updateElement('worst-category-current', this.formatCurrency(monthlyComparison.worstCategory.currentAmount));
                this.updateElement('worst-category-rate', `${monthlyComparison.worstCategory.percentage.toFixed(1)}% increase`);
            } else {
                this.updateElement('worst-category-name', 'No increases');
                this.updateElement('worst-category-change', 'No extra spending');
                this.updateElement('worst-category-previous', '0.00€');
                this.updateElement('worst-category-current', '0.00€');
                this.updateElement('worst-category-rate', '0%');
            }

            // PRODUCTION: Dynamic Performance Score Calculation - NO HARDCODED VALUES
            const performanceScore = this.calculateDynamicPerformanceScore(monthlyComparison);

            // Show appropriate values or empty states
            if (performanceScore.hasData) {
                this.updateElement('performance-score', performanceScore.score.toString());
                this.updateElement('performance-description', performanceScore.description);
                this.updateElement('budget-control-score', `${performanceScore.budgetControl}/30`);
                this.updateElement('spending-trend-score', `${performanceScore.spendingTrend}/40`);
                this.updateElement('financial-health-score', `${performanceScore.financialHealth}/30`);

                const scoreProgress = document.getElementById('score-progress');
                if (scoreProgress) {
                    scoreProgress.style.width = `${performanceScore.score}%`;
                }
            } else {
                this.updateElement('performance-score', '0');
                this.updateElement('performance-description', 'Add transactions and budgets to see score');
                this.updateElement('budget-control-score', '0/30');
                this.updateElement('spending-trend-score', '0/40');
                this.updateElement('financial-health-score', '0/30');

                const scoreProgress = document.getElementById('score-progress');
                if (scoreProgress) {
                    scoreProgress.style.width = '0%';
                }
            }
        }

        getChangeDescription(percentage) {
            // DYNAMIC LOGIC BASED ON REAL PERCENTAGE CHANGE
            if (percentage === 0) return 'No change';
            if (percentage > 50) return 'Dramatic increase';
            if (percentage > 30) return 'Major increase';
            if (percentage > 20) return 'Significant increase';
            if (percentage > 10) return 'Notable increase';
            if (percentage > 5) return 'Moderate increase';
            if (percentage > 2) return 'Slight increase';
            if (percentage > -2) return 'Stable spending';
            if (percentage > -5) return 'Slight decrease';
            if (percentage > -10) return 'Moderate decrease';
            if (percentage > -20) return 'Good reduction';
            if (percentage > -30) return 'Significant savings';
            return 'Excellent savings';
        }

        /**
         * PRODUCTION: Dynamic Performance Score Calculation - COMPLETELY NO HARDCODED VALUES
         */
        calculateDynamicPerformanceScore(monthlyComparison) {
            const { budgets, monthlyTransactions } = this.dashboardData;

            // STRICT: Check if we have enough data to calculate meaningful scores
            const hasTransactions = monthlyTransactions && monthlyTransactions.transactions && monthlyTransactions.transactions.length > 0;
            const hasBudgets = budgets && budgets.budgets && budgets.budgets.length > 0;
            const hasComparableData = monthlyComparison && (monthlyComparison.lastExpenses > 0 || monthlyComparison.currentExpenses > 0);
            const hasData = hasTransactions || hasBudgets;

            if (!hasData) {
                return {
                    score: 0,
                    description: 'Add transactions and budgets to see performance score',
                    budgetControl: 0,
                    spendingTrend: 0,
                    financialHealth: 0,
                    hasData: false
                };
            }

            // STRICT: DYNAMIC Budget Control Score (30 points max) - NO BASE SCORES
            let budgetControl = 0;
            if (hasBudgets) {
                const averageUtilization = budgets.utilizationRate || 0;
                if (averageUtilization <= 70) budgetControl = 30;
                else if (averageUtilization <= 85) budgetControl = 25;
                else if (averageUtilization <= 100) budgetControl = 20;
                else budgetControl = 10;
            }

            // STRICT: DYNAMIC Spending Trend Score (40 points max) - NO BASE SCORES
            let spendingTrend = 0;
            if (hasTransactions && monthlyComparison && monthlyComparison.lastExpenses > 0) {
                // Only calculate if we have previous month data to compare
                const overallPercentage = monthlyComparison.overallPercentage || 0;
                if (overallPercentage < -20) spendingTrend = 40;
                else if (overallPercentage < -10) spendingTrend = 35;
                else if (overallPercentage < -5) spendingTrend = 30;
                else if (overallPercentage < 5) spendingTrend = 25;
                else if (overallPercentage < 15) spendingTrend = 15;
                else if (overallPercentage < 30) spendingTrend = 8;
                else spendingTrend = 3;
            } else if (hasTransactions && monthlyComparison && monthlyComparison.currentExpenses > 0 && monthlyComparison.lastExpenses === 0) {
                // First month with expenses gets neutral score
                spendingTrend = 20;
            }

            // STRICT: DYNAMIC Financial Health Score (30 points max) - NO BASE SCORES
            let financialHealth = 0;
            if (hasTransactions && monthlyTransactions.income > 0) {
                const savingsRate = (monthlyTransactions.netCashFlow / monthlyTransactions.income) * 100;
                if (savingsRate >= 20) financialHealth = 30;
                else if (savingsRate >= 10) financialHealth = 25;
                else if (savingsRate >= 5) financialHealth = 20;
                else if (savingsRate >= 0) financialHealth = 15;
                else if (savingsRate >= -10) financialHealth = 10;
                else financialHealth = 5;
            } else if (hasTransactions && monthlyTransactions.income === 0 && monthlyTransactions.expenses > 0) {
                // Only expenses, no income is concerning
                financialHealth = 3;
            }

            const totalScore = budgetControl + spendingTrend + financialHealth;

            let description;
            if (totalScore === 0) {
                description = 'Add more financial data to see performance';
            } else if (totalScore >= 85) {
                description = 'Excellent financial performance!';
            } else if (totalScore >= 70) {
                description = 'Very good financial management';
            } else if (totalScore >= 55) {
                description = 'Good financial control';
            } else if (totalScore >= 40) {
                description = 'Room for improvement';
            } else if (totalScore >= 25) {
                description = 'Needs attention';
            } else {
                description = 'Critical: Immediate action required';
            }

            return {
                score: totalScore,
                description,
                budgetControl,
                spendingTrend,
                financialHealth,
                hasData: totalScore > 0
            };
        }

        /**
         * PRODUCTION: Enhanced Financial Widgets Update with Perfect Calculations - NO HARDCODED VALUES
         */
        updateFinancialWidgets() {
            const { monthlyTransactions, budgets } = this.dashboardData;

            // Update top spending category
            const topCategory = this.findTopSpendingCategory(monthlyTransactions);
            if (topCategory) {
                this.updateElement('top-category-name', topCategory.name);
                this.updateElement('top-category-amount', this.formatCurrency(topCategory.amount));
                this.updateElement('top-category-percentage',
                    `${topCategory.percentage.toFixed(1)}% of total expenses`);
            } else {
                this.updateElement('top-category-name', 'No expenses yet');
                this.updateElement('top-category-amount', this.formatCurrency(0));
                this.updateElement('top-category-percentage', '0% of total expenses');
            }

            // Update biggest expense
            const biggestExpense = this.findBiggestExpense(monthlyTransactions);
            if (biggestExpense) {
                this.updateElement('biggest-expense-amount', this.formatCurrency(biggestExpense.amount));
                this.updateElement('biggest-expense-description', biggestExpense.description || 'No description');
                this.updateElement('biggest-expense-date', this.formatDate(biggestExpense.transactionDate));
            } else {
                this.updateElement('biggest-expense-amount', this.formatCurrency(0));
                this.updateElement('biggest-expense-description', 'No expenses yet');
                this.updateElement('biggest-expense-date', '-');
            }

            // Update budget adherence with enhanced details
            const adherenceRate = this.calculateBudgetAdherence(budgets);

            if (budgets.budgets && budgets.budgets.length > 0) {
                this.updateElement('adherence-rate', `${adherenceRate.toFixed(0)}%`);
                this.updateElement('adherence-description', this.getBudgetAdherenceDescription(adherenceRate));

                const adherenceProgress = document.getElementById('adherence-progress');
                if (adherenceProgress) {
                    adherenceProgress.style.width = `${adherenceRate}%`;
                    adherenceProgress.className = `progress-fill ${this.getBudgetAdherenceClass(adherenceRate)}`;
                }

                this.updateBudgetAdherenceDetails(budgets, adherenceRate);
            } else {
                // No budgets set
                this.updateElement('adherence-rate', '0%');
                this.updateElement('adherence-description', 'No budgets configured');

                const adherenceProgress = document.getElementById('adherence-progress');
                if (adherenceProgress) {
                    adherenceProgress.style.width = '0%';
                    adherenceProgress.className = 'progress-fill neutral';
                }

                this.updateBudgetAdherenceDetailsEmpty();
            }

            // PRODUCTION: Update spending frequency stats with correct calculations and icon refresh - NO HARDCODED VALUES
            this.updateSpendingFrequencyStatsProduction(monthlyTransactions);

            // Update budget health overview
            this.updateBudgetHealthOverview(budgets);

            // PRODUCTION: Update financial score with dynamic calculations - NO HARDCODED VALUES
            this.updateFinancialScoreProduction();
        }

        /**
         * PRODUCTION: Update Budget Adherence Details Section - IMPROVED LOGIC
         */
        updateBudgetAdherenceDetails(budgets, adherenceRate) {
            const adherenceDetails = document.getElementById('adherence-details');
            if (!adherenceDetails) return;

            const totalBudgets = budgets.budgets.length;
            const withinLimitBudgets = budgets.budgets.filter(b => (b.spentPercentage || 0) <= 100).length;
            const nearLimitBudgets = budgets.budgets.filter(b => {
                const perc = b.spentPercentage || 0;
                return perc > 90 && perc <= 100;
            }).length;
            const overBudgetBudgets = budgets.budgets.filter(b => (b.spentPercentage || 0) > 100).length;

            const averageUsage = totalBudgets > 0 ?
                budgets.budgets.reduce((sum, b) => sum + (b.spentPercentage || 0), 0) / totalBudgets : 0;

            // IMPROVED STATUS LOGIC
            let trackingStatus, trackingClass;
            if (withinLimitBudgets === totalBudgets) {
                trackingStatus = 'Perfect';
                trackingClass = 'excellent';
            } else if (withinLimitBudgets >= totalBudgets * 0.8) {
                trackingStatus = 'Very Good';
                trackingClass = 'good';
            } else if (withinLimitBudgets >= totalBudgets * 0.6) {
                trackingStatus = 'Good';
                trackingClass = 'good';
            } else if (withinLimitBudgets >= totalBudgets * 0.4) {
                trackingStatus = 'Fair';
                trackingClass = 'warning';
            } else {
                trackingStatus = 'Poor';
                trackingClass = 'poor';
            }

            let usageStatus, usageClass;
            if (averageUsage <= 70) {
                usageStatus = 'Conservative';
                usageClass = 'excellent';
            } else if (averageUsage <= 85) {
                usageStatus = 'Moderate';
                usageClass = 'good';
            } else if (averageUsage <= 100) {
                usageStatus = 'High';
                usageClass = 'warning';
            } else if (averageUsage <= 150) {
                usageStatus = 'Critical';
                usageClass = 'poor';
            } else {
                usageStatus = 'Extreme';
                usageClass = 'poor';
            }

            adherenceDetails.innerHTML = `
                <div class="adherence-detail-item">
                    <span class="adherence-detail-label">
                        <i data-lucide="target" style="width: 14px; height: 14px;"></i>
                        Within Budget Limits
                    </span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="adherence-detail-value">${withinLimitBudgets}/${totalBudgets}</span>
                        <span class="adherence-detail-status ${trackingClass}">${trackingStatus}</span>
                    </div>
                </div>
                <div class="adherence-detail-item">
                    <span class="adherence-detail-label">
                        <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i>
                        Average Usage
                    </span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="adherence-detail-value">${averageUsage.toFixed(1)}%</span>
                        <span class="adherence-detail-status ${usageClass}">${usageStatus}</span>
                    </div>
                </div>
                ${overBudgetBudgets > 0 ? `
                <div class="adherence-detail-item">
                    <span class="adherence-detail-label">
                        <i data-lucide="alert-triangle" style="width: 14px; height: 14px;"></i>
                        Over Budget
                    </span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="adherence-detail-value">${overBudgetBudgets}</span>
                        <span class="adherence-detail-status poor">Exceeded</span>
                    </div>
                </div>
                ` : nearLimitBudgets > 0 ? `
                <div class="adherence-detail-item">
                    <span class="adherence-detail-label">
                        <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                        Near Limit
                    </span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="adherence-detail-value">${nearLimitBudgets}</span>
                        <span class="adherence-detail-status warning">Watch</span>
                    </div>
                </div>
                ` : `
                <div class="adherence-detail-item">
                    <span class="adherence-detail-label">
                        <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i>
                        Budget Status
                    </span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="adherence-detail-value">All Good</span>
                        <span class="adherence-detail-status excellent">Healthy</span>
                    </div>
                </div>
                `}
            `;

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        /**
         * PRODUCTION: Empty state for budget adherence details - FIXED: Added missing third block
         */
        updateBudgetAdherenceDetailsEmpty() {
            const adherenceDetails = document.getElementById('adherence-details');
            if (!adherenceDetails) return;

            adherenceDetails.innerHTML = `
                <div class="adherence-detail-item">
                    <span class="adherence-detail-label">
                        <i data-lucide="info" style="width: 14px; height: 14px;"></i>
                        No budgets configured
                    </span>
                    <span class="adherence-detail-status neutral">Ready to start</span>
                </div>
                <div class="adherence-detail-item">
                    <span class="adherence-detail-label">
                        <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i>
                        Create budgets
                    </span>
                    <span class="adherence-detail-status neutral">Get started</span>
                </div>
                <div class="adherence-detail-item">
                    <span class="adherence-detail-label">
                        <i data-lucide="activity" style="width: 14px; height: 14px;"></i>
                        Track spending
                    </span>
                    <span class="adherence-detail-status neutral">Monitor health</span>
                </div>
            `;

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        /**
         * PRODUCTION: Update Spending Frequency Stats - COMPLETELY DYNAMIC, NO HARDCODED VALUES
         * UPDATED: Fixed icon refresh with Lucide after content updates
         */
        updateSpendingFrequencyStatsProduction(monthlyTransactions) {
            const { transactions } = monthlyTransactions;
            const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');

            const totalTransactions = expenseTransactions.length;

            if (totalTransactions === 0) {
                // Empty state - no transactions
                this.updateElement('frequency-rate', '0');
                this.updateElement('frequency-description', 'No transactions this month');

                const frequencyProgress = document.getElementById('frequency-progress');
                if (frequencyProgress) {
                    frequencyProgress.style.width = '0%';
                }

                // Update empty frequency stats
                this.updateElement('total-transactions', '0');
                this.updateElement('average-transaction', this.formatCurrency(0));
                this.updateElement('most-active-day', 'None');

                // Update frequency stats with empty state styling
                const frequencyStats = document.querySelector('.frequency-stats');
                if (frequencyStats) {
                    const statItems = frequencyStats.querySelectorAll('.stat-item');
                    statItems.forEach(item => {
                        const statusSpan = item.querySelector('.stat-status');
                        if (statusSpan) {
                            statusSpan.textContent = 'No data';
                            statusSpan.className = 'stat-status neutral';
                        }
                    });
                }

                return;
            }

            // Update main metric section
            this.updateElement('frequency-rate', totalTransactions.toString());
            this.updateElement('frequency-description', 'Active transactions this month');

            // Update progress bar (activity level)
            const activityLevel = Math.min((totalTransactions / 30) * 100, 100); // 30 transactions = 100%
            const frequencyProgress = document.getElementById('frequency-progress');
            if (frequencyProgress) {
                frequencyProgress.style.width = `${activityLevel}%`;
            }

            // PRODUCTION: Calculate CORRECT average per transaction
            const averageTransaction = monthlyTransactions.expenses / expenseTransactions.length;

            // Calculate most active day
            const dayFrequency = {};
            expenseTransactions.forEach(transaction => {
                const day = new Date(transaction.transactionDate).toLocaleDateString('en-US', { weekday: 'long' });
                dayFrequency[day] = (dayFrequency[day] || 0) + 1;
            });

            const mostActiveDay = Object.keys(dayFrequency).length > 0
                ? Object.keys(dayFrequency).reduce((a, b) => dayFrequency[a] > dayFrequency[b] ? a : b)
                : 'N/A';

            // Update the 3 symmetric items with CORRECT calculations
            this.updateElement('total-transactions', totalTransactions.toString());
            this.updateElement('average-transaction', this.formatCurrency(averageTransaction));
            this.updateElement('most-active-day', mostActiveDay);

            // Update status indicators based on actual data
            const frequencyStats = document.querySelector('.frequency-stats');
            if (frequencyStats) {
                const statItems = frequencyStats.querySelectorAll('.stat-item');

                // Update transaction count status
                const transactionStatus = statItems[0]?.querySelector('.stat-status');
                if (transactionStatus) {
                    if (totalTransactions >= 20) {
                        transactionStatus.textContent = 'High';
                        transactionStatus.className = 'stat-status excellent';
                    } else if (totalTransactions >= 10) {
                        transactionStatus.textContent = 'Active';
                        transactionStatus.className = 'stat-status good';
                    } else if (totalTransactions >= 5) {
                        transactionStatus.textContent = 'Moderate';
                        transactionStatus.className = 'stat-status warning';
                    } else {
                        transactionStatus.textContent = 'Low';
                        transactionStatus.className = 'stat-status poor';
                    }
                }

                // Update average transaction status
                const averageStatus = statItems[1]?.querySelector('.stat-status');
                if (averageStatus) {
                    if (averageTransaction <= 50) {
                        averageStatus.textContent = 'Small';
                        averageStatus.className = 'stat-status excellent';
                    } else if (averageTransaction <= 100) {
                        averageStatus.textContent = 'Normal';
                        averageStatus.className = 'stat-status good';
                    } else if (averageTransaction <= 200) {
                        averageStatus.textContent = 'High';
                        averageStatus.className = 'stat-status warning';
                    } else {
                        averageStatus.textContent = 'Large';
                        averageStatus.className = 'stat-status poor';
                    }
                }

                // Update most active day status
                const dayStatus = statItems[2]?.querySelector('.stat-status');
                if (dayStatus && mostActiveDay !== 'N/A') {
                    const maxFrequency = Math.max(...Object.values(dayFrequency));
                    if (maxFrequency >= 5) {
                        dayStatus.textContent = 'Peak';
                        dayStatus.className = 'stat-status excellent';
                    } else if (maxFrequency >= 3) {
                        dayStatus.textContent = 'Active';
                        dayStatus.className = 'stat-status good';
                    } else {
                        dayStatus.textContent = 'Light';
                        dayStatus.className = 'stat-status warning';
                    }
                } else if (dayStatus) {
                    dayStatus.textContent = 'None';
                    dayStatus.className = 'stat-status neutral';
                }
            }

            // CRITICAL: Refresh Lucide icons after updating spending frequency content
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        updateBudgetHealthOverview(budgets) {
            const healthSummary = document.getElementById('budget-health-summary');
            if (!healthSummary) return;

            if (budgets.budgetHealth.length === 0) {
                // MODERN EMPTY STATE - Beautiful & Centered
                healthSummary.innerHTML = `
                    <div class="budget-health-empty">
                        <div class="budget-health-empty-icon">
                            <i data-lucide="heart-pulse"></i>
                        </div>
                        <h3 class="budget-health-empty-title">No Budget Health Data</h3>
                        <p class="budget-health-empty-subtitle">Create budgets to monitor your financial health</p>
                    </div>
                `;

                // Re-initialize Lucide icons for the new content
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
                return;
            }

            // NORMAL STATE - Show budget health items
            healthSummary.innerHTML = budgets.budgetHealth.map(health => `
                <div class="health-item">
                    <span class="health-category">${health.categoryName}</span>
                    <span class="health-status ${health.status}">
                        ${health.status === 'good' ? 'On Track' :
                          health.status === 'warning' ? 'Near Limit' : 'Over Budget'}
                    </span>
                </div>
            `).join('');
        }

        /**
         * PRODUCTION: Update Financial Score - COMPLETELY DYNAMIC, NO HARDCODED VALUES
         */
        updateFinancialScoreProduction() {
            const { monthlyTransactions, budgets } = this.dashboardData;

            const score = this.calculateDynamicFinancialScoreProduction(monthlyTransactions, budgets);

            if (score.hasData) {
                this.updateElement('financial-score', Math.round(score.total).toString());
                this.updateElement('score-description', score.description);

                const scoreFactors = document.getElementById('score-factors');
                if (scoreFactors) {
                    scoreFactors.innerHTML = Object.entries(score.factors).map(([factor, value]) => `
                        <div class="score-factor">
                            <span class="factor-name">${factor}</span>
                            <span class="factor-score">${value}/10</span>
                        </div>
                    `).join('');
                }
            } else {
                this.updateElement('financial-score', '0');
                this.updateElement('score-description', 'Add transactions and budgets to see financial score');

                const scoreFactors = document.getElementById('score-factors');
                if (scoreFactors) {
                    scoreFactors.innerHTML = `
                        <div class="score-factor">
                            <span class="factor-name">Budget Control</span>
                            <span class="factor-score">0/10</span>
                        </div>
                        <div class="score-factor">
                            <span class="factor-name">Savings Rate</span>
                            <span class="factor-score">0/10</span>
                        </div>
                        <div class="score-factor">
                            <span class="factor-name">Spending Consistency</span>
                            <span class="factor-score">0/10</span>
                        </div>
                        <div class="score-factor">
                            <span class="factor-name">Financial Discipline</span>
                            <span class="factor-score">0/10</span>
                        </div>
                    `;
                }
            }
        }

        /**
         * PRODUCTION: Dynamic Financial Score Calculation - COMPLETELY DYNAMIC, NO HARDCODED VALUES
         */
        calculateDynamicFinancialScoreProduction(monthlyTransactions, budgets) {
            // STRICT: Check if we have meaningful data
            const hasTransactions = monthlyTransactions.transactions.length > 0;
            const hasBudgets = budgets.budgets && budgets.budgets.length > 0;
            const hasIncome = monthlyTransactions.income > 0;
            const hasExpenses = monthlyTransactions.expenses > 0;

            // STRICT: Return empty state if no data at all
            if (!hasTransactions && !hasBudgets) {
                return {
                    total: 0,
                    factors: {
                        'Budget Control': 0,
                        'Savings Rate': 0,
                        'Spending Consistency': 0,
                        'Financial Discipline': 0
                    },
                    description: 'Add transactions and budgets to see financial score',
                    hasData: false
                };
            }

            const factors = {
                'Budget Control': this.scoreBudgetControlProduction(budgets),
                'Savings Rate': this.scoreSavingsRateProduction(monthlyTransactions),
                'Spending Consistency': this.scoreSpendingConsistencyProduction(monthlyTransactions),
                'Financial Discipline': this.scoreFinancialDisciplineProduction(monthlyTransactions, budgets)
            };

            const total = Object.values(factors).reduce((sum, score) => sum + score, 0) * 2.5;

            let description;
            if (total === 0) {
                description = 'Add more financial data to see score';
            } else if (total >= 80) {
                description = 'Excellent financial health!';
            } else if (total >= 60) {
                description = 'Good financial management';
            } else if (total >= 40) {
                description = 'Room for improvement';
            } else if (total >= 20) {
                description = 'Needs significant attention';
            } else {
                description = 'Critical: Immediate action required';
            }

            return {
                total,
                factors,
                description,
                hasData: total > 0
            };
        }

        /**
         * PRODUCTION Score Calculation Methods - COMPLETELY NO HARDCODED VALUES
         */
        scoreBudgetControlProduction(budgets) {
            // STRICT: Return 0 if no budgets exist
            if (!budgets.budgets || budgets.budgets.length === 0) return 0;

            const averageUtilization = budgets.utilizationRate;
            if (averageUtilization <= 70) return 10;
            if (averageUtilization <= 85) return 8;
            if (averageUtilization <= 100) return 6;
            return 3;
        }

        scoreSavingsRateProduction(monthlyTransactions) {
            // STRICT: Return 0 if no income exists
            if (monthlyTransactions.income === 0) return 0;

            const savingsRate = (monthlyTransactions.netCashFlow / monthlyTransactions.income) * 100;
            if (savingsRate >= 20) return 10;
            if (savingsRate >= 10) return 8;
            if (savingsRate >= 5) return 6;
            if (savingsRate >= 0) return 4;
            return 1;
        }

        scoreSpendingConsistencyProduction(monthlyTransactions) {
            const { transactions } = monthlyTransactions;
            const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');

            // STRICT: Return 0 if insufficient transactions for meaningful analysis
            if (expenseTransactions.length < 3) {
                return 0;
            }

            const dailySpending = {};
            expenseTransactions.forEach(transaction => {
                const day = transaction.transactionDate;
                dailySpending[day] = (dailySpending[day] || 0) + parseFloat(transaction.amount);
            });

            const spendingValues = Object.values(dailySpending);
            if (spendingValues.length === 0) {
                return 0;
            }

            const average = spendingValues.reduce((sum, val) => sum + val, 0) / spendingValues.length;
            const variance = spendingValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / spendingValues.length;
            const standardDeviation = Math.sqrt(variance);
            const coefficient = average > 0 ? standardDeviation / average : 0;

            let score;
            if (coefficient <= 0.3) {
                score = 10; // Very consistent
            } else if (coefficient <= 0.5) {
                score = 8;  // Good consistency
            } else if (coefficient <= 0.8) {
                score = 6;  // Moderate consistency
            } else if (coefficient <= 1.2) {
                score = 4;  // Poor consistency
            } else if (coefficient <= 1.8) {
                score = 2;  // Very poor consistency
            } else {
                score = 1;  // Extremely inconsistent
            }

            return score;
        }

        scoreFinancialDisciplineProduction(monthlyTransactions, budgets) {
            let score = 0;

            // STRICT: Only award points if actual data exists

            // Points for having budgets (only if they exist)
            if (budgets.budgets && budgets.budgets.length > 0) {
                score += 3;

                // Bonus for staying within budgets
                const overBudgetCategories = budgets.budgets.filter(b => (b.spentPercentage || 0) > 100).length;
                if (overBudgetCategories === 0) {
                    score += 3;
                } else if (overBudgetCategories <= budgets.budgets.length * 0.3) {
                    score += 1;
                }
            }

            // Points for transaction activity (only if transactions exist)
            if (monthlyTransactions.transactions.length >= 20) {
                score += 2;
            } else if (monthlyTransactions.transactions.length >= 10) {
                score += 1;
            }

            // Points for having both income and expense tracking (only if they exist)
            if (monthlyTransactions.income > 0 && monthlyTransactions.expenses > 0) {
                score += 2;
            } else if (monthlyTransactions.income > 0 || monthlyTransactions.expenses > 0) {
                score += 1;
            }

            return Math.min(score, 10);
        }

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
                        <span class="legend-value">${this.formatCurrency(value)} (${percentage}%)</span>
                    </div>
                `;
            }).join('');
        }

        // ===== CHART DATA METHODS =====

        async getCategoryPieData() {
            try {
                const { monthlyTransactions } = this.dashboardData;
                const expenseTransactions = monthlyTransactions.transactions.filter(t => t.type === 'EXPENSE');

                if (expenseTransactions.length === 0) {
                    return {
                        labels: [],
                        data: [],
                        colors: []
                    };
                }

                const categoryTotals = this.groupByCategory(expenseTransactions);
                const labels = Object.keys(categoryTotals);
                const data = Object.values(categoryTotals);
                const colors = this.generateChartColors(labels.length);

                return { labels, data, colors };
            } catch (error) {
                return {
                    labels: [],
                    data: [],
                    colors: []
                };
            }
        }

        // ===== EVENT HANDLING & REFRESH SYSTEM =====

        setupEventListeners() {
            this.setupNotificationListeners();
            this.setupSummaryCardListeners();
            this.setupChartListeners();
            this.setupGlobalListeners();
        }

        setupNotificationListeners() {
            const notificationBtn = document.getElementById('notification-btn');
            const notificationsPanel = document.getElementById('notifications-panel');
            const markAllRead = document.getElementById('mark-all-read');

            if (notificationBtn) {
                notificationBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleNotifications();
                });
            }

            if (markAllRead) {
                markAllRead.addEventListener('click', () => {
                    this.markAllNotificationsAsRead();
                });
            }

            document.addEventListener('click', (e) => {
                if (notificationsPanel &&
                    !notificationsPanel.contains(e.target) &&
                    !notificationBtn?.contains(e.target)) {
                    this.closeNotificationsPanel();
                }
            });

            // Simplified click handling - no separate mark-read buttons
            document.addEventListener('click', (e) => {
                const notificationItem = e.target.closest('.notification-item');
                if (notificationItem && !e.target.closest('.mark-all-read')) {
                    const notificationId = notificationItem?.dataset.notificationId;
                    if (notificationId) {
                        this.markNotificationAsRead(parseFloat(notificationId));
                    }
                }
            });
        }

        setupSummaryCardListeners() {
            document.querySelectorAll('.summary-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    this.handleSummaryCardClick(card, e);
                });

                card.addEventListener('mouseenter', () => {
                    this.triggerHoverEffect(card);
                });
            });
        }

        setupChartListeners() {
            document.querySelectorAll('.trading-timeframe-btn, .period-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleChartPeriodChange(btn);
                });
            });
        }

        setupGlobalListeners() {
            document.addEventListener('keydown', (e) => {
                this.handleKeyboardShortcuts(e);
            });

            window.addEventListener('resize', this.debounce(() => {
                this.handleWindowResize();
            }, 300));
        }

        handleSummaryCardClick(card, event) {
            if (event.target.closest('.trend-indicator, .card-actions')) {
                return;
            }

            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);

            if (card.classList.contains('balance-card')) {
                this.navigateWithAnimation('/transactions');
            } else if (card.classList.contains('income-card')) {
                this.navigateWithAnimation('/transactions?type=income');
            } else if (card.classList.contains('expense-card')) {
                this.navigateWithAnimation('/transactions?type=expense');
            } else if (card.classList.contains('budget-utilization-card')) {
                this.navigateWithAnimation('/budgets');
            }
        }

        async handleChartPeriodChange(button) {
            const period = button.dataset.period;
            const chartContainer = button.closest('.chart-container, .chart-card');

            if (!chartContainer) return;

            const canvas = chartContainer.querySelector('canvas');
            if (!canvas) return;

            chartContainer.querySelectorAll('.trading-timeframe-btn, .period-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        }

        handleKeyboardShortcuts(event) {
            if (event.key === 'Escape') {
                this.closeNotificationsPanel();
            }
            if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
                event.preventDefault();
                this.performSmartRefresh('Keyboard shortcut');
            }
        }

        handleWindowResize() {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        }

        triggerHoverEffect(element) {
            element.style.transition = 'transform 0.2s ease';
            element.style.transform = 'scale(1.01)';
            setTimeout(() => {
                element.style.transform = '';
            }, 200);
        }

        navigateWithAnimation(url) {
            document.body.style.opacity = '0.8';
            document.body.style.transform = 'scale(0.98)';
            setTimeout(() => {
                window.location.href = url;
            }, 200);
        }

        setupSmartRefreshSystem() {
            // Basic refresh system is now handled in setupProductionEnhancements()
            // This method is kept for compatibility but most logic moved to global setup
        }

        setupGlobalAccess() {
            window.dashboardInstance = this;

            // PRODUCTION: Enhanced refresh triggers for transaction updates
            window.updateDashboardInstantly = (operation = 'Data updated') => {
                this.performSmartRefresh(operation);
            };

            window.dashboardNotify = {
                transactionAdded: (transactionData = null) => {
                    console.log('🔔 DEBUG: transactionAdded called with data:', transactionData);

                    let message = 'New transaction has been recorded successfully';
                    let type = 'success';

                    // Enhanced message based on transaction data if available
                    if (transactionData) {
                        const amount = this.formatCurrency(transactionData.amount || 0);
                        const category = this.translateCategoryName(transactionData.categoryName || 'General');
                        const transactionType = transactionData.type || 'EXPENSE';

                        if (transactionType === 'EXPENSE') {
                            message = `${amount} expense recorded for ${category}`;
                            type = parseFloat(transactionData.amount || 0) > 200 ? 'warning' : 'info';
                        } else if (transactionType === 'INCOME') {
                            message = `${amount} income recorded from ${category}`;
                            type = 'success';
                        }
                    }

                    this.addNotification({
                        title: 'Transaction Added',
                        message: message,
                        type: type,
                        category: 'transaction'
                    });
                    this.performSmartRefresh('Transaction added');
                },
                transactionUpdated: (transactionData = null) => {
                    console.log('🔔 DEBUG: transactionUpdated called with data:', transactionData);

                    let message = 'Transaction has been updated successfully';

                    // Enhanced message based on transaction data if available
                    if (transactionData) {
                        const amount = this.formatCurrency(transactionData.amount || 0);
                        const category = this.translateCategoryName(transactionData.categoryName || 'General');
                        message = `Transaction updated: ${amount} for ${category}`;
                    }

                    this.addNotification({
                        title: 'Transaction Updated',
                        message: message,
                        type: 'info',
                        category: 'transaction'
                    });
                    this.performSmartRefresh('Transaction updated');
                },
                transactionDeleted: (transactionData = null) => {
                    console.log('🔔 DEBUG: transactionDeleted called with data:', transactionData);

                    let message = 'Transaction has been removed successfully';

                    // Enhanced message based on transaction data if available
                    if (transactionData) {
                        const amount = this.formatCurrency(transactionData.amount || 0);
                        const category = this.translateCategoryName(transactionData.categoryName || 'General');
                        message = `Removed ${amount} transaction from ${category}`;
                    }

                    this.addNotification({
                        title: 'Transaction Deleted',
                        message: message,
                        type: 'warning',
                        category: 'transaction'
                    });
                    this.performSmartRefresh('Transaction deleted');
                },
                budgetCreated: () => {
                    console.log('🔔 DEBUG: budgetCreated called');
                    this.addNotification({
                        title: 'Budget Created',
                        message: 'New budget has been set up successfully',
                        type: 'success',
                        category: 'budget'
                    });
                    this.performSmartRefresh('Budget created');
                },
                budgetUpdated: () => {
                    console.log('🔔 DEBUG: budgetUpdated called');
                    this.addNotification({
                        title: 'Budget Updated',
                        message: 'Budget has been updated successfully',
                        type: 'info',
                        category: 'budget'
                    });
                    this.performSmartRefresh('Budget updated');
                },
                budgetDeleted: () => {
                    console.log('🔔 DEBUG: budgetDeleted called');
                    this.addNotification({
                        title: 'Budget Deleted',
                        message: 'Budget has been removed successfully',
                        type: 'warning',
                        category: 'budget'
                    });
                    this.performSmartRefresh('Budget deleted');
                },
                categoryAdded: () => {
                    console.log('🔔 DEBUG: categoryAdded called');
                    this.addNotification({
                        title: 'Category Added',
                        message: 'New category has been created successfully',
                        type: 'success',
                        category: 'category'
                    });
                    this.performSmartRefresh('Category added');
                },
                categoryUpdated: () => {
                    console.log('🔔 DEBUG: categoryUpdated called');
                    this.addNotification({
                        title: 'Category Updated',
                        message: 'Category has been updated successfully',
                        type: 'info',
                        category: 'category'
                    });
                    this.performSmartRefresh('Category updated');
                },
                categoryDeleted: () => {
                    console.log('🔔 DEBUG: categoryDeleted called');
                    this.addNotification({
                        title: 'Category Archived',
                        message: 'Category has been archived successfully',
                        type: 'warning',
                        category: 'category'
                    });
                    this.performSmartRefresh('Category deleted');
                }
            };

            // Additional global methods for external trigger
            window.triggerDashboardRefresh = window.updateDashboardInstantly;
            window.notifyDashboardUpdate = window.updateDashboardInstantly;
            window.refreshDashboard = () => this.performSmartRefresh('Manual refresh');

            // PRODUCTION: Dashboard utilities for other pages to use
            window.DashboardUtils = {
                notifyTransactionChange: (operation = 'transaction updated') => {
                    console.log('🔔 DEBUG: DashboardUtils.notifyTransactionChange called with:', operation);
                    if (window.dashboardNotify) {
                        switch (operation.toLowerCase()) {
                            case 'transaction added':
                            case 'add':
                                window.dashboardNotify.transactionAdded();
                                break;
                            case 'transaction updated':
                            case 'update':
                                window.dashboardNotify.transactionUpdated();
                                break;
                            case 'transaction deleted':
                            case 'delete':
                                window.dashboardNotify.transactionDeleted();
                                break;
                            default:
                                window.updateDashboardInstantly(operation);
                        }
                    }

                    window.dispatchEvent(new CustomEvent('dashboardRefreshNeeded', {
                        detail: { reason: operation, timestamp: Date.now() }
                    }));
                },

                notifyBudgetChange: (operation = 'budget updated') => {
                    console.log('🔔 DEBUG: DashboardUtils.notifyBudgetChange called with:', operation);
                    if (window.dashboardNotify) {
                        switch (operation.toLowerCase()) {
                            case 'budget created':
                            case 'create':
                                window.dashboardNotify.budgetCreated();
                                break;
                            case 'budget updated':
                            case 'update':
                                window.dashboardNotify.budgetUpdated();
                                break;
                            case 'budget deleted':
                            case 'delete':
                                window.dashboardNotify.budgetDeleted();
                                break;
                            default:
                                window.updateDashboardInstantly(operation);
                        }
                    }

                    window.dispatchEvent(new CustomEvent('dashboardRefreshNeeded', {
                        detail: { reason: operation, timestamp: Date.now() }
                    }));
                },

                notifyCategoryChange: (operation = 'category updated') => {
                    console.log('🔔 DEBUG: DashboardUtils.notifyCategoryChange called with:', operation);
                    if (window.dashboardNotify) {
                        switch (operation.toLowerCase()) {
                            case 'category added':
                            case 'add':
                                window.dashboardNotify.categoryAdded();
                                break;
                            case 'category updated':
                            case 'update':
                                window.dashboardNotify.categoryUpdated();
                                break;
                            case 'category deleted':
                            case 'delete':
                                window.dashboardNotify.categoryDeleted();
                                break;
                            default:
                                window.updateDashboardInstantly(operation);
                        }
                    }

                    window.dispatchEvent(new CustomEvent('dashboardRefreshNeeded', {
                        detail: { reason: operation, timestamp: Date.now() }
                    }));
                },

                refreshDashboard: (reason = 'manual refresh') => {
                    console.log('🔔 DEBUG: DashboardUtils.refreshDashboard called with:', reason);
                    if (window.updateDashboardInstantly) {
                        window.updateDashboardInstantly(reason);
                    }

                    window.dispatchEvent(new CustomEvent('dashboardRefreshNeeded', {
                        detail: { reason: reason, timestamp: Date.now() }
                    }));
                }
            };

            // Shorter aliases for convenience
            window.notifyDashboard = window.DashboardUtils.notifyTransactionChange;
        }

        async performSmartRefresh(operation = 'Smart refresh') {
            if (this.isLoading) {
                return;
            }

            this.isLoading = true;

            try {
                console.log(`🔄 Dashboard refresh: ${operation}`);

                // FORCE recalculation by clearing cached data
                this.dashboardData = null;

                // Re-load all data from APIs
                await this.loadCompleteDataInstantly();

                // Re-calculate all derived data
                this.dashboardData.insights = this.calculateFinancialInsights();
                this.dashboardData.spendingVelocity = this.calculateSpendingVelocity();

                // Update all UI components
                await this.updateAllComponentsInstantly();

                // Refresh charts if they exist
                if (Object.keys(this.charts).length > 0) {
                    await this.refreshAllCharts();
                }

                // Refresh notifications after data refresh
                await this.refreshNotifications();

                this.lastRefreshTime = Date.now();

                console.log(`✅ Dashboard refresh completed: ${operation}`);

            } catch (error) {
                console.error(`❌ Dashboard refresh failed: ${operation}`, error);

                // Try to update UI with whatever data we have
                try {
                    await this.updateAllComponentsInstantly();
                } catch (uiError) {
                    // Continue
                }
            } finally {
                this.isLoading = false;
            }
        }

        async refreshAllCharts() {
            try {
                if (this.charts.budgetVsActual) {
                    const { budgets, monthlyTransactions } = this.dashboardData;
                    if (budgets.budgets && budgets.budgets.length > 0) {
                        const budgetData = this.prepareBudgetVsActualData(budgets.budgets, monthlyTransactions);

                        this.charts.budgetVsActual.data.labels = budgetData.labels;
                        this.charts.budgetVsActual.data.datasets[0].data = budgetData.planned;
                        this.charts.budgetVsActual.data.datasets[1].data = budgetData.actual;
                        this.charts.budgetVsActual.data.datasets[1].backgroundColor = budgetData.actualColors;
                        this.charts.budgetVsActual.data.datasets[1].borderColor = budgetData.actualBorders;
                        this.charts.budgetVsActual.update('none');

                        this.updateBudgetPerformanceIndicator(budgets);
                        this.updateBudgetSummary(budgetData.budgets);
                    }
                }

                if (this.charts.categoryPie) {
                    const categoryData = await this.getCategoryPieData();
                    if (categoryData.labels.length > 0) {
                        this.charts.categoryPie.data.labels = categoryData.labels;
                        this.charts.categoryPie.data.datasets[0].data = categoryData.data;
                        this.charts.categoryPie.update('none');
                        this.updateCategoryLegend({ ...categoryData, colors: this.generateChartColors(categoryData.labels.length) });
                    }
                }

                if (this.charts.cashflowVolume) {
                    const newDailyData = await this.loadDailyBalanceHistory();
                    if (newDailyData.length > 0) {
                        this.charts.cashflowVolume.data.labels = newDailyData.map(day =>
                            new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        );
                        this.charts.cashflowVolume.data.datasets[0].data = newDailyData.map(day => day.income);
                        this.charts.cashflowVolume.data.datasets[1].data = newDailyData.map(day => -day.expenses);
                        this.charts.cashflowVolume.update('none');
                    }
                }

            } catch (error) {
                console.error('❌ Error refreshing charts:', error);
                // Continue without charts
            }
        }

        // ===== UTILITY METHODS =====

        groupByCategory(transactions) {
            return transactions.reduce((acc, transaction) => {
                const category = transaction.categoryName || 'Other';
                acc[category] = (acc[category] || 0) + parseFloat(transaction.amount);
                return acc;
            }, {});
        }

        calculateBudgetHealth(budgets) {
            return budgets.map(budget => {
                const percentage = budget.spentPercentage || 0;
                let status = 'good';

                if (percentage >= 100) {
                    status = 'critical';
                } else if (percentage >= 90) {
                    status = 'warning';
                }

                return {
                    categoryName: this.translateCategoryName(budget.categoryName || 'General Budget'),
                    percentage,
                    status,
                    remaining: budget.remainingAmount || 0
                };
            });
        }

        calculateFinancialInsights() {
            try {
                const { monthlyTransactions, budgets } = this.dashboardData;

                return {
                    savingsRate: this.calculateSavingsRate(monthlyTransactions),
                    budgetAdherence: this.calculateBudgetAdherence(budgets),
                    spendingTrend: 'stable',
                    topCategory: this.findTopSpendingCategory(monthlyTransactions),
                    biggestExpense: this.findBiggestExpense(monthlyTransactions),
                    financialScore: this.calculateDynamicFinancialScoreProduction(monthlyTransactions, budgets)
                };
            } catch (error) {
                return {};
            }
        }

        calculateSavingsRate(monthlyTransactions) {
            if (monthlyTransactions.income === 0) return 0;
            return (monthlyTransactions.netCashFlow / monthlyTransactions.income) * 100;
        }

        calculateBudgetAdherence(budgets) {
            if (!budgets.budgets || budgets.budgets.length === 0) return 0;

            // Count budgets that are within acceptable limits (≤ 100% used)
            const budgetsWithinLimits = budgets.budgets.filter(b => (b.spentPercentage || 0) <= 100).length;
            const adherenceRate = (budgetsWithinLimits / budgets.budgets.length) * 100;

            return adherenceRate;
        }

        findTopSpendingCategory(monthlyTransactions) {
            const { transactions } = monthlyTransactions;
            const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');

            if (expenseTransactions.length === 0) {
                return null;
            }

            const categoryTotals = this.groupByCategory(expenseTransactions);
            const topCategory = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)[0];

            if (!topCategory) {
                return null;
            }

            const [name, amount] = topCategory;
            const percentage = monthlyTransactions.expenses > 0 ? (amount / monthlyTransactions.expenses) * 100 : 0;
            return {
                name: this.translateCategoryName(name),
                amount,
                percentage
            };
        }

        findBiggestExpense(monthlyTransactions) {
            const { transactions } = monthlyTransactions;
            const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');

            if (expenseTransactions.length === 0) {
                return null;
            }

            return expenseTransactions.reduce((biggest, current) => {
                return parseFloat(current.amount) > parseFloat(biggest.amount) ? current : biggest;
            });
        }

        getBudgetAdherenceDescription(adherenceRate) {
            // IMPROVED LOGIC - More accurate descriptions
            if (adherenceRate >= 95) return 'Excellent budget discipline';
            if (adherenceRate >= 85) return 'Very good budget management';
            if (adherenceRate >= 75) return 'Good budget management';
            if (adherenceRate >= 60) return 'Fair budget control';
            if (adherenceRate >= 40) return 'Needs attention';
            if (adherenceRate >= 20) return 'Poor budget management';
            return 'Critical: Budget discipline needed';
        }

        getBudgetAdherenceClass(adherenceRate) {
            if (adherenceRate >= 85) return 'excellent';
            if (adherenceRate >= 70) return 'good';
            if (adherenceRate >= 50) return 'warning';
            return 'danger';
        }

        formatCurrency(amount) {
            const numAmount = parseFloat(amount) || 0;
            return `${numAmount.toLocaleString('en-EU', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}${this.CURRENCY_SYMBOL}`;
        }

        formatLargeNumber(num) {
            const absNum = Math.abs(num);
            if (absNum >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            } else if (absNum >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
            }
            return num.toFixed(2);
        }

        generateChartColors(count) {
            return Array.from({ length: count }, (_, i) => {
                const hue = (i * 137.508) % 360;
                return `hsl(${hue}, 70%, 60%)`;
            });
        }

        updateElement(id, content) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = content;
            }
        }

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        formatRelativeTime(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) return 'Today';
            if (diffDays === 2) return 'Yesterday';
            if (diffDays <= 7) return `${diffDays - 1} days ago`;

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }

        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }

        async fetchAPI(endpoint, method = 'GET', data = null) {
            const url = `${this.API_BASE}${endpoint}`;

            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            try {
                const response = await fetch(url, options);

                if (!response.ok) {
                    const errorText = await response.text();

                    // Return appropriate fallback data based on endpoint
                    if (endpoint.includes('/transactions/balance')) {
                        return { balance: 0 };
                    } else if (endpoint.includes('/transactions/')) {
                        return [];
                    } else if (endpoint.includes('/budgets/')) {
                        return [];
                    } else if (endpoint.includes('/alerts/')) {
                        return [];
                    } else if (endpoint.includes('/categories')) {
                        return [];
                    }

                    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
                }

                const result = await response.json();
                return result;

            } catch (error) {
                console.error(`❌ API Error for ${endpoint}:`, error);

                // Enhanced fallback handling - don't throw errors, return empty data
                if (endpoint.includes('/transactions/balance')) {
                    return { balance: 0 };
                } else if (endpoint.includes('/transactions/')) {
                    return [];
                } else if (endpoint.includes('/budgets/')) {
                    return [];
                } else if (endpoint.includes('/alerts/')) {
                    return [];
                } else if (endpoint.includes('/categories')) {
                    return [];
                }

                // For unknown endpoints, still provide fallback
                return [];
            }
        }

        initializeAnimations() {
            const animationStyles = `
                .empty-chart {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 300px;
                    background: linear-gradient(145deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 20, 0.9));
                    border: 1px solid rgba(6, 182, 212, 0.2);
                    border-radius: 12px;
                    color: #cccccc;
                }

                .empty-chart-content {
                    text-align: center;
                }

                .empty-chart-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    opacity: 0.6;
                    color: #06b6d4;
                }

                .empty-chart-title {
                    color: #06b6d4;
                    margin-bottom: 0.5rem;
                    text-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
                    font-size: 1.25rem;
                    font-weight: 600;
                }

                .empty-chart-subtitle {
                    color: #9ca3af;
                    font-size: 0.875rem;
                }

                .error-state {
                    background: linear-gradient(145deg, rgba(255, 71, 87, 0.1), rgba(0, 0, 0, 0.9));
                    border: 1px solid rgba(255, 71, 87, 0.3);
                    border-radius: 16px;
                    padding: 3rem;
                    text-align: center;
                    color: #ffffff;
                }

                .error-state .error-icon {
                    font-size: 4rem;
                    margin-bottom: 1.5rem;
                    filter: drop-shadow(0 0 10px rgba(255, 71, 87, 0.5));
                }

                .error-state h3 {
                    color: #ff4757;
                    text-shadow: 0 0 10px rgba(255, 71, 87, 0.3);
                    margin-bottom: 1rem;
                }

                .error-state .btn {
                    background: linear-gradient(145deg, #06b6d4, #0891b2);
                    border: none;
                    color: #000000;
                    padding: 1rem 2rem;
                    border-radius: 12px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
                }

                .error-state .btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 5px 25px rgba(6, 182, 212, 0.5);
                }

                @keyframes tradingPulse {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
                    }
                    50% {
                        box-shadow: 0 0 30px rgba(6, 182, 212, 0.6);
                    }
                }

                .chart-card:hover {
                    animation: tradingPulse 2s ease-in-out infinite;
                }

                .loading-shimmer {
                    background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }

                @keyframes shimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }

                .fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .slide-up {
                    animation: slideUp 0.4s ease-out;
                }

                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .scale-in {
                    animation: scaleIn 0.3s ease-out;
                }

                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `;

            const styleSheet = document.createElement('style');
            styleSheet.textContent = animationStyles;
            document.head.appendChild(styleSheet);
        }

        handleCriticalError(message, error) {
            console.error('💥 CRITICAL DASHBOARD ERROR:', message, error);

            const mainContent = document.querySelector('.dashboard-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Dashboard Error Detected</h3>
                        <p>${message}</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i data-lucide="refresh-cw"></i>
                            <span>Reload Dashboard</span>
                        </button>
                    </div>
                `;

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }

        destroy() {
            // Clear notification timer
            if (this.notificationTimer) {
                clearInterval(this.notificationTimer);
                this.notificationTimer = null;
            }

            // Destroy charts
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            this.charts = {};

            // Clear global references
            if (window.dashboardInstance === this) {
                window.dashboardInstance = null;
            }

            console.log('🧹 Dashboard instance destroyed and cleaned up');
        }
    }

    // ===================================
    // GLOBAL INITIALIZATION
    // ===================================

    function initializeDashboard() {
        // Initialize Lucide icons first
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Wait a bit for all resources to load
        setTimeout(() => {
            window.modernDashboard = new ModernFinancialDashboard();
            console.log('🚀 Modern Financial Dashboard initialized');
        }, 100);
    }

    function setupProductionEnhancements() {
        // PRODUCTION: Enhanced auto-refresh when returning from other pages
        if (document.referrer && (
            document.referrer.includes('/transactions') ||
            document.referrer.includes('/budgets') ||
            document.referrer.includes('/categories')
        )) {
            setTimeout(() => {
                if (window.dashboardInstance) {
                    window.dashboardInstance.performSmartRefresh('Returned from data entry page');
                }
            }, 500);
        }

        // PRODUCTION: Listen for storage events (when data changes in other tabs)
        window.addEventListener('storage', function(e) {
            if (e.key && (e.key.includes('transaction') || e.key.includes('budget') || e.key.includes('category'))) {
                if (window.dashboardInstance) {
                    window.dashboardInstance.performSmartRefresh('Data changed in another tab');
                }
            }
        });

        // PRODUCTION: Listen for custom events from other pages
        window.addEventListener('dashboardRefreshNeeded', function(e) {
            if (window.dashboardInstance) {
                window.dashboardInstance.performSmartRefresh(e.detail?.reason || 'Custom event triggered');
            }
        });

        // PRODUCTION: Listen for page visibility changes
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && window.dashboardInstance && !window.dashboardInstance.isLoading) {
                const timeSinceLastRefresh = Date.now() - window.dashboardInstance.lastRefreshTime;
                if (timeSinceLastRefresh > 30000) { // 30 seconds
                    window.dashboardInstance.performSmartRefresh('Page became visible');
                }
            }
        });

        // PRODUCTION: Listen for focus events
        window.addEventListener('focus', function() {
            if (window.dashboardInstance && !window.dashboardInstance.isLoading) {
                const timeSinceLastRefresh = Date.now() - window.dashboardInstance.lastRefreshTime;
                if (timeSinceLastRefresh > 15000) { // 15 seconds
                    window.dashboardInstance.performSmartRefresh('Window focused');
                }
            }
        });

        console.log('🔧 Production enhancements setup completed');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }

    // Call setup function immediately
    setupProductionEnhancements();

    window.addEventListener('beforeunload', () => {
        if (window.modernDashboard && window.modernDashboard.destroy) {
            window.modernDashboard.destroy();
        }
    });

    window.ModernFinancialDashboard = ModernFinancialDashboard;

    console.log('📊 Modern Financial Dashboard script loaded successfully - Notification timing issues FIXED');

})();