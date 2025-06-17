/**
 * COMPLETE FIXED Budgets JavaScript - Perfect Carousel & Innovative Analytics
 * FIXED: All carousel issues, filter stability, English translations, modern icons
 * NEW: Completely different analytics approach with efficiency & health scores
 */

class BudgetsManager {
    constructor() {
        this.API_BASE = '/api';
        this.budgets = [];
        this.categories = [];
        this.filteredBudgets = [];
        this.notifications = [];
        this.currentBudget = null;
        this.isEditing = false;
        this.currentPeriod = {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1
        };
        this.summaryData = {
            totalBudget: 0,
            totalSpent: 0,
            activeBudgets: 0,
            budgetHealth: 0
        };
        this.currentFilter = {
            type: '',
            status: '',
            category: '',
            minAmount: null,
            maxAmount: null
        };

        // FIXED: Perfect Carousel State - Always 2 cards visible
        this.carousel = {
            currentIndex: 0,
            cardsPerView: 2,  // Always exactly 2 cards
            totalCards: 0,
            cardWidth: 390,   // ADJUSTED: Better fit to prevent third card showing
            isInitialized: false
        };

        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Budgets Manager...');
            this.showToast('Loading budgets...', 'info');

            // FIXED: Only clean up if this is a fresh page load
            if (!this.carousel.isInitialized) {
                this.cleanupExistingCarousel();
            }

            this.setupEventListeners();
            this.initializePeriodSelectors();

            await Promise.all([
                this.loadCategories(),
                this.loadBudgetsForCurrentPeriod(),
                this.initializeNotifications()
            ]);

            this.setupCrossTabSync();

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            this.showToast('Budgets loaded successfully!', 'success');
            console.log('✅ Budgets Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Budgets Manager:', error);
            this.showToast('Failed to load budgets page. Please refresh and try again.', 'error');
        }
    }

    /**
     * FIXED: Clean up any existing carousel elements completely
     */
    cleanupExistingCarousel() {
        // Remove all existing carousel wrappers
        document.querySelectorAll('.perfect-carousel-wrapper').forEach(wrapper => {
            const gridContainer = wrapper.querySelector('#budgets-grid');
            if (gridContainer && wrapper.parentNode) {
                wrapper.parentNode.insertBefore(gridContainer, wrapper);
                wrapper.remove();
            }
        });

        // Remove any stray arrows
        document.querySelectorAll('.carousel-arrow').forEach(arrow => arrow.remove());

        // Reset initialization flag
        this.carousel.isInitialized = false;

        console.log('🧹 Cleaned up existing carousel elements');
    }

    setupCrossTabSync() {
        // FIXED: Only refresh data, NOT carousel on focus
        window.addEventListener('focus', () => {
            const lastRefresh = localStorage.getItem('budgetsLastRefresh');
            const now = Date.now();

            if (!lastRefresh || (now - parseInt(lastRefresh)) > 30000) {
                console.log('🔄 Auto-refreshing budget DATA only after window focus');
                // FIXED: Only refresh data, don't recreate carousel
                this.refreshDataOnly();
                localStorage.setItem('budgetsLastRefresh', now.toString());
            }
        });

        window.addEventListener('storage', (e) => {
            if (e.key === 'transactionUpdated' && e.newValue) {
                console.log('🔄 Refreshing budgets after transaction update from other tab');
                // FIXED: Only refresh data, don't recreate carousel
                this.refreshDataOnly();
                localStorage.removeItem('transactionUpdated');
                this.showSyncNotification('Budgets updated from transaction changes');
            }
        });

        window.addEventListener('beforeunload', () => {
            localStorage.setItem('budgetUpdated', Date.now().toString());
        });

        // FIXED: Handle visibility change without carousel recreation
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('👁️ Page became visible - checking carousel state');
                this.ensureCarouselIntegrity();
            }
        });
    }

    signalBudgetUpdate() {
        try {
            localStorage.setItem('budgetUpdated', Date.now().toString());
            console.log('📡 Signaled budget update to other tabs');
        } catch (error) {
            console.warn('Failed to signal budget update:', error);
        }
    }

    showSyncNotification(message) {
        document.querySelectorAll('.sync-notification').forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = 'sync-notification';
        notification.innerHTML = `
            <i data-lucide="refresh-cw"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupEventListeners() {
        // Primary action buttons
        this.addEventListeners([
            ['add-budget-btn', 'click', () => this.openBudgetModal()],
            ['create-first-budget-btn', 'click', () => this.openBudgetModal()],
            ['quick-add-general', 'click', () => this.openBudgetModal('general')],
            ['quick-add-category', 'click', () => this.openBudgetModal('category')]
            // REMOVED: update-spent-btn - not needed
        ]);

        // Modal controls
        this.addEventListeners([
            ['close-budget-modal', 'click', () => this.closeBudgetModal()],
            ['cancel-budget-btn', 'click', () => this.closeBudgetModal()],
            ['close-delete-budget-modal', 'click', () => this.closeDeleteModal()],
            ['cancel-delete-budget-btn', 'click', () => this.closeDeleteModal()],
            ['confirm-delete-budget-btn', 'click', () => this.confirmDeleteBudget()]
        ]);

        // Form handling
        const budgetForm = document.getElementById('budget-form');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => this.handleBudgetSubmit(e));
        }

        // Budget type toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleBudgetTypeToggle(btn));
        });

        // Period navigation
        this.addEventListeners([
            ['prev-month', 'click', () => this.navigatePeriod(-1)],
            ['next-month', 'click', () => this.navigatePeriod(1)],
            ['current-month-btn', 'click', () => this.goToCurrentMonth()],
            ['budget-month', 'change', () => this.onPeriodChange()],
            ['budget-year', 'change', () => this.onPeriodChange()]
        ]);

        // Analytics and notifications
        this.addEventListeners([
            ['budget-filter', 'click', () => this.toggleFilterPanel()],
            ['analytics-btn', 'click', () => this.toggleAnalytics()],
            ['close-analytics', 'click', () => this.closeAnalytics()],
            ['notification-btn', 'click', () => this.toggleNotifications()],
            ['mark-all-read', 'click', () => this.markAllNotificationsAsRead()]
        ]);

        // Filter panel controls
        this.addEventListeners([
            ['close-budget-filter', 'click', () => this.closeFilterPanel()],
            ['apply-budget-filters', 'click', () => this.applyFilters()],
            ['clear-budget-filters', 'click', () => this.clearFilters()]
        ]);

        // FIXED: Carousel controls
        this.addEventListeners([
            ['carousel-prev', 'click', () => this.carouselPrev()],
            ['carousel-next', 'click', () => this.carouselNext()]
        ]);

        // Global event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeAllModals();
            }

            if (!e.target.closest('.notifications-dropdown')) {
                this.closeNotificationsPanel();
            }

            if (!e.target.closest('.filter-panel') && !e.target.closest('#budget-filter')) {
                this.closeFilterPanel();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }

            // Keyboard shortcuts for carousel and other actions
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openBudgetModal();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.toggleFilterPanel();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.carouselPrev();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.carouselNext();
                        break;
                }
            }
        });
    }

    addEventListeners(listeners) {
        listeners.forEach(([id, event, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        });
    }

    initializePeriodSelectors() {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        this.currentPeriod = { year: currentYear, month: currentMonth };

        this.updateElement('budget-month', currentMonth);
        this.updateElement('budget-year', currentYear);
        this.updateElement('budget-month-modal', currentMonth);
        this.updateElement('budget-year-modal', currentYear);

        this.addYearOptions();
    }

    addYearOptions() {
        const yearSelects = ['budget-year', 'budget-year-modal'];
        const currentYear = new Date().getFullYear();

        yearSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '';

                for (let year = currentYear - 2; year <= currentYear + 3; year++) {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    if (year === currentYear) option.selected = true;
                    select.appendChild(option);
                }
            }
        });
    }

    async loadCategories() {
        try {
            const categories = await this.fetchAPI('/categories');
            this.categories = categories.filter(cat => cat.type === 'EXPENSE');
            this.populateCategorySelects();
            console.log('✅ Categories loaded:', this.categories.length);
        } catch (error) {
            console.error('❌ Failed to load categories:', error);
            this.showToast('Failed to load categories. Some features may be limited.', 'warning');
        }
    }

    translateCategoryName(bulgName) {
        const translations = {
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
            'Курсове': 'Courses',
            // ADDED: Budget alert translations
            'Общ бюджет': 'General Budget'
        };

        return translations[bulgName] || bulgName;
    }

    populateCategorySelects() {
        const selects = ['budget-category', 'filter-category'];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;

            if (selectId === 'budget-category') {
                select.innerHTML = '<option value="">Select a category...</option>';
            } else {
                select.innerHTML = '<option value="">All Categories</option>';
            }

            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = this.translateCategoryName(category.name);
                option.style.color = category.color || '#6366f1';
                select.appendChild(option);
            });
        });
    }

    async loadBudgetsForCurrentPeriod() {
        try {
            console.log(`📥 Loading budgets for ${this.currentPeriod.year}-${this.currentPeriod.month}...`);

            const budgets = await this.fetchAPI(`/budgets/period/${this.currentPeriod.year}/${this.currentPeriod.month}`);
            this.budgets = budgets;

            this.calculateSummaryDataFixed();
            this.applyFiltersAndRender();

            console.log('✅ Budgets loaded:', budgets.length);

        } catch (error) {
            console.error('❌ Failed to load budgets:', error);
            this.budgets = [];
            this.showToast('Failed to load budgets. Please check your connection and try again.', 'error');
        }
    }

    calculateSummaryDataFixed() {
        const generalBudgets = this.budgets.filter(b => b.isGeneralBudget);
        const categoryBudgets = this.budgets.filter(b => b.isCategoryBudget);

        // FIXED LOGIC: If General Budget exists, use ONLY that for totals
        if (generalBudgets.length > 0) {
            const generalBudget = generalBudgets[0];
            this.summaryData = {
                totalBudget: parseFloat(generalBudget.plannedAmount || 0),
                totalSpent: parseFloat(generalBudget.spentAmount || 0),
                activeBudgets: this.budgets.length,
                budgetHealth: 0
            };
        } else {
            // No general budget - sum category budgets
            this.summaryData = {
                totalBudget: categoryBudgets.reduce((sum, budget) => sum + parseFloat(budget.plannedAmount || 0), 0),
                totalSpent: categoryBudgets.reduce((sum, budget) => sum + parseFloat(budget.spentAmount || 0), 0),
                activeBudgets: categoryBudgets.length,
                budgetHealth: 0
            };
        }

        if (this.summaryData.totalBudget > 0) {
            this.summaryData.budgetHealth = Math.round((this.summaryData.totalSpent / this.summaryData.totalBudget) * 100);
        }

        this.updateSummaryCards();
    }

    updateSummaryCards() {
        this.updateElement('total-budget', `${this.summaryData.totalBudget.toFixed(0)}`);
        this.updateElement('total-spent', `${this.summaryData.totalSpent.toFixed(0)}`);
        this.updateElement('active-budgets', `${this.summaryData.activeBudgets}`);

        const healthElement = document.getElementById('budget-health');
        if (healthElement) {
            const percentage = this.summaryData.budgetHealth;
            healthElement.innerHTML = `<span class="value-percentage">${percentage}%</span><span class="value-symbol">used</span>`;
        }

        const healthStatusElement = document.getElementById('health-status');
        if (healthStatusElement) {
            let statusText = 'Overall performance';
            let statusColor = 'var(--accent-emerald)';

            if (this.summaryData.budgetHealth >= 100) {
                statusText = 'Over budget';
                statusColor = 'var(--accent-rose)';
            } else if (this.summaryData.budgetHealth >= 90) {
                statusText = 'Near budget limit';
                statusColor = 'var(--accent-amber)';
            } else if (this.summaryData.budgetHealth >= 75) {
                statusText = 'On track';
                statusColor = 'var(--accent-cyan)';
            } else {
                statusText = 'Under budget';
                statusColor = 'var(--accent-emerald)';
            }

            healthStatusElement.textContent = statusText;
            healthStatusElement.style.color = statusColor;
        }

        const spentTrendElement = document.getElementById('spent-trend');
        if (spentTrendElement) {
            const remaining = this.summaryData.totalBudget - this.summaryData.totalSpent;
            if (remaining >= 0) {
                spentTrendElement.textContent = `€${remaining.toFixed(0)} remaining this month`;
            } else {
                spentTrendElement.textContent = `€${Math.abs(remaining).toFixed(0)} over budget`;
            }
        }

        console.log('✅ Summary cards updated with fixed General Budget logic');
    }

    /**
     * FIXED: Apply filters without breaking carousel - Always maintain 2 cards minimum
     */
    applyFiltersAndRender() {
        console.log('🔍 Applying filters:', this.currentFilter);

        let filtered = [...this.budgets];

        if (this.currentFilter.type) {
            if (this.currentFilter.type === 'general') {
                filtered = filtered.filter(b => b.isGeneralBudget);
            } else if (this.currentFilter.type === 'category') {
                filtered = filtered.filter(b => b.isCategoryBudget);
            }
        }

        if (this.currentFilter.status) {
            filtered = filtered.filter(budget => {
                const percentage = parseFloat(budget.spentPercentage || 0);
                switch (this.currentFilter.status) {
                    case 'under':
                        return percentage < 90 && !budget.isOverBudget;
                    case 'near':
                        return percentage >= 90 && !budget.isOverBudget;
                    case 'over':
                        return budget.isOverBudget;
                    default:
                        return true;
                }
            });
        }

        if (this.currentFilter.category) {
            filtered = filtered.filter(b => b.categoryId == this.currentFilter.category);
        }

        if (this.currentFilter.minAmount !== null && this.currentFilter.minAmount > 0) {
            filtered = filtered.filter(b => parseFloat(b.plannedAmount) >= this.currentFilter.minAmount);
        }
        if (this.currentFilter.maxAmount !== null && this.currentFilter.maxAmount > 0) {
            filtered = filtered.filter(b => parseFloat(b.plannedAmount) <= this.currentFilter.maxAmount);
        }

        // FIXED: Ensure at least 2 dummy cards if filtered results are less than 2
        this.filteredBudgets = filtered;

        // FIXED: If less than 2 results, add dummy cards to maintain carousel structure
        if (this.filteredBudgets.length === 1) {
            this.filteredBudgets.push(this.createDummyCard('Add another budget'));
        } else if (this.filteredBudgets.length === 0) {
            this.filteredBudgets = [
                this.createDummyCard('No budgets match your filters'),
                this.createDummyCard('Try adjusting your filters')
            ];
        }

        this.renderBudgetsWithPerfectCarousel();

        console.log(`✅ Filters applied. Original: ${filtered.length}, Display: ${this.filteredBudgets.length}`);
    }

    /**
     * FIXED: Create dummy card for carousel stability
     */
    createDummyCard(message) {
        return {
            id: 'dummy-' + Date.now() + Math.random(),
            isDummy: true,
            categoryName: message,
            plannedAmount: '0',
            spentAmount: '0',
            remainingAmount: 0,
            spentPercentage: 0,
            isOverBudget: false,
            isNearLimit90: false,
            budgetPeriod: '',
            isGeneralBudget: false,
            isCategoryBudget: false,
            categoryColor: '#6366f1'
        };
    }

    /**
     * FIXED: Render budgets without recreating carousel unnecessarily
     */
    renderBudgetsWithPerfectCarousel() {
        const container = document.getElementById('budgets-grid');
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');

        if (!container) return;

        if (loadingState) loadingState.style.display = 'none';

        // FIXED: Always hide empty state when we have filter results (including dummy cards)
        if (emptyState) emptyState.style.display = 'none';

        // FIXED: Always setup carousel wrapper, even for dummy cards
        const existingWrapper = document.querySelector('.perfect-carousel-wrapper');
        const existingArrows = document.querySelectorAll('.carousel-arrow');

        if (!existingWrapper || existingArrows.length !== 2 || !this.carousel.isInitialized) {
            console.log('🔧 Setting up carousel (first time or corrupted)');
            this.setupPerfectCarousel();
        } else {
            console.log('✅ Carousel already exists, keeping it intact');
        }

        // Update carousel state
        this.carousel.totalCards = this.filteredBudgets.length;
        this.carousel.currentIndex = Math.min(this.carousel.currentIndex,
            Math.max(0, this.carousel.totalCards - this.carousel.cardsPerView));

        // Render all cards (this is safe to do)
        container.innerHTML = this.filteredBudgets.map(budget =>
            this.createBudgetCardHTML(budget)
        ).join('');

        // FIXED: Always ensure container is visible and in carousel
        container.style.display = 'flex';

        // Apply layout and controls
        this.applyPerfectCarouselLayout();
        this.updateCarouselControls();

        // FIXED: Always show arrows, but disable them if we have dummy cards
        this.ensureArrowsVisible();

        // Add click handlers
        container.querySelectorAll('.budget-card').forEach(card => {
            const budgetId = card.dataset.budgetId;
            if (!budgetId.startsWith('dummy-')) {
                card.addEventListener('dblclick', () => {
                    this.editBudget(budgetId);
                });
            }
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * FIXED: Ensure arrows are always visible during filtering
     */
    ensureArrowsVisible() {
        const wrapper = document.querySelector('.perfect-carousel-wrapper');
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');

        if (wrapper && prevBtn && nextBtn) {
            // Always show the wrapper as flex
            wrapper.style.display = 'flex';

            // Always show arrows
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';

            // Check if we have only dummy cards
            const hasDummyCards = this.filteredBudgets.some(card => card.isDummy);
            const hasRealCards = this.filteredBudgets.some(card => !card.isDummy);

            if (hasDummyCards && !hasRealCards) {
                // Only dummy cards - disable arrows but keep them visible
                prevBtn.disabled = true;
                nextBtn.disabled = true;
                prevBtn.style.opacity = '0.5';
                nextBtn.style.opacity = '0.5';
                console.log('🎠 Arrows disabled (only dummy cards)');
            } else if (this.carousel.totalCards <= this.carousel.cardsPerView) {
                // 2 or less real cards - disable arrows but keep them visible
                prevBtn.disabled = true;
                nextBtn.disabled = true;
                prevBtn.style.opacity = '0.5';
                nextBtn.style.opacity = '0.5';
                console.log('🎠 Arrows disabled (2 or less cards)');
            } else {
                // Multiple real cards - enable arrows normally
                prevBtn.style.opacity = '1';
                nextBtn.style.opacity = '1';
                this.updateCarouselControls();
                console.log('🎠 Arrows enabled (multiple cards)');
            }
        }
    }

    /**
     * COMPLETELY FIXED: Setup carousel with strict duplicate prevention
     */
    setupPerfectCarousel() {
        const container = document.getElementById('budgets-grid');
        const budgetsContainer = container.parentElement;

        // FIXED: Always remove any existing carousel wrappers first
        const existingWrappers = document.querySelectorAll('.perfect-carousel-wrapper');
        existingWrappers.forEach(wrapper => {
            const gridContainer = wrapper.querySelector('#budgets-grid');
            if (gridContainer && wrapper.parentNode) {
                // Move the grid back to its original parent before removing wrapper
                wrapper.parentNode.insertBefore(gridContainer, wrapper);
                wrapper.remove();
            }
        });

        // FIXED: Clean up any stray carousel arrows
        document.querySelectorAll('.carousel-arrow').forEach(arrow => arrow.remove());

        // Now create fresh carousel wrapper
        const carouselWrapper = document.createElement('div');
        carouselWrapper.className = 'perfect-carousel-wrapper';
        carouselWrapper.innerHTML = `
            <button class="carousel-arrow carousel-prev" id="carousel-prev" title="Previous Cards">
                <i data-lucide="chevron-left"></i>
            </button>
            <div class="carousel-viewport">
                <div class="carousel-track">
                    <!-- Cards container will be moved here -->
                </div>
            </div>
            <button class="carousel-arrow carousel-next" id="carousel-next" title="Next Cards">
                <i data-lucide="chevron-right"></i>
            </button>
        `;

        // Insert the new wrapper
        budgetsContainer.insertBefore(carouselWrapper, container);
        const carouselTrack = carouselWrapper.querySelector('.carousel-track');
        carouselTrack.appendChild(container);

        // FIXED: Add event listeners with proper cleanup
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');

        if (prevBtn && nextBtn) {
            // Remove any existing listeners by cloning
            const newPrevBtn = prevBtn.cloneNode(true);
            const newNextBtn = nextBtn.cloneNode(true);

            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

            // Add fresh listeners
            newPrevBtn.addEventListener('click', () => this.carouselPrev());
            newNextBtn.addEventListener('click', () => this.carouselNext());
        }

        // Mark as initialized
        this.carousel.isInitialized = true;

        console.log('✅ Carousel completely reset with exactly 2 arrows');

        // Refresh Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * FIXED: Apply perfect carousel layout
     */
    applyPerfectCarouselLayout() {
        const container = document.getElementById('budgets-grid');
        if (!container) return;

        // FIXED: Perfect carousel styles
        container.style.display = 'flex';
        container.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        container.style.gap = '1.5rem';
        container.style.width = 'fit-content';

        // FIXED: Calculate perfect offset - always show exactly 2 cards
        const offset = this.carousel.currentIndex * this.carousel.cardWidth;
        container.style.transform = `translateX(-${offset}px)`;
    }

    /**
     * FIXED: Update carousel controls with proper dummy card handling
     */
    updateCarouselControls() {
        const prevBtn = document.getElementById('carousel-prev');
        const nextBtn = document.getElementById('carousel-next');
        const wrapper = document.querySelector('.perfect-carousel-wrapper');

        if (!prevBtn || !nextBtn || !wrapper) return;

        // FIXED: Always show wrapper and arrows
        wrapper.style.display = 'flex';
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';

        // Check if we have real cards that can be navigated
        const realCards = this.filteredBudgets.filter(card => !card.isDummy);

        if (realCards.length <= this.carousel.cardsPerView) {
            // Not enough real cards for navigation
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            prevBtn.style.opacity = '0.5';
            nextBtn.style.opacity = '0.5';
            console.log('🎠 Navigation disabled: not enough cards');
        } else {
            // Normal navigation for real cards
            prevBtn.style.opacity = '1';
            nextBtn.style.opacity = '1';

            const maxIndex = Math.max(0, this.carousel.totalCards - this.carousel.cardsPerView);
            prevBtn.disabled = this.carousel.currentIndex <= 0;
            nextBtn.disabled = this.carousel.currentIndex >= maxIndex;
        }

        console.log(`🎠 Carousel: ${this.carousel.currentIndex}, Total: ${this.carousel.totalCards}, Real: ${realCards.length}`);
    }

    hideCarouselControls() {
        const wrapper = document.querySelector('.perfect-carousel-wrapper');
        if (wrapper) {
            const prevBtn = wrapper.querySelector('.carousel-prev');
            const nextBtn = wrapper.querySelector('.carousel-next');
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
        }
    }

    /**
     * FIXED: Carousel navigation with dummy card awareness
     */
    carouselPrev() {
        // Only navigate if we have real cards to show
        const realCards = this.filteredBudgets.filter(card => !card.isDummy);
        if (realCards.length <= this.carousel.cardsPerView) {
            console.log('⬅️ Navigation disabled: not enough real cards');
            return;
        }

        if (this.carousel.currentIndex > 0) {
            this.carousel.currentIndex--;
            this.applyPerfectCarouselLayout();
            this.updateCarouselControls();
            console.log('⬅️ Carousel moved to previous cards');
        }
    }

    carouselNext() {
        // Only navigate if we have real cards to show
        const realCards = this.filteredBudgets.filter(card => !card.isDummy);
        if (realCards.length <= this.carousel.cardsPerView) {
            console.log('➡️ Navigation disabled: not enough real cards');
            return;
        }

        const maxIndex = Math.max(0, this.carousel.totalCards - this.carousel.cardsPerView);
        if (this.carousel.currentIndex < maxIndex) {
            this.carousel.currentIndex++;
            this.applyPerfectCarouselLayout();
            this.updateCarouselControls();
            console.log('➡️ Carousel moved to next cards');
        }
    }

    /**
     * Create budget card with dynamic remaining text
     */
    createBudgetCardHTML(budget) {
        // Handle dummy cards
        if (budget.isDummy) {
            return `
                <div class="budget-card dummy-card" data-budget-id="${budget.id}">
                    <div class="dummy-content">
                        <div class="dummy-icon">
                            <i data-lucide="plus-circle"></i>
                        </div>
                        <h3 class="dummy-title">${this.escapeHtml(budget.categoryName)}</h3>
                        <p class="dummy-subtitle">Click "Create Budget" to add a new budget</p>
                        <button class="dummy-btn" onclick="budgetsManager.openBudgetModal()">
                            <i data-lucide="plus"></i>
                            <span>Create Budget</span>
                        </button>
                    </div>
                </div>
            `;
        }

        const percentage = parseFloat(budget.spentPercentage || 0);
        const isOverBudget = budget.isOverBudget;
        const isNearLimit = budget.isNearLimit90;

        let statusClass = 'success';
        let statusText = 'On Track';
        let statusIcon = 'check-circle';

        if (isOverBudget) {
            statusClass = 'danger';
            statusText = 'Over Budget';
            statusIcon = 'alert-circle';
        } else if (isNearLimit) {
            statusClass = 'warning';
            statusText = 'Near Limit';
            statusIcon = 'alert-triangle';
        }

        const categoryName = budget.isGeneralBudget ? 'General Budget' : this.translateCategoryName(budget.categoryName);
        const categoryColor = budget.categoryColor || '#6366f1';

        // Dynamic remaining text
        const remainingAmount = parseFloat(budget.remainingAmount);
        let remainingLabel = 'Remaining:';
        let remainingClass = 'remaining';

        if (remainingAmount < 0) {
            remainingLabel = 'Over budget:';
            remainingClass = 'over';
        }

        return `
            <div class="budget-card ${statusClass}" data-budget-id="${budget.id}">
                <div class="budget-header">
                    <div class="budget-icon" style="background-color: ${categoryColor}20; color: ${categoryColor}">
                        <i data-lucide="${budget.isGeneralBudget ? 'wallet' : 'tag'}"></i>
                    </div>
                    <div class="budget-actions">
                        <button class="card-action-btn" onclick="budgetsManager.editBudget(${budget.id})" title="Edit Budget">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button class="card-action-btn delete-action" onclick="budgetsManager.deleteBudget(${budget.id})" title="Delete Budget">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>

                <div class="budget-content">
                    <h3 class="budget-title">${this.escapeHtml(categoryName)}</h3>
                    <div class="budget-period">${budget.budgetPeriod}</div>

                    <div class="budget-amounts">
                        <div class="amount-row">
                            <span class="amount-label">Planned:</span>
                            <span class="amount-value planned">€${budget.plannedAmount}</span>
                        </div>
                        <div class="amount-row">
                            <span class="amount-label">Spent:</span>
                            <span class="amount-value spent">€${budget.spentAmount}</span>
                        </div>
                        <div class="amount-row">
                            <span class="amount-label">${remainingLabel}</span>
                            <span class="amount-value ${remainingClass}">
                                €${Math.abs(remainingAmount).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div class="budget-progress">
                        <div class="progress-header">
                            <span class="progress-label">Progress</span>
                            <span class="progress-percentage">${percentage.toFixed(1)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                    </div>

                    <div class="budget-status ${statusClass}">
                        <i data-lucide="${statusIcon}"></i>
                        <span>${statusText}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * NEW: COMPLETELY DIFFERENT Analytics - Budget Trends & Insights
     */
    toggleAnalytics() {
        const section = document.getElementById('analytics-section');
        if (!section) {
            console.warn('❌ Analytics section not found in DOM');
            this.showToast('Analytics section not available', 'error');
            return;
        }

        const isCurrentlyVisible = section.style.display !== 'none' &&
                                  getComputedStyle(section).display !== 'none';

        if (isCurrentlyVisible) {
            section.style.display = 'none';
            section.classList.remove('active');
            this.showToast('Analytics closed', 'info');
            console.log('📊 Analytics section closed');
        } else {
            section.style.display = 'block';
            section.classList.add('active');

            this.renderInnovativeAnalytics();

            this.showToast('Budget insights opened', 'success');
            console.log('📊 Innovative analytics section opened');

            setTimeout(() => {
                section.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }

    closeAnalytics() {
        const section = document.getElementById('analytics-section');
        if (section) {
            section.style.display = 'none';
            section.classList.remove('active');
            console.log('📊 Analytics section closed');
        }
    }

    /**
     * NEW: Completely different analytics - Budget Trends & Efficiency
     */
    renderInnovativeAnalytics() {
        console.log('📊 Rendering innovative budget analytics...');

        const spendingChart = document.getElementById('spending-chart');
        const progressChart = document.getElementById('progress-chart');

        if (spendingChart) {
            this.renderBudgetEfficiencyAnalysis(spendingChart);
        }

        if (progressChart) {
            this.renderBudgetTrendsAnalysis(progressChart);
        }

        console.log('✅ Innovative analytics rendered successfully');
    }

    /**
     * NEW: Budget Efficiency Analysis
     */
    renderBudgetEfficiencyAnalysis(container) {
        const budgetData = this.budgets
            .filter(b => parseFloat(b.plannedAmount) > 0)
            .map(b => ({
                name: b.isGeneralBudget ? 'General Budget' : this.translateCategoryName(b.categoryName),
                planned: parseFloat(b.plannedAmount),
                spent: parseFloat(b.spentAmount),
                efficiency: parseFloat(b.plannedAmount) > 0 ? (parseFloat(b.spentAmount) / parseFloat(b.plannedAmount)) * 100 : 0,
                color: b.categoryColor || '#6366f1',
                isGeneral: b.isGeneralBudget
            }))
            .sort((a, b) => b.efficiency - a.efficiency);

        let chartHTML = '<div class="innovative-analytics-container">';

        if (budgetData.length > 0) {
            const avgEfficiency = budgetData.reduce((sum, b) => sum + b.efficiency, 0) / budgetData.length;

            chartHTML += `
                <div class="analytics-header">
                    <div class="header-info">
                        <h4><i data-lucide="trending-up"></i> Budget Efficiency</h4>
                        <div class="efficiency-score">
                            <span class="score-label">Average Efficiency:</span>
                            <span class="score-value ${avgEfficiency > 100 ? 'over' : avgEfficiency > 80 ? 'high' : 'good'}">${avgEfficiency.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            `;

            chartHTML += '<div class="efficiency-grid">';

            budgetData.forEach((budget, index) => {
                const efficiencyClass = budget.efficiency > 100 ? 'over-budget' :
                                       budget.efficiency > 90 ? 'near-limit' :
                                       budget.efficiency > 50 ? 'moderate' : 'under-used';

                chartHTML += `
                    <div class="efficiency-card ${efficiencyClass}" style="animation-delay: ${index * 0.1}s">
                        <div class="efficiency-header">
                            <div class="budget-label">
                                <div class="label-icon" style="background-color: ${budget.color}">
                                    <i data-lucide="${budget.isGeneral ? 'wallet' : 'tag'}"></i>
                                </div>
                                <span class="label-text">${budget.name}</span>
                            </div>
                            <div class="efficiency-badge ${efficiencyClass}">
                                ${budget.efficiency.toFixed(0)}%
                            </div>
                        </div>

                        <div class="efficiency-metrics">
                            <div class="metric">
                                <span class="metric-label">Planned</span>
                                <span class="metric-value">€${budget.planned.toFixed(0)}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Used</span>
                                <span class="metric-value">€${budget.spent.toFixed(0)}</span>
                            </div>
                        </div>

                        <div class="efficiency-bar">
                            <div class="bar-track">
                                <div class="bar-fill ${efficiencyClass}" style="width: ${Math.min(budget.efficiency, 100)}%"></div>
                                ${budget.efficiency > 100 ? `<div class="bar-overflow" style="width: ${Math.min(budget.efficiency - 100, 50)}%"></div>` : ''}
                            </div>
                        </div>

                        <div class="efficiency-insight">
                            ${this.getBudgetInsight(budget.efficiency)}
                        </div>
                    </div>
                `;
            });

            chartHTML += '</div>';
        } else {
            chartHTML += `
                <div class="analytics-empty">
                    <div class="empty-icon"><i data-lucide="trending-up"></i></div>
                    <h4>No Budget Efficiency Data</h4>
                    <p>Create budgets to see efficiency analysis</p>
                </div>
            `;
        }

        chartHTML += '</div>';
        container.innerHTML = chartHTML;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * NEW: Budget Trends Analysis
     */
    renderBudgetTrendsAnalysis(container) {
        let trendsHTML = '<div class="innovative-analytics-container">';

        if (this.budgets.length > 0) {
            const totalPlanned = this.budgets.reduce((sum, b) => sum + parseFloat(b.plannedAmount), 0);
            const totalSpent = this.budgets.reduce((sum, b) => sum + parseFloat(b.spentAmount), 0);
            const totalRemaining = totalPlanned - totalSpent;

            trendsHTML += `
                <div class="analytics-header">
                    <div class="header-info">
                        <h4><i data-lucide="bar-chart-3"></i> Budget Overview</h4>
                        <div class="overview-stats">
                            <div class="stat">
                                <span class="stat-value">€${totalPlanned.toFixed(0)}</span>
                                <span class="stat-label">Total Planned</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">€${totalSpent.toFixed(0)}</span>
                                <span class="stat-label">Total Spent</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            trendsHTML += '<div class="trends-grid">';

            // Budget Distribution Pie
            trendsHTML += `
                <div class="trend-card distribution-card">
                    <h5><i data-lucide="pie-chart"></i> Budget Distribution</h5>
                    <div class="distribution-chart">
                        <div class="chart-center">
                            <div class="center-value">€${totalPlanned.toFixed(0)}</div>
                            <div class="center-label">Total Budget</div>
                        </div>
                        <div class="distribution-items">
            `;

            this.budgets.forEach((budget, index) => {
                const percentage = totalPlanned > 0 ? (parseFloat(budget.plannedAmount) / totalPlanned) * 100 : 0;
                const categoryName = budget.isGeneralBudget ? 'General' : this.translateCategoryName(budget.categoryName).substring(0, 10);

                trendsHTML += `
                    <div class="distribution-item">
                        <div class="item-color" style="background-color: ${budget.categoryColor || '#6366f1'}"></div>
                        <span class="item-name">${categoryName}</span>
                        <span class="item-percentage">${percentage.toFixed(1)}%</span>
                    </div>
                `;
            });

            trendsHTML += `
                        </div>
                    </div>
                </div>
            `;

            // Budget Health Score
            const healthScore = totalPlanned > 0 ? ((totalPlanned - totalSpent) / totalPlanned) * 100 : 100;
            const healthStatus = healthScore > 75 ? 'excellent' : healthScore > 50 ? 'good' : healthScore > 25 ? 'fair' : 'poor';

            trendsHTML += `
                <div class="trend-card health-card">
                    <h5><i data-lucide="activity"></i> Budget Health</h5>
                    <div class="health-score">
                        <div class="score-circle ${healthStatus}">
                            <div class="score-value">${Math.max(healthScore, 0).toFixed(0)}</div>
                            <div class="score-label">Health Score</div>
                        </div>
                        <div class="health-insights">
                            <div class="insight">
                                <i data-lucide="target"></i>
                                <span>${this.getHealthInsight(healthScore)}</span>
                            </div>
                            <div class="remaining-budget ${totalRemaining >= 0 ? 'positive' : 'negative'}">
                                <span class="remaining-label">${totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}:</span>
                                <span class="remaining-value">€${Math.abs(totalRemaining).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            trendsHTML += '</div>';
        } else {
            trendsHTML += `
                <div class="analytics-empty">
                    <div class="empty-icon"><i data-lucide="bar-chart-3"></i></div>
                    <h4>No Budget Trends</h4>
                    <p>Create budgets to see trend analysis</p>
                </div>
            `;
        }

        trendsHTML += '</div>';
        container.innerHTML = trendsHTML;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    getBudgetInsight(efficiency) {
        if (efficiency > 100) return 'Over budget - reduce spending this month';
        if (efficiency > 90) return 'Close to limit - monitor spending carefully';
        if (efficiency > 70) return 'Good usage - spending is on track';
        if (efficiency > 30) return 'Light usage - you can spend more if needed';
        return 'Very low usage - consider increasing this budget';
    }

    getHealthInsight(score) {
        if (score > 75) return 'Excellent! You\'re managing money very well';
        if (score > 50) return 'Good control - keep monitoring spending';
        if (score > 25) return 'Need attention - watch your expenses closely';
        if (score >= 0) return 'Budget is stressed - reduce spending now';
        return 'Over budget - take immediate action to cut costs';
    }

    navigatePeriod(direction) {
        const newDate = new Date(this.currentPeriod.year, this.currentPeriod.month - 1 + direction, 1);
        this.currentPeriod = {
            year: newDate.getFullYear(),
            month: newDate.getMonth() + 1
        };

        this.updatePeriodSelectors();
        this.loadBudgetsForCurrentPeriod();
    }

    goToCurrentMonth() {
        const currentDate = new Date();
        this.currentPeriod = {
            year: currentDate.getFullYear(),
            month: currentDate.getMonth() + 1
        };

        this.updatePeriodSelectors();
        this.loadBudgetsForCurrentPeriod();
        this.showToast('Switched to current month', 'info');
    }

    onPeriodChange() {
        const monthSelect = document.getElementById('budget-month');
        const yearSelect = document.getElementById('budget-year');

        if (monthSelect && yearSelect) {
            this.currentPeriod = {
                year: parseInt(yearSelect.value),
                month: parseInt(monthSelect.value)
            };

            this.loadBudgetsForCurrentPeriod();
        }
    }

    updatePeriodSelectors() {
        const monthSelect = document.getElementById('budget-month');
        const yearSelect = document.getElementById('budget-year');

        if (monthSelect) monthSelect.value = this.currentPeriod.month;
        if (yearSelect) yearSelect.value = this.currentPeriod.year;
    }

    openBudgetModal(type = null, budget = null) {
        const modal = document.getElementById('budget-modal');
        const form = document.getElementById('budget-form');
        const title = document.getElementById('budget-modal-title');

        if (!modal || !form) return;

        form.reset();
        this.clearFormErrors();

        this.isEditing = !!budget;
        this.currentBudget = budget;

        if (title) {
            if (this.isEditing) {
                title.textContent = 'Edit Budget';
            } else if (type === 'general') {
                title.textContent = 'Create General Budget';
            } else if (type === 'category') {
                title.textContent = 'Create Category Budget';
            } else {
                title.textContent = 'Create New Budget';
            }
        }

        if (type || (budget && (budget.isGeneralBudget ? 'general' : 'category'))) {
            this.setBudgetType(type || (budget.isGeneralBudget ? 'general' : 'category'));
        }

        if (!this.isEditing) {
            document.getElementById('budget-month-modal').value = this.currentPeriod.month;
            document.getElementById('budget-year-modal').value = this.currentPeriod.year;
        }

        if (this.isEditing && budget) {
            this.populateBudgetForm(budget);
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            const firstInput = form.querySelector('input:not([type="hidden"]), select');
            if (firstInput) firstInput.focus();
        }, 100);

        console.log(`📝 Opened budget modal: ${this.isEditing ? 'Edit' : 'Create'} mode${type ? ` (${type})` : ''}`);
    }

    populateBudgetForm(budget) {
        const elements = {
            'budget-id': budget.id,
            'budget-amount': budget.plannedAmount,
            'budget-category': budget.categoryId || '',
            'budget-month-modal': budget.budgetMonth,
            'budget-year-modal': budget.budgetYear
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
    }

    handleBudgetTypeToggle(clickedBtn) {
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        clickedBtn.classList.add('active');

        const categoryGroup = document.getElementById('category-group');
        if (categoryGroup) {
            categoryGroup.style.display = clickedBtn.dataset.type === 'category' ? 'block' : 'none';
        }

        console.log(`🔄 Switched to ${clickedBtn.dataset.type} budget type`);
    }

    setBudgetType(type) {
        const buttons = document.querySelectorAll('.toggle-btn');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        const categoryGroup = document.getElementById('category-group');
        if (categoryGroup) {
            categoryGroup.style.display = type === 'category' ? 'block' : 'none';
        }
    }

    async handleBudgetSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = document.getElementById('submit-budget-btn');

        try {
            if (!this.validateBudgetForm(form)) {
                this.showToast('Please correct the errors and try again.', 'error');
                return;
            }

            this.setButtonLoading(submitBtn, true);

            const formData = new FormData(form);
            const budgetData = this.prepareBudgetData(formData);

            let result;
            if (this.isEditing) {
                result = await this.updateBudget(this.currentBudget.id, budgetData);
                this.showToast('Budget updated successfully!', 'success');

                this.addNotification({
                    title: 'Budget Updated',
                    message: `${budgetData.type === 'general' ? 'General' : 'Category'} budget of €${budgetData.plannedAmount} updated`,
                    type: 'info'
                });
            } else {
                result = await this.createBudget(budgetData);
                this.showToast('Budget created successfully!', 'success');

                this.addNotification({
                    title: 'New Budget Created',
                    message: `${budgetData.type === 'general' ? 'General' : 'Category'} budget of €${budgetData.plannedAmount} created`,
                    type: 'success'
                });
            }

            this.signalBudgetUpdate();
            await this.refreshDataOnly(); // FIXED: Only refresh data, not carousel
            this.closeBudgetModal();

            console.log(`✅ Budget ${this.isEditing ? 'updated' : 'created'} successfully`);

        } catch (error) {
            console.error('❌ Budget submission failed:', error);
            this.showToast(
                error.message || `Failed to ${this.isEditing ? 'update' : 'create'} budget. Please try again.`,
                'error'
            );
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    validateBudgetForm(form) {
        let isValid = true;
        this.clearFormErrors();

        const amount = form.plannedAmount.value;
        if (!amount || parseFloat(amount) <= 0) {
            this.showFieldError('amount-error', 'Amount must be greater than 0');
            isValid = false;
        }

        const activeBudgetType = document.querySelector('.toggle-btn.active')?.dataset.type;
        if (activeBudgetType === 'category' && !form.categoryId.value) {
            this.showFieldError('category-error', 'Please select a category');
            isValid = false;
        }

        if (!form.budgetMonth.value || !form.budgetYear.value) {
            this.showFieldError('month-error', 'Period is required');
            isValid = false;
        }

        return isValid;
    }

    prepareBudgetData(formData) {
        const activeBudgetType = document.querySelector('.toggle-btn.active')?.dataset.type;

        const data = {
            plannedAmount: parseFloat(formData.get('plannedAmount')),
            year: parseInt(formData.get('budgetYear')),
            month: parseInt(formData.get('budgetMonth')),
            type: activeBudgetType
        };

        if (activeBudgetType === 'category') {
            data.categoryId = parseInt(formData.get('categoryId'));
        }

        return data;
    }

    async createBudget(budgetData) {
        const endpoint = budgetData.categoryId ? '/budgets/category' : '/budgets/general';
        return await this.fetchAPI(endpoint, 'POST', budgetData);
    }

    async updateBudget(id, budgetData) {
        return await this.fetchAPI(`/budgets/${id}`, 'PUT', { plannedAmount: budgetData.plannedAmount });
    }

    async editBudget(budgetId) {
        try {
            const budget = await this.fetchAPI(`/budgets/${budgetId}`);
            this.openBudgetModal(null, budget);
        } catch (error) {
            console.error('❌ Failed to load budget for editing:', error);
            this.showToast('Failed to load budget details. Please try again.', 'error');
        }
    }

    deleteBudget(budgetId) {
        const budget = this.budgets.find(b => b.id == budgetId);
        if (!budget) {
            this.showToast('Budget not found.', 'error');
            return;
        }

        this.showDeleteConfirmation(budget);
    }

    showDeleteConfirmation(budget) {
        const modal = document.getElementById('delete-budget-modal');
        const preview = document.getElementById('delete-budget-preview');

        if (!modal || !preview) return;

        this.currentBudget = budget;

        const categoryName = budget.isGeneralBudget ? 'General Budget' : this.translateCategoryName(budget.categoryName);

        preview.innerHTML = `
            <div class="budget-summary">
                <div class="summary-title">${this.escapeHtml(categoryName)}</div>
                <div class="summary-amount">€${budget.plannedAmount}</div>
                <div class="summary-period">${budget.budgetPeriod}</div>
                <div class="summary-spent">€${budget.spentAmount} spent</div>
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        console.log(`🗑️ Showing delete confirmation for budget ${budget.id}`);
    }

    async confirmDeleteBudget() {
        if (!this.currentBudget) return;

        const deleteBtn = document.getElementById('confirm-delete-budget-btn');

        try {
            this.setButtonLoading(deleteBtn, true);

            await this.fetchAPI(`/budgets/${this.currentBudget.id}`, 'DELETE');

            this.showToast('Budget deleted successfully!', 'success');

            this.addNotification({
                title: 'Budget Deleted',
                message: `Budget for ${this.currentBudget.categoryName || 'General'} has been removed`,
                type: 'warning'
            });

            this.signalBudgetUpdate();
            await this.refreshDataOnly(); // FIXED: Only refresh data, not carousel
            this.closeDeleteModal();

            console.log(`✅ Budget ${this.currentBudget.id} deleted successfully`);

        } catch (error) {
            console.error('❌ Failed to delete budget:', error);
            this.showToast('Failed to delete budget. Please try again.', 'error');
        } finally {
            this.setButtonLoading(deleteBtn, false);
        }
    }

    closeBudgetModal() {
        const modal = document.getElementById('budget-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';

            this.isEditing = false;
            this.currentBudget = null;

            console.log('❌ Closed budget modal');
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('delete-budget-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            this.currentBudget = null;
        }
    }

    closeAllModals() {
        this.closeBudgetModal();
        this.closeDeleteModal();
        this.closeFilterPanel();
        this.closeAnalytics();
    }

    toggleFilterPanel() {
        const panel = document.getElementById('budget-filter-panel');
        if (panel) {
            panel.classList.toggle('active');
        }
    }

    closeFilterPanel() {
        const panel = document.getElementById('budget-filter-panel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    applyFilters() {
        const filterType = document.getElementById('filter-budget-type')?.value || '';
        const filterStatus = document.getElementById('filter-status')?.value || '';
        const filterCategory = document.getElementById('filter-category')?.value || '';
        const filterMinAmount = document.getElementById('filter-min-amount')?.value;
        const filterMaxAmount = document.getElementById('filter-max-amount')?.value;

        this.currentFilter = {
            type: filterType,
            status: filterStatus,
            category: filterCategory,
            minAmount: filterMinAmount ? parseFloat(filterMinAmount) : null,
            maxAmount: filterMaxAmount ? parseFloat(filterMaxAmount) : null
        };

        this.applyFiltersAndRender();
        this.closeFilterPanel();

    }

    clearFilters() {
        this.currentFilter = {
            type: '',
            status: '',
            category: '',
            minAmount: null,
            maxAmount: null
        };

        const filterInputs = ['filter-budget-type', 'filter-status', 'filter-category', 'filter-min-amount', 'filter-max-amount'];
        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });

        this.applyFiltersAndRender();
        this.closeFilterPanel();
        this.showToast('All filters cleared', 'info');
    }

    getActiveFiltersCount() {
        let count = 0;
        if (this.currentFilter.type) count++;
        if (this.currentFilter.status) count++;
        if (this.currentFilter.category) count++;
        if (this.currentFilter.minAmount !== null) count++;
        if (this.currentFilter.maxAmount !== null) count++;
        return count;
    }

    async initializeNotifications() {
        try {
            await this.loadNotifications();
            this.updateNotificationBadge();
            console.log('✅ Notifications initialized');
        } catch (error) {
            console.error('❌ Failed to initialize notifications:', error);
        }
    }

    async loadNotifications() {
        try {
            const alerts = await this.fetchAPI('/alerts');
            this.notifications = alerts;
        } catch (error) {
            console.error('❌ Failed to load notifications:', error);
            this.notifications = [];
        }
    }

    toggleNotifications() {
        const panel = document.getElementById('notifications-panel');
        if (panel && panel.classList.contains('active')) {
            this.closeNotificationsPanel();
        } else {
            this.showNotificationsPanel();
        }
    }

    async showNotificationsPanel() {
        try {
            await this.loadNotifications();

            const panel = document.getElementById('notifications-panel');
            if (!panel) return;

            this.renderNotifications();
            panel.classList.add('active');

            console.log('🔔 Notifications panel opened');
        } catch (error) {
            console.error('❌ Failed to load notifications:', error);
            this.showToast('Failed to load notifications', 'error');
        }
    }

    closeNotificationsPanel() {
        const panel = document.getElementById('notifications-panel');
        if (panel) {
            panel.classList.remove('active');
        }
    }

    renderNotifications() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="no-notifications">
                    <i data-lucide="bell-off"></i>
                    <p>No budget alerts</p>
                </div>
            `;
        } else {
            container.innerHTML = this.notifications.map(notification => `
                <div class="notification-item ${notification.isRead ? '' : 'unread'}"
                     onclick="budgetsManager.markNotificationAsRead(${notification.id})">
                    <div class="notification-icon ${notification.severity}">
                        <i data-lucide="${notification.severity === 'danger' ? 'zap' : 'trending-up'}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${this.escapeHtml(notification.message)}</div>
                        <div class="notification-details">
                            ${this.escapeHtml(this.translateCategoryName(notification.categoryName))} - ${notification.budgetPeriod}
                        </div>
                        <div class="notification-time">${this.formatRelativeTime(notification.createdAt)}</div>
                    </div>
                </div>
            `).join('');
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

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

    async markNotificationAsRead(notificationId) {
        try {
            await this.fetchAPI(`/alerts/${notificationId}/read`, 'PUT');

            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.isRead = true;
            }

            this.updateNotificationBadge();
            this.renderNotifications();

            console.log(`✅ Marked notification ${notificationId} as read`);
        } catch (error) {
            console.error('❌ Failed to mark notification as read:', error);
        }
    }

    async markAllNotificationsAsRead() {
        try {
            await this.fetchAPI('/alerts/read-all', 'PUT');

            this.notifications.forEach(notification => {
                notification.isRead = true;
            });

            this.updateNotificationBadge();
            this.renderNotifications();
            this.showToast('All notifications marked as read', 'success');

            console.log('✅ Marked all notifications as read');
        } catch (error) {
            console.error('❌ Failed to mark all notifications as read:', error);
            this.showToast('Failed to update notifications', 'error');
        }
    }

    addNotification(notification) {
        const newNotification = {
            ...notification,
            id: Date.now(),
            isRead: false,
            createdAt: new Date().toISOString(),
            severity: notification.type === 'warning' ? 'warning' : 'info',
            icon: notification.type === 'warning' ? '⚠️' : 'ℹ️'
        };

        this.notifications.unshift(newNotification);
        this.notifications.splice(20);
        this.updateNotificationBadge();
    }

    /**
     * FIXED: Only refresh data without recreating carousel
     */
    async refreshDataOnly() {
        try {
            console.log('🔄 Refreshing budget data only (keeping carousel intact)...');

            await Promise.all([
                this.loadBudgetsForCurrentPeriod(),
                this.loadNotifications()
            ]);

            this.updateNotificationBadge();

            console.log('✅ Budget data refreshed without touching carousel');
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
        }
    }

    /**
     * LEGACY: Keep for compatibility but use refreshDataOnly instead
     */
    async refreshAllData() {
        return this.refreshDataOnly();
    }

    /**
     * FIXED: Ensure carousel integrity without recreation
     */
    ensureCarouselIntegrity() {
        const wrapper = document.querySelector('.perfect-carousel-wrapper');
        const arrows = document.querySelectorAll('.carousel-arrow');

        if (!wrapper || arrows.length !== 2) {
            console.log('🔧 Carousel integrity compromised, fixing...');
            // Only fix if actually broken
            this.setupPerfectCarousel();
        } else {
            console.log('✅ Carousel integrity maintained');
            // Just ensure proper layout
            this.applyPerfectCarouselLayout();
            this.updateCarouselControls();
        }
    }

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

    showFieldError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('visible');
        }
    }

    clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('visible');
            error.textContent = '';
        });
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'SELECT') {
                element.value = content;
            } else {
                element.textContent = content;
            }
        }
    }

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

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

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

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

            if (!response.ok) {
                let errorMessage = `Request failed with status ${response.status}`;

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }

                throw new Error(errorMessage);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw error;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.budgetsManager = new BudgetsManager();
});