/**
 * COMPLETELY FIXED Budgets JavaScript - RESPONSIVE CAROUSEL WITH SMART DEVICE ADAPTATION
 * ✅ FIXED: Mobile/Tablet notifications panel display issue - now shows properly on all devices
 * ✅ FIXED: Carousel cards maintain CONSTANT size regardless of content
 * ✅ FIXED: Container never shrinks/grows during navigation
 * ✅ FIXED: Perfect carousel stability with RESPONSIVE card sizing
 * ✅ NEW: SMART RESPONSIVE - 1 card on mobile, 2 on tablet+, 3 on desktop+
 * ✅ UPDATED: English notifications with smart time logic and purple scrollbar
 * ✅ FIXED: All Bulgarian messages translated to English
 * ✅ NEW: Smart time updates (15min <1h, hourly 1h-1d, hide >1d)
 * ✅ REMOVED: Emoji prefixes from notification messages
 * ✅ FIXED: Total Spent calculation - ONLY from Category Budgets (excluding General Budget)
 * ✅ UPDATED: Category name truncation - limit to 20 characters with ".." suffix
 * ✅ ENHANCED: Smart category truncation based on case patterns (15 chars for mixed/uppercase)
 * ✅ FIXED: Validation order for maximum amount check - NOW WORKS CORRECTLY
 * ✅ COMPLETELY FIXED: Notification logic - proper creation, loading and display
 * ✅ NEW: Analytics-specific truncation - mixed case with >3 uppercase letters = 7 chars for Top Spending Categories
 * FIXED: General Budget logic, analytics calculations, duplicate prevention
 * NEW: Dynamic dropdown sizing for exactly 5 visible options
 * FIXED: Enhanced category dropdown scroller functionality
 * COMPLETELY FIXED: Category deselect functionality with visual feedback
 * ✅ NEW: RESPONSIVE CAROUSEL SYSTEM - Perfect adaptation for all devices
 * ✅ FIXED: Mobile analytics layout - Budget Health under Top Spending Categories in single column
 * ✅ FIXED: Header layout symmetry - perfectly aligned with hamburger in responsive versions
 * ✅ CRITICAL FIX: Responsive resize handling - fixed expand/contract window behavior
 * ✅ FIXED: Summary cards hover clipping issue - proper z-index and overflow handling
 * ✅ CRITICAL FIX: Mobile/Tablet notifications panel - fixed positioning and display issues
 */

class BudgetsManager {
	constructor() {
		this.API_BASE = '/api';
		this.budgets = [];
		this.categories = [];
		this.filteredBudgets = [];
		this.notifications = []; // API notifications
		this.localNotifications = []; // ✅ НОВО: Локални нотификации
		this.currentBudget = null;
		this.isEditing = false;
		this.timeUpdateInterval = null;
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

		// ✅ COMPLETELY NEW: RESPONSIVE CAROUSEL SYSTEM
		this.carousel = {
			currentIndex: 0,
			cardsPerView: 2,           // ✅ DEFAULT: Will be updated by responsive logic
			totalCards: 0,
			cardWidth: 360,            // ✅ DEFAULT: Will be updated by responsive logic
			cardGap: 24,               // ✅ FIXED: Constant gap
			containerWidth: 0,         // ✅ NEW: Pre-calculated container width
			isInitialized: false,
			maxContainerWidth: 744,    // ✅ DEFAULT: Will be updated by responsive logic

			// ✅ NEW: RESPONSIVE BREAKPOINTS AND SETTINGS
			responsive: {
				mobile: {
					maxWidth: 767,
					cardsPerView: 1,
					cardWidth: 280,
					cardGap: 16
				},
				tablet: {
					maxWidth: 1023,
					cardsPerView: 1,  // ✅ FIXED: Changed from 2 to 1 to prevent arrows touching cards
					cardWidth: 360,   // ✅ ENHANCED: Larger card width for better tablet experience
					cardGap: 20
				},
				desktop: {
					maxWidth: 1299,   // ✅ INCREASED: From 1199 to 1299 for more breathing room
					cardsPerView: 2,
					cardWidth: 360,   // ✅ KEPT: Original 360px
					cardGap: 16       // ✅ DECREASED: From 24px to 16px for better fit
				},
				large: {
					maxWidth: 1399,
					cardsPerView: 2,
					cardWidth: 400,   // ✅ INCREASED: From 380 to 400 for large screens
					cardGap: 24
				},
				ultraWide: {
					maxWidth: Infinity,
					cardsPerView: 3,
					cardWidth: 400,   // ✅ INCREASED: From 380 to 400 for ultra wide screens
					cardGap: 24
				}
			}
		};

		// ✅ NEW: Current device type for responsive behavior
		this.currentDevice = 'desktop';
		this.resizeObserver = null;
		this.lastWindowWidth = window.innerWidth; // ✅ CRITICAL FIX: Track last window width

		this.init();
	}

	async init() {
		try {
			console.log('🚀 Initializing Responsive Budgets Manager...');
			this.showToast('Loading budgets...', 'info');

			// ✅ CRITICAL FIX: Apply summary cards hover fix
			this.applySummaryCardsHoverFix();

			// ✅ NEW: Initialize responsive system first
			this.initializeResponsiveSystem();

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
			this.startSmartTimeUpdates();

			if (typeof lucide !== 'undefined') {
				lucide.createIcons();
			}

			this.showToast('Budgets loaded successfully!', 'success');
			console.log('✅ Responsive Budgets Manager initialized successfully');
		} catch (error) {
			console.error('❌ Failed to initialize Budgets Manager:', error);
			this.showToast('Failed to load budgets page. Please refresh and try again.', 'error');
		}
	}

	/**
	 * ✅ CRITICAL FIX: Apply CSS fix for summary cards AND budget types hover clipping issues
	 */
	applySummaryCardsHoverFix() {
		const styleId = 'cards-hover-fix';

		// Remove existing styles if any
		const existingStyle = document.getElementById(styleId);
		if (existingStyle) {
			existingStyle.remove();
		}

		// Add CSS fix for all cards hover clipping
		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
			/* ✅ CRITICAL FIX: Summary cards hover clipping issue */
			.overview-grid {
				overflow: visible !important;
				z-index: 1 !important;
				position: relative !important;
			}

			.budget-overview-section {
				overflow: visible !important;
				z-index: 1 !important;
				position: relative !important;
			}

			.summary-card {
				position: relative !important;
				z-index: 2 !important;
			}

			.summary-card:hover {
				z-index: 10 !important;
				position: relative !important;
			}

			/* ✅ CRITICAL FIX: Budget types cards hover clipping issue */
			.budget-types-grid {
				overflow: visible !important;
				z-index: 1 !important;
				position: relative !important;
			}

			.budget-types-section {
				overflow: visible !important;
				z-index: 1 !important;
				position: relative !important;
			}

			.budget-type-card {
				position: relative !important;
				z-index: 2 !important;
			}

			.budget-type-card:hover {
				z-index: 10 !important;
				position: relative !important;
			}

			/* ✅ Ensure parent containers don't clip the hover effects */
			.dashboard-content {
				overflow: visible !important;
			}

			.section {
				overflow: visible !important;
			}

			.container,
			.main-content {
				overflow: visible !important;
			}

			/* ✅ Fix for any wrapper containers */
			.overview-wrapper,
			.budget-overview-wrapper,
			.summary-wrapper,
			.budget-types-wrapper,
			.types-wrapper {
				overflow: visible !important;
				z-index: 1 !important;
				position: relative !important;
			}

			/* ✅ EXTRA FIX: Ensure all card containers allow overflow */
			.cards-container,
			.grid-container {
				overflow: visible !important;
				z-index: 1 !important;
				position: relative !important;
			}
		`;

		document.head.appendChild(style);
		console.log('✅ All cards hover fix applied - no more clipping on hover for summary cards AND budget type cards');
	}

	/**
	 * ✅ CRITICAL FIX: Initialize responsive system with improved resize handling
	 */
	initializeResponsiveSystem() {
		// ✅ UPDATED: CSS overrides for perfect header symmetry with hamburger
		this.addSymmetricHeaderPositionCSS();

		// Detect current device and update carousel settings
		this.updateResponsiveSettings();

		// Set up resize observer for real-time responsive updates
		this.setupResponsiveResizeHandler();

		// ✅ CRITICAL FIX: Enhanced window resize listener with debouncing and proper state tracking
		window.addEventListener('resize', this.debounce(() => {
			this.handleResponsiveResizeFixed();
		}, 200)); // ✅ REDUCED: Debounce time for more responsive behavior

		console.log('📱 Responsive system initialized:', {
			device: this.currentDevice,
			cardsPerView: this.carousel.cardsPerView,
			cardWidth: this.carousel.cardWidth,
			maxContainerWidth: this.carousel.maxContainerWidth,
			initialWidth: this.lastWindowWidth
		});
	}

	/**
	 * ✅ CRITICAL FIX: Fixed CSS for perfect header symmetry AND proper notifications panel positioning on mobile/tablet
	 */
	addSymmetricHeaderPositionCSS() {
		const styleId = 'symmetric-header-position-override';

		// Remove existing styles if any
		const existingStyle = document.getElementById(styleId);
		if (existingStyle) {
			existingStyle.remove();
		}

		// Add new symmetric header positioning styles
		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
			.mobile-hamburger {
				position: relative !important;
				top: auto !important;
				left: auto !important;
				z-index: 1001 !important;
				margin: 0 !important;
			}

			/* ✅ CRITICAL FIX: Notifications panel positioning - COMPLETELY REWRITTEN FOR MOBILE/TABLET */
			.notifications-dropdown {
				position: relative !important;
			}

			.notifications-panel {
				position: absolute !important;
				top: calc(100% + 0.5rem) !important;
				z-index: 9999 !important;
				opacity: 0;
				visibility: hidden;
				transition: all 0.2s ease;
				box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
				border-radius: 12px;
				overflow: hidden;
				pointer-events: none;
			}

			.notifications-panel.active {
				opacity: 1 !important;
				visibility: visible !important;
				pointer-events: auto !important;
			}

			/* ✅ DESKTOP: Standard dropdown from right side of bell */
			@media (min-width: 1024px) {
				.notifications-panel {
					right: 0 !important;
					left: auto !important;
					width: 400px !important;
					max-width: 400px !important;
					max-height: 75vh !important;
					transform: translateX(0) !important;
				}
			}

			/* ✅ TABLET: FIXED positioning for tablet - dropdown style */
			@media (min-width: 768px) and (max-width: 1023px) {
				.notifications-panel {
					position: fixed !important;
					top: 20% !important;
					left: 50% !important;
					right: auto !important;
					width: 400px !important;
					max-width: calc(100vw - 2rem) !important;
					max-height: 70vh !important;
					transform: translate(-50%, -10px) scale(0.95) !important;
					z-index: 9999 !important;
				}

				.notifications-panel.active {
					transform: translate(-50%, 0) scale(1) !important;
				}
			}

			/* ✅ MOBILE: FIXED positioning for mobile - dropdown style */
			@media (max-width: 767px) {
				.notifications-panel {
					position: fixed !important;
					top: 15% !important;
					left: 50% !important;
					right: auto !important;
					width: 350px !important;
					max-width: calc(100vw - 1.5rem) !important;
					max-height: 75vh !important;
					transform: translate(-50%, -10px) scale(0.95) !important;
					z-index: 9999 !important;
				}

				.notifications-panel.active {
					transform: translate(-50%, 0) scale(1) !important;
				}
			}

			/* ✅ SMALL MOBILE: Extra small screens */
			@media (max-width: 479px) {
				.notifications-panel {
					width: 320px !important;
					max-width: calc(100vw - 1rem) !important;
					max-height: 75vh !important;
				}
			}

			/* ✅ LANDSCAPE MOBILE: Special handling for landscape orientation */
			@media (max-width: 1023px) and (orientation: landscape) {
				.notifications-panel {
					max-height: 60vh !important;
				}
			}

			/* ✅ EXTRA SAFETY: Force visibility and prevent clipping */
			.notifications-dropdown,
			.header-right,
			.dashboard-header {
				overflow: visible !important;
			}

			/* ✅ HIGH DPI DISPLAYS: Adjust for high density screens */
			@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
				.notifications-panel {
					box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
				}
			}

			@media (max-width: 1023px) {
				.dashboard-header {
					position: relative !important;
					padding: var(--space-md) !important;
					display: flex !important;
					flex-direction: column !important;
					align-items: stretch !important;
					gap: var(--space-md) !important;
				}

				.mobile-hamburger {
					position: absolute !important;
					top: var(--space-md) !important;
					left: var(--space-md) !important;
					z-index: 150 !important;
					width: 48px !important;
					height: 48px !important;
				}

				.header-left {
					margin-left: calc(48px + var(--space-md)) !important;
					width: calc(100% - 48px - var(--space-md)) !important;
					margin-top: 0 !important;
					display: flex !important;
					flex-direction: column !important;
					align-items: flex-start !important;
				}

				.header-left h1 {
					margin: 0 !important;
					line-height: 1.2 !important;
				}

				.page-subtitle {
					margin: 0.25rem 0 0 0 !important;
					line-height: 1.3 !important;
				}

				.header-right {
					display: flex !important;
					align-items: center !important;
					gap: var(--space-md) !important;
					width: 100% !important;
					margin: 0 !important;
					padding: 0 !important;
				}

				.notifications-dropdown {
					flex-shrink: 0 !important;
					margin: 0 !important;
					position: relative !important;
				}

				.quick-actions {
					flex: 1 !important;
					display: flex !important;
					gap: var(--space-sm) !important;
				}

				.quick-action-btn {
					flex: 1 !important;
					min-width: 0 !important;
				}
			}

			@media (max-width: 767px) {
				.dashboard-header {
					padding: var(--space-md) !important;
				}

				.mobile-hamburger {
					width: 48px !important;
					height: 48px !important;
					top: var(--space-md) !important;
					left: var(--space-md) !important;
				}

				.header-left {
					margin-left: calc(48px + var(--space-md)) !important;
				}

				.header-left h1 {
					font-size: 1.5rem !important;
				}

				.page-subtitle {
					font-size: 0.8rem !important;
				}
			}

			@media (max-width: 479px) {
				.dashboard-header {
					padding: var(--space-sm) !important;
				}

				.mobile-hamburger {
					width: 40px !important;
					height: 40px !important;
					top: var(--space-sm) !important;
					left: var(--space-sm) !important;
				}

				.header-left {
					margin-left: calc(40px + var(--space-sm)) !important;
				}

				.header-left h1 {
					font-size: 1.25rem !important;
				}

				.page-subtitle {
					font-size: 0.75rem !important;
				}
			}

			@media (min-width: 768px) and (max-width: 1023px) {
				.dashboard-header {
					padding: var(--space-lg) !important;
					padding-left: calc(56px + var(--space-lg) + var(--space-lg)) !important;
					display: flex !important;
					flex-direction: row !important;
					align-items: center !important;
					justify-content: space-between !important;
					position: relative !important;
				}

				.mobile-hamburger {
					position: absolute !important;
					top: var(--space-lg) !important;
					left: var(--space-lg) !important;
					transform: none !important;
					width: 48px !important;
					height: 48px !important;
					z-index: 150 !important;
				}

				.header-left {
					flex: 1 !important;
					margin-left: 0 !important;
					width: auto !important;
				}

				.header-left h1 {
					font-size: 1.75rem !important;
				}

				.header-right {
					display: flex !important;
					align-items: center !important;
					gap: var(--space-md) !important;
					width: auto !important;
				}

				.quick-actions {
					display: flex !important;
					flex-direction: row !important;
					gap: var(--space-sm) !important;
					flex: none !important;
				}

				.quick-action-btn {
					flex: none !important;
					padding: 0.75rem 1.25rem !important;
					font-size: 0.875rem !important;
				}
			}
		`;

		document.head.appendChild(style);
		console.log('✅ CRITICAL FIX: Mobile/Tablet notifications positioning applied - notifications panel will now display properly');
	}

	/**
	 * ✅ CRITICAL FIX: Setup ResizeObserver with improved handling
	 */
	setupResponsiveResizeHandler() {
		if (typeof ResizeObserver !== 'undefined') {
			this.resizeObserver = new ResizeObserver(this.debounce((entries) => {
				this.handleResponsiveResizeFixed();
			}, 100)); // ✅ FASTER: More responsive ResizeObserver

			// Observe the main container
			const container = document.querySelector('.dashboard-content') || document.body;
			this.resizeObserver.observe(container);
		}
	}

	/**
	 * ✅ CRITICAL FIX: Enhanced responsive resize handling with proper state tracking
	 */
	handleResponsiveResizeFixed() {
		const currentWidth = window.innerWidth;
		const isExpanding = currentWidth > this.lastWindowWidth;
		const isContracting = currentWidth < this.lastWindowWidth;

		console.log(`🔄 Window resize: ${this.lastWindowWidth} → ${currentWidth} (${isExpanding ? 'expanding' : isContracting ? 'contracting' : 'same'})`);

		const deviceChanged = this.updateResponsiveSettings();

		// ✅ CRITICAL FIX: Force layout recalculation for contracting windows
		if (isContracting || deviceChanged) {
			// Force immediate DOM update
			this.forceLayoutRecalculation();
		}

		if (deviceChanged && this.carousel.isInitialized) {
			console.log(`🔄 Device changed from previous to ${this.currentDevice} - rebuilding carousel...`);
			this.rebuildCarouselForNewDevice();
		} else if (this.carousel.isInitialized) {
			// ✅ ENHANCED: Always update layout for size changes
			this.applyFixedCarouselLayout();
			this.updateFixedCarouselControls();
			this.enforceFixedCardSizes();

			// ✅ CRITICAL FIX: Additional layout update for contracting
			if (isContracting) {
				setTimeout(() => {
					this.applyFixedCarouselLayout();
					this.enforceFixedCardSizes();
				}, 50); // Small delay to ensure DOM updates
			}
		}

		// Update last window width
		this.lastWindowWidth = currentWidth;
	}

	/**
	 * ✅ CRITICAL FIX: Force layout recalculation to handle contracting windows
	 */
	forceLayoutRecalculation() {
		const container = document.getElementById('budgets-grid');
		if (container) {
			// Force reflow by reading layout properties
			container.offsetHeight;
			container.offsetWidth;

			// Force parent containers to recalculate
			const wrapper = container.closest('.perfect-carousel-wrapper');
			if (wrapper) {
				wrapper.offsetHeight;
				wrapper.offsetWidth;
			}

			const budgetsContainer = container.closest('.budgets-container');
			if (budgetsContainer) {
				budgetsContainer.offsetHeight;
				budgetsContainer.offsetWidth;
			}
		}
	}

	/**
	 * ✅ LEGACY: Keep old resize method for backwards compatibility
	 */
	handleResponsiveResize() {
		return this.handleResponsiveResizeFixed();
	}

	/**
	 * ✅ NEW: Detect device type and update carousel settings accordingly
	 */
	updateResponsiveSettings() {
		const windowWidth = window.innerWidth;
		let newDevice = 'desktop';
		let newSettings = this.carousel.responsive.desktop;

		// ✅ SMART DEVICE DETECTION: Check from smallest to largest
		if (windowWidth <= this.carousel.responsive.mobile.maxWidth) {
			newDevice = 'mobile';
			newSettings = this.carousel.responsive.mobile;
		} else if (windowWidth <= this.carousel.responsive.tablet.maxWidth) {
			newDevice = 'tablet';
			newSettings = this.carousel.responsive.tablet;
		} else if (windowWidth <= this.carousel.responsive.desktop.maxWidth) {
			newDevice = 'desktop';
			newSettings = this.carousel.responsive.desktop;
		} else if (windowWidth <= this.carousel.responsive.large.maxWidth) {
			newDevice = 'large';
			newSettings = this.carousel.responsive.large;
		} else {
			newDevice = 'ultraWide';
			newSettings = this.carousel.responsive.ultraWide;
		}

		const deviceChanged = this.currentDevice !== newDevice;
		this.currentDevice = newDevice;

		// ✅ UPDATE: Carousel settings based on device
		this.carousel.cardsPerView = newSettings.cardsPerView;
		this.carousel.cardWidth = newSettings.cardWidth;
		this.carousel.cardGap = newSettings.cardGap;

		// ✅ CALCULATE: Container dimensions
		this.initializeCarouselDimensions();

		if (deviceChanged) {
			console.log(`📱 Device changed to ${newDevice}:`, {
				windowWidth,
				cardsPerView: this.carousel.cardsPerView,
				cardWidth: this.carousel.cardWidth,
				maxContainerWidth: this.carousel.maxContainerWidth
			});
		}

		return deviceChanged;
	}

	/**
	 * ✅ NEW: Rebuild carousel when device type changes
	 */
	rebuildCarouselForNewDevice() {
		// ✅ PRESERVE: Current data and state
		const currentData = this.filteredBudgets;
		const wasVisible = this.carousel.isInitialized;

		if (wasVisible) {
			// ✅ CLEAN REBUILD: Remove old carousel and create new one
			this.cleanupExistingCarousel();
			this.setupFixedCarousel();

			// ✅ RESTORE: Data and render with new settings
			this.filteredBudgets = currentData;
			this.renderBudgetsWithFixedCarousel();

			console.log(`✅ Carousel rebuilt for ${this.currentDevice} device`);
		}
	}

	/**
	 * ✅ UPDATED: Initialize carousel dimensions with responsive support
	 */
	initializeCarouselDimensions() {
		// ✅ RESPONSIVE: Calculate container width based on current device settings
		this.carousel.containerWidth = (this.carousel.cardWidth * 10) + (this.carousel.cardGap * 9); // Support up to 10 cards
		this.carousel.maxContainerWidth = (this.carousel.cardWidth * this.carousel.cardsPerView) +
										 (this.carousel.cardGap * (this.carousel.cardsPerView - 1));

		console.log(`📐 Responsive carousel dimensions for ${this.currentDevice}:`, {
			cardsPerView: this.carousel.cardsPerView,
			cardWidth: this.carousel.cardWidth,
			cardGap: this.carousel.cardGap,
			maxContainerWidth: this.carousel.maxContainerWidth,
			totalContainerWidth: this.carousel.containerWidth
		});
	}

	/**
	 * ✅ NEW: Utility function for debouncing resize events
	 */
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

	/**
	 * ✅ ENHANCED: Smart category name truncation based on case patterns (supports Cyrillic + Latin)
	 * - If category has mixed case (upper + lower) and has >5 uppercase letters: truncate to 15 chars
	 * - If category is all uppercase: truncate to 15 chars
	 * - Otherwise: use default maxLength (20 chars)
	 * - Supports both Bulgarian/Cyrillic and English/Latin characters
	 */
	truncateCategoryName(categoryName, maxLength = 20) {
		if (!categoryName) return 'Unknown Category';

		// ✅ ENHANCED: Analyze case patterns for both Cyrillic and Latin characters
		// Cyrillic uppercase: А-Я, Latin uppercase: A-Z
		const uppercaseLetters = (categoryName.match(/[А-ЯA-Z]/g) || []).length;
		// Cyrillic lowercase: а-я, Latin lowercase: a-z
		const lowercaseLetters = (categoryName.match(/[а-яa-z]/g) || []).length;
		const totalLetters = uppercaseLetters + lowercaseLetters;

		// Check if category is all uppercase (Bulgarian + English)
		const isAllUppercase = totalLetters > 0 && uppercaseLetters === totalLetters;

		// Check if category has mixed case with >5 uppercase letters (Bulgarian + English)
		const isMixedCaseWithManyUpper = uppercaseLetters > 5 && lowercaseLetters > 0;

		// ✅ SMART TRUNCATION: Apply 15-character limit for specific cases
		let effectiveMaxLength = maxLength;
		if (isAllUppercase || isMixedCaseWithManyUpper) {
			effectiveMaxLength = 15;
			console.log(`📝 Smart truncation applied to "${categoryName}": ${isAllUppercase ? 'ALL_UPPERCASE' : 'MIXED_CASE_MANY_UPPER'} -> ${effectiveMaxLength} chars (Cyrillic+Latin support)`);
		}

		// Apply truncation if needed
		if (categoryName.length <= effectiveMaxLength) {
			return categoryName;
		}

		return categoryName.substring(0, effectiveMaxLength) + '..';
	}

	/**
	 * ✅ UPDATED: Analytics-specific category truncation for Top Spending Categories
	 * NEW LOGIC: If category has mixed case with >2 uppercase letters, truncate to 7 chars
	 * Otherwise, use the existing analytics truncation logic
	 */
	truncateTopSpendingCategory(categoryName) {
		if (!categoryName) return 'Unknown Category';

		// ✅ UPDATED: Check case patterns for both Cyrillic and Latin characters
		const uppercaseLetters = (categoryName.match(/[А-ЯA-Z]/g) || []).length;
		const lowercaseLetters = (categoryName.match(/[а-яa-z]/g) || []).length;
		const totalLetters = uppercaseLetters + lowercaseLetters;

		const isAllUppercase = totalLetters > 0 && uppercaseLetters === totalLetters;
		const isMixedCaseWithManyUpper = uppercaseLetters > 2 && lowercaseLetters > 0; // ✅ UPDATED: >2 instead of >3

		// ✅ UPDATED LOGIC: Apply 7-character limit for Top Spending Categories
		let effectiveMaxLength = 12; // ✅ UPDATED: Default 12 chars for analytics (instead of 15)

		if (isAllUppercase && categoryName.length > 7) {
			effectiveMaxLength = 7;
			console.log(`📊 Top Spending truncation applied to "${categoryName}": ALL_UPPERCASE >7 chars -> 7 chars`);
		} else if (isMixedCaseWithManyUpper) {
			effectiveMaxLength = 7; // ✅ UPDATED: Mixed case with >2 uppercase = 7 chars
			console.log(`📊 Top Spending truncation applied to "${categoryName}": MIXED_CASE_>2_UPPER -> 7 chars`);
		}

		// Apply truncation if needed
		if (categoryName.length <= effectiveMaxLength) {
			return categoryName;
		}

		return categoryName.substring(0, effectiveMaxLength) + '..';
	}

	/**
	 * ✅ UPDATED: Analytics truncation method for other parts - now uses 12 chars instead of 15
	 */
	truncateAnalyticsCategory(categoryName) {
		if (!categoryName) return 'Unknown Category';

		// ✅ Check if category is all uppercase (Bulgarian + English)
		const uppercaseLetters = (categoryName.match(/[А-ЯA-Z]/g) || []).length;
		const lowercaseLetters = (categoryName.match(/[а-яa-z]/g) || []).length;
		const totalLetters = uppercaseLetters + lowercaseLetters;

		const isAllUppercase = totalLetters > 0 && uppercaseLetters === totalLetters;

		// ✅ If all uppercase and exceeds 7 characters, truncate to 7
		if (isAllUppercase && categoryName.length > 7) {
			console.log(`📊 Analytics truncation applied to "${categoryName}": ALL_UPPERCASE >7 chars -> 7 chars`);
			return categoryName.substring(0, 7) + '..';
		}

		// ✅ UPDATED: Use 12 chars for analytics (instead of 15)
		return this.truncateCategoryName(categoryName, 12);
	}

	/**
	 * ✅ NEW: Smart time update system for notifications
	 * - Every 15 minutes for notifications < 1 hour old
	 * - Every hour for notifications 1 hour - 1 day old
	 * - Hide notifications > 1 day old
	 */
	startSmartTimeUpdates() {
		// Clear existing interval
		if (this.timeUpdateInterval) {
			clearInterval(this.timeUpdateInterval);
		}

		// Update every 15 minutes (smart logic inside)
		this.timeUpdateInterval = setInterval(() => {
			this.updateNotificationTimes();
		}, 15 * 60 * 1000); // 15 minutes

		console.log('🕒 Smart time update system started');
	}

	/**
	 * ✅ COMPLETELY FIXED: Update notification times and filter old ones with proper array handling and localStorage sync
	 */
	updateNotificationTimes() {
		const now = new Date();
		const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

		// ✅ FIXED: Filter API notifications
		const oldApiCount = this.notifications.length;
		this.notifications = this.notifications.filter(notification => {
			const notificationDate = new Date(notification.createdAt);
			return notificationDate > oneDayAgo;
		});

		// ✅ FIXED: Filter local notifications
		const oldLocalCount = this.localNotifications.length;
		this.localNotifications = this.localNotifications.filter(notification => {
			const notificationDate = new Date(notification.createdAt);
			return notificationDate > oneDayAgo;
		});

		// ✅ NEW: Save filtered local notifications to localStorage
		if (oldLocalCount !== this.localNotifications.length) {
			this.saveLocalNotificationsToStorage();
		}

		const newApiCount = this.notifications.length;
		const newLocalCount = this.localNotifications.length;
		const totalRemoved = (oldApiCount - newApiCount) + (oldLocalCount - newLocalCount);

		if (totalRemoved > 0) {
			console.log(`🗑️ Removed ${totalRemoved} old notifications (>1 day): ${oldApiCount - newApiCount} API + ${oldLocalCount - newLocalCount} local`);
		}

		// Update badge and re-render if panel is open
		this.updateNotificationBadge();

		const panel = document.getElementById('notifications-panel');
		if (panel && panel.classList.contains('active')) {
			this.renderNotifications();
		}
	}

	/**
	 * ✅ COMPLETELY FIXED: Clean up any existing carousel elements completely
	 */
	cleanupExistingCarousel() {
		document.querySelectorAll('.perfect-carousel-wrapper').forEach(wrapper => {
			const gridContainer = wrapper.querySelector('#budgets-grid');
			if (gridContainer && wrapper.parentNode) {
				wrapper.parentNode.insertBefore(gridContainer, wrapper);
				wrapper.remove();
			}
		});

		document.querySelectorAll('.carousel-arrow').forEach(arrow => arrow.remove());
		this.carousel.isInitialized = false;

		console.log('🧹 Cleaned up existing carousel elements');
	}

	setupCrossTabSync() {
		window.addEventListener('focus', () => {
			const lastRefresh = localStorage.getItem('budgetsLastRefresh');
			const now = Date.now();

			if (!lastRefresh || (now - parseInt(lastRefresh)) > 30000) {
				console.log('🔄 Auto-refreshing budget DATA only after window focus');
				this.refreshDataOnly();
				localStorage.setItem('budgetsLastRefresh', now.toString());
			}
		});

		window.addEventListener('storage', (e) => {
			if (e.key === 'transactionUpdated' && e.newValue) {
				console.log('🔄 Refreshing budgets after transaction update from other tab');
				this.refreshDataOnly();
				localStorage.removeItem('transactionUpdated');
				this.showSyncNotification('Budgets updated from transaction changes');
			}
		});

		window.addEventListener('beforeunload', () => {
			localStorage.setItem('budgetUpdated', Date.now().toString());
		});

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

		// ✅ FIXED: Carousel controls with responsive support
		this.addEventListeners([
			['carousel-prev', 'click', () => this.carouselPrevFixed()],
			['carousel-next', 'click', () => this.carouselNextFixed()]
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
						this.carouselPrevFixed();
						break;
					case 'ArrowRight':
						e.preventDefault();
						this.carouselNextFixed();
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

	/**
	 * ✅ ENHANCED: Translate and apply smart truncation to category names
	 */
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
			'Общ бюджет': 'General Budget'
		};

		const translated = translations[bulgName] || bulgName;
		// ✅ ENHANCED: Apply smart truncation to translated category name
		return this.truncateCategoryName(translated);
	}

	/**
	 * ✅ COMPLETELY FIXED: Category dropdown with perfect deselect functionality
	 */
	populateCategorySelects() {
		const selects = ['budget-category', 'filter-category'];

		selects.forEach(selectId => {
			const select = document.getElementById(selectId);
			if (!select) return;

			// Clear existing options and reset all attributes
			select.innerHTML = '';
			select.removeAttribute('size');
			select.classList.remove('enhanced-dropdown-scroller');

			// Add default option
			const defaultOption = document.createElement('option');
			if (selectId === 'budget-category') {
				defaultOption.value = '';
				defaultOption.textContent = 'Select a category...';
			} else {
				defaultOption.value = '';
				defaultOption.textContent = 'All Categories';
			}
			select.appendChild(defaultOption);

			// Add category options with smart truncated names
			this.categories.forEach(category => {
				const option = document.createElement('option');
				option.value = category.id;
				// ✅ ENHANCED: Use smart truncated category name for display
				option.textContent = this.translateCategoryName(category.name);
				option.style.color = category.color || '#6366f1';
				// ✅ NEW: Add title attribute to show full name on hover
				option.title = this.translateCategoryName(category.name, 100); // Full name in tooltip
				select.appendChild(option);
			});

			// ✅ PERFECT LOGIC: Apply scroller if more than 5 total options
			const totalOptions = select.options.length;

			if (totalOptions > 5) {
				console.log(`📏 Activating scroller for ${selectId}: ${totalOptions} options (${totalOptions - 1} categories + default)`);
				this.activateEnhancedDropdownScroller(select);
			} else {
				console.log(`📏 Standard dropdown for ${selectId}: ${totalOptions} options (no scroller needed)`);
				this.removeDropdownScrollBehavior(select);
			}

			// ✅ FIXED: Add proper deselect functionality
			this.addCleanDeselectFunctionality(select);
		});
	}

	/**
	 * ✅ COMPLETELY NEW APPROACH: Clean deselect functionality without visual conflicts
	 */
	addCleanDeselectFunctionality(selectElement) {
		if (!selectElement) return;

		console.log('🎯 Adding NEW clean deselect functionality...');

		// Remove any existing event listeners to prevent duplicates
		const newSelect = selectElement.cloneNode(true);
		selectElement.parentNode.replaceChild(newSelect, selectElement);
		selectElement = newSelect;

		let previousSelectedValue = '';
		let clickStartValue = '';

		// ✅ NEW APPROACH: Track selection state without touching styles
		selectElement.addEventListener('focus', (e) => {
			previousSelectedValue = selectElement.value;
			console.log('🎯 Focus - Previous value recorded:', previousSelectedValue);
		});

		selectElement.addEventListener('mousedown', (e) => {
			clickStartValue = selectElement.value;
			console.log('🖱️ Mouse down - Click start value:', clickStartValue);
		});

		// ✅ MAIN DESELECT LOGIC: Simple and clean
		selectElement.addEventListener('change', (e) => {
			const currentValue = selectElement.value;

			// If user selected the same value that was already selected, deselect it
			if (clickStartValue !== '' && currentValue === clickStartValue && currentValue === previousSelectedValue) {
				console.log('🔄 Same option clicked twice, deselecting:', currentValue);

				// Reset to empty value
				selectElement.value = '';

				// Trigger another change event for any dependent logic
				setTimeout(() => {
					const resetEvent = new Event('change', { bubbles: true });
					selectElement.dispatchEvent(resetEvent);
				}, 10);
			}

			// Update tracking values
			previousSelectedValue = selectElement.value;
			console.log('✅ Selection changed to:', selectElement.value);
		});

		// ✅ SEPARATE STYLING: Handle visual feedback independently
		selectElement.addEventListener('change', (e) => {
			this.handleCategorySelectionStyling(selectElement);
		});

		console.log('✅ NEW deselect functionality added - clean and simple');
	}

	/**
	 * ✅ NEW METHOD: Handle category selection styling separately
	 */
	handleCategorySelectionStyling(selectElement) {
		const value = selectElement.value;

		if (value === '') {
			// ✅ CLEAN RESET: No styles at all when nothing selected
			selectElement.className = selectElement.className.replace(/\s*category-selected\s*/g, '');
			console.log('✅ Category deselected - clean styling reset');
		} else {
			// ✅ VISUAL FEEDBACK: Add class instead of inline styles
			if (!selectElement.classList.contains('category-selected')) {
				selectElement.classList.add('category-selected');
			}

			// Set CSS custom property for the color
			const selectedCategory = this.categories.find(cat => cat.id == value);
			if (selectedCategory && selectedCategory.color) {
				selectElement.style.setProperty('--selected-category-color', selectedCategory.color);
				console.log('🎨 Category selected, set CSS variable:', selectedCategory.color);
			}
		}
	}

	/**
	 * ✅ ENHANCED: Activate enhanced dropdown scroller with proper size attribute
	 */
	activateEnhancedDropdownScroller(selectElement) {
		if (!selectElement) return;

		console.log('🎨 Setting up enhanced dropdown scroller...');

		// ✅ CRITICAL FIX: Set size attribute to exactly 5 for visible options
		selectElement.setAttribute('size', '5');
		selectElement.classList.add('enhanced-dropdown-scroller');

		// ✅ FIXED: Ensure dropdown stays open and shows exactly 5 options
		selectElement.style.height = 'auto';
		selectElement.style.overflow = 'auto';

		console.log('✅ Enhanced dropdown scroller activated with size=5');
	}

	/**
	 * ✅ ENHANCED: Remove scroll behavior for standard dropdowns
	 */
	removeDropdownScrollBehavior(selectElement) {
		if (!selectElement) return;

		console.log('🎨 Removing dropdown scroller behavior...');

		// ✅ CRITICAL FIX: Remove size attribute for standard dropdowns
		selectElement.removeAttribute('size');
		selectElement.classList.remove('enhanced-dropdown-scroller');
		selectElement.style.height = '';
		selectElement.style.overflow = '';

		console.log('✅ Standard dropdown layout restored');
	}

	async loadBudgetsForCurrentPeriod() {
		try {
			console.log(`📥 Loading budgets for ${this.currentPeriod.year}-${this.currentPeriod.month}...`);

			const budgets = await this.fetchAPI(`/budgets/period/${this.currentPeriod.year}/${this.currentPeriod.month}`);
			this.budgets = budgets;

			this.calculateSummaryDataFixed();
			this.applyFiltersAndRenderFixed();

			console.log('✅ Budgets loaded:', budgets.length);

		} catch (error) {
			console.error('❌ Failed to load budgets:', error);
			this.budgets = [];
			this.showToast('Failed to load budgets. Please check your connection and try again.', 'error');
		}
	}

	/**
	 * ✅ COMPLETELY FIXED: Summary calculation with proper Total Spent logic
	 * Total Spent should be calculated ONLY from Category Budgets (excluding General Budget)
	 */
	calculateSummaryDataFixed() {
		const generalBudgets = this.budgets.filter(b => b.isGeneralBudget);
		const categoryBudgets = this.budgets.filter(b => b.isCategoryBudget);

		// ✅ FIXED LOGIC: Calculate total spent ONLY from Category Budgets (excluding General Budget)
		const totalSpentFromCategoryBudgets = categoryBudgets.reduce((sum, budget) =>
			sum + parseFloat(budget.spentAmount || 0), 0);

		// ✅ FIXED LOGIC: If General Budget exists, use ONLY that for total budget, but category spent for total spent
		if (generalBudgets.length > 0) {
			const generalBudget = generalBudgets[0];
			this.summaryData = {
				totalBudget: parseFloat(generalBudget.plannedAmount || 0),
				totalSpent: totalSpentFromCategoryBudgets, // ✅ FIXED: Only category budgets spent
				activeBudgets: this.budgets.length,
				budgetHealth: 0
			};
		} else {
			// No general budget - sum category budgets for both planned and spent
			this.summaryData = {
				totalBudget: categoryBudgets.reduce((sum, budget) => sum + parseFloat(budget.plannedAmount || 0), 0),
				totalSpent: totalSpentFromCategoryBudgets, // ✅ FIXED: Only category budgets spent
				activeBudgets: categoryBudgets.length,
				budgetHealth: 0
			};
		}

		// Calculate budget health based on total budget vs category spent
		if (this.summaryData.totalBudget > 0) {
			this.summaryData.budgetHealth = Math.round((this.summaryData.totalSpent / this.summaryData.totalBudget) * 100);
		}

		this.updateSummaryCards();

		console.log('✅ Summary data calculated with FIXED logic:', {
			totalBudget: this.summaryData.totalBudget,
			totalSpent: this.summaryData.totalSpent,
			categoryBudgetsCount: categoryBudgets.length,
			generalBudgetsCount: generalBudgets.length,
			budgetHealth: this.summaryData.budgetHealth
		});
	}

	updateSummaryCards() {
		this.updateElement('total-budget', `${this.summaryData.totalBudget.toFixed(0)}`);
		this.updateElement('total-spent', `${this.summaryData.totalSpent.toFixed(0)}`);
		this.updateElement('active-budgets', `${this.summaryData.activeBudgets}`);

		const healthElement = document.getElementById('budget-health');
		if (healthElement) {
			const percentage = this.summaryData.budgetHealth;

			// ✅ SMART LIMIT: Cap percentage display at 8 digits maximum
			let displayPercentage;
			if (percentage >= 99999999) { // 8 digits: 99,999,999%
				displayPercentage = '99999999'; // Max 8 digits
			} else {
				displayPercentage = percentage.toString();
			}

			// ✅ SMART RESPONSIVE: Adjust layout based on percentage length
			let layout;
			if (displayPercentage.length >= 7) {
				// Very large numbers (7-8 digits): Stack vertically, smaller text, with % symbol
				layout = `
					<div class="health-display vertical">
						<span class="value-percentage large-number">${displayPercentage}%</span>
						<span class="value-symbol compact">used</span>
					</div>
				`;
			} else if (displayPercentage.length >= 4) {
				// Large numbers (4-6 digits): Compact horizontal with smaller symbol
				layout = `
					<div class="health-display compact">
						<span class="value-percentage">${displayPercentage}%</span>
						<span class="value-symbol small">used</span>
					</div>
				`;
			} else {
				// Normal numbers (1-3 digits): Standard layout
				layout = `
					<div class="health-display standard">
						<span class="value-percentage">${displayPercentage}%</span>
						<span class="value-symbol">used</span>
					</div>
				`;
			}

			healthElement.innerHTML = layout;
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

		console.log('✅ Summary cards updated with SMART responsive budget health layout');
	}

	/**
	 * ✅ RESPONSIVE FIXED: Apply filters with responsive carousel adaptation
	 */
	applyFiltersAndRenderFixed() {
		console.log('🔍 Applying filters with RESPONSIVE carousel sizing:', this.currentFilter);

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

		this.filteredBudgets = filtered;

		// ✅ RESPONSIVE: Smart minimum cards based on device type
		const minCards = this.carousel.cardsPerView;

		if (this.filteredBudgets.length === minCards - 1) {
			this.filteredBudgets.push(this.createDummyCard('Add another budget'));
		} else if (this.filteredBudgets.length === 0) {
			// Add appropriate number of dummy cards based on device
			const dummyCards = [];
			for (let i = 0; i < minCards; i++) {
				if (i === 0) {
					dummyCards.push(this.createDummyCard('No budgets match your filters'));
				} else {
					dummyCards.push(this.createDummyCard('Try adjusting your filters'));
				}
			}
			this.filteredBudgets = dummyCards;
		}

		this.renderBudgetsWithFixedCarousel();

		console.log(`✅ Filters applied with RESPONSIVE sizing (${this.currentDevice}). Original: ${filtered.length}, Display: ${this.filteredBudgets.length}, Min cards: ${minCards}`);
	}

	/**
	 * ✅ LEGACY: Keep old method name for compatibility
	 */
	applyFiltersAndRender() {
		return this.applyFiltersAndRenderFixed();
	}

	/**
	 * ✅ FIXED: Create dummy card for carousel stability
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
	 * ✅ RESPONSIVE FIXED: Render budgets with responsive carousel system
	 */
	renderBudgetsWithFixedCarousel() {
		const container = document.getElementById('budgets-grid');
		const loadingState = document.getElementById('loading-state');
		const emptyState = document.getElementById('empty-state');

		if (!container) return;

		if (loadingState) loadingState.style.display = 'none';
		if (emptyState) emptyState.style.display = 'none';

		const existingWrapper = document.querySelector('.perfect-carousel-wrapper');
		const existingArrows = document.querySelectorAll('.carousel-arrow');

		if (!existingWrapper || existingArrows.length !== 2 || !this.carousel.isInitialized) {
			console.log('🔧 Setting up RESPONSIVE carousel (first time or corrupted)');
			this.setupFixedCarousel();
		} else {
			console.log('✅ RESPONSIVE carousel already exists, keeping it intact');
		}

		// ✅ RESPONSIVE: Update carousel state with current device settings
		this.carousel.totalCards = this.filteredBudgets.length;
		this.carousel.currentIndex = Math.min(this.carousel.currentIndex,
			Math.max(0, this.carousel.totalCards - this.carousel.cardsPerView));

		// ✅ RESPONSIVE: Render cards with device-appropriate sizes
		container.innerHTML = this.filteredBudgets.map(budget =>
			this.createBudgetCardHTML(budget)
		).join('');

		// ✅ RESPONSIVE: Apply layout with current device settings
		this.applyFixedCarouselLayout();
		this.updateFixedCarouselControls();
		this.enforceFixedCardSizes();

		// Add event listeners for budget cards
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

		console.log(`✅ RESPONSIVE carousel rendered for ${this.currentDevice} device`);
	}

	/**
	 * ✅ LEGACY: Keep old method name for compatibility
	 */
	renderBudgetsWithPerfectCarousel() {
		return this.renderBudgetsWithFixedCarousel();
	}

	/**
	 * ✅ RESPONSIVE UPDATE: Setup carousel with device-appropriate dimensions
	 */
	setupFixedCarousel() {
		const container = document.getElementById('budgets-grid');
		const budgetsContainer = container.parentElement;

		// ✅ RESPONSIVE: Clean up any existing carousel elements
		const existingWrappers = document.querySelectorAll('.perfect-carousel-wrapper');
		existingWrappers.forEach(wrapper => {
			const gridContainer = wrapper.querySelector('#budgets-grid');
			if (gridContainer && wrapper.parentNode) {
				wrapper.parentNode.insertBefore(gridContainer, wrapper);
				wrapper.remove();
			}
		});

		document.querySelectorAll('.carousel-arrow').forEach(arrow => arrow.remove());

		// ✅ RESPONSIVE: Create carousel wrapper with device-appropriate dimensions
		const carouselWrapper = document.createElement('div');
		carouselWrapper.className = 'perfect-carousel-wrapper';
		carouselWrapper.style.width = '100%';
		carouselWrapper.style.maxWidth = '100%';
		carouselWrapper.style.minWidth = '100%'; // ✅ ADDED: Ensure full width

		// ✅ SMART LAYOUT: Different layout based on device
		const isMobile = this.currentDevice === 'mobile';
		const isDesktopOrLarger = this.currentDevice === 'desktop' || this.currentDevice === 'large' || this.currentDevice === 'ultraWide';
		const isTablet = this.currentDevice === 'tablet';

		if (isDesktopOrLarger || isTablet) {
			// ✅ DESKTOP & TABLET: Horizontal layout with arrows on sides
			carouselWrapper.style.display = 'flex';
			carouselWrapper.style.flexDirection = 'row';
			carouselWrapper.style.alignItems = 'center';
			carouselWrapper.style.justifyContent = isTablet ? 'center' : 'center'; // ✅ FIXED: Center for both
			carouselWrapper.style.gap = '1rem'; // ✅ REDUCED: From 1.5rem to 1rem

			// ✅ DESKTOP FIX: Reduced padding to fit arrows better
			if (isDesktopOrLarger) {
				carouselWrapper.style.padding = '0 0.5rem'; // ✅ REDUCED: From 1rem to 0.5rem
				carouselWrapper.style.boxSizing = 'border-box';
				carouselWrapper.style.maxWidth = '100%';
				carouselWrapper.style.width = '100%';
			}

			carouselWrapper.innerHTML = `
				<button class="carousel-arrow carousel-prev" id="carousel-prev" title="Previous Cards" style="flex-shrink: 0; width: 48px; height: 48px;">
					<i data-lucide="chevron-left"></i>
				</button>
				<div class="carousel-viewport" style="width: ${this.carousel.maxContainerWidth}px; max-width: ${this.carousel.maxContainerWidth}px; min-width: ${this.carousel.maxContainerWidth}px; overflow: hidden; flex-shrink: 0;">
					<div class="carousel-track" style="width: 100%; position: relative;">
						<!-- Cards container will be moved here -->
					</div>
				</div>
				<button class="carousel-arrow carousel-next" id="carousel-next" title="Next Cards" style="flex-shrink: 0; width: 48px; height: 48px;">
					<i data-lucide="chevron-right"></i>
				</button>
			`;
		} else {
			// ✅ MOBILE ONLY: Vertical layout with arrows below
			carouselWrapper.style.display = 'flex';
			carouselWrapper.style.flexDirection = 'column';
			carouselWrapper.style.alignItems = 'center';
			carouselWrapper.style.gap = '1rem';
			carouselWrapper.style.position = 'relative'; // ✅ FIXED: Ensure proper stacking context
			carouselWrapper.innerHTML = `
				<div class="carousel-viewport" style="width: ${this.carousel.maxContainerWidth}px; max-width: ${this.carousel.maxContainerWidth}px; overflow: hidden; position: relative; z-index: 1;">
					<div class="carousel-track" style="width: 100%; position: relative; z-index: 2;">
						<!-- Cards container will be moved here -->
					</div>
				</div>
				<div class="carousel-controls" style="display: flex; gap: 1rem; align-items: center; position: relative; z-index: 0; order: 2; margin-top: 0.5rem;">
					<button class="carousel-arrow carousel-prev" id="carousel-prev" title="Previous Cards" style="position: relative; z-index: 0;">
						<i data-lucide="chevron-left"></i>
					</button>
					<button class="carousel-arrow carousel-next" id="carousel-next" title="Next Cards" style="position: relative; z-index: 0;">
						<i data-lucide="chevron-right"></i>
					</button>
				</div>
			`;
		}

		budgetsContainer.insertBefore(carouselWrapper, container);
		const carouselTrack = carouselWrapper.querySelector('.carousel-track');
		carouselTrack.appendChild(container);

		// ✅ RESPONSIVE: Set device-appropriate dimensions on the container
		container.style.width = `${this.carousel.containerWidth}px`;
		container.style.minWidth = `${this.carousel.containerWidth}px`;
		container.style.maxWidth = `${this.carousel.containerWidth}px`;
		container.style.display = 'flex';
		container.style.gap = `${this.carousel.cardGap}px`;
		container.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

		// ✅ RESPONSIVE: Add event listeners with clean removal first
		const prevBtn = document.getElementById('carousel-prev');
		const nextBtn = document.getElementById('carousel-next');

		if (prevBtn && nextBtn) {
			const newPrevBtn = prevBtn.cloneNode(true);
			const newNextBtn = nextBtn.cloneNode(true);

			prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
			nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

			newPrevBtn.addEventListener('click', () => this.carouselPrevFixed());
			newNextBtn.addEventListener('click', () => this.carouselNextFixed());
		}

		this.carousel.isInitialized = true;

		console.log(`✅ RESPONSIVE carousel setup completed for ${this.currentDevice}:`, {
			cardsPerView: this.carousel.cardsPerView,
			containerWidth: this.carousel.containerWidth,
			viewportWidth: this.carousel.maxContainerWidth,
			cardWidth: this.carousel.cardWidth,
			cardGap: this.carousel.cardGap
		});

		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}
	}

	/**
	 * ✅ LEGACY: Keep old method name for compatibility
	 */
	setupPerfectCarousel() {
		return this.setupFixedCarousel();
	}

	/**
	 * ✅ CRITICAL FIX: Apply carousel layout with improved container constraints and responsive handling
	 */
	applyFixedCarouselLayout() {
		const container = document.getElementById('budgets-grid');
		if (!container) return;

		// ✅ RESPONSIVE: Set device-appropriate constant dimensions
		container.style.display = 'flex';
		container.style.width = `${this.carousel.containerWidth}px`;
		container.style.minWidth = `${this.carousel.containerWidth}px`;
		container.style.maxWidth = `${this.carousel.containerWidth}px`;
		container.style.gap = `${this.carousel.cardGap}px`;
		container.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

		// ✅ CRITICAL FIX: Ensure parent containers accommodate content properly for all resize scenarios
		const parentContainer = container.closest('.budgets-container') || container.parentElement;
		if (parentContainer) {
			// ✅ RESPONSIVE: Handle container sizing based on device type
			if (this.currentDevice === 'desktop' || this.currentDevice === 'large' || this.currentDevice === 'ultraWide') {
				// Desktop needs space for arrows
				const totalNeededWidth = this.carousel.maxContainerWidth + 160; // Cards + arrows + margins
				parentContainer.style.minWidth = `${totalNeededWidth}px`;
				parentContainer.style.maxWidth = 'none';
			} else {
				// Mobile and tablet - just accommodate the viewport
				parentContainer.style.minWidth = `${this.carousel.maxContainerWidth + 40}px`; // Viewport + small margins
				parentContainer.style.maxWidth = '100%';
			}

			parentContainer.style.width = '100%';
			parentContainer.style.overflow = 'visible';

			// ✅ CRITICAL FIX: Force parent to respect its minimum width
			parentContainer.style.boxSizing = 'border-box';
		}

		// ✅ CRITICAL FIX: Ensure dashboard content can accommodate the carousel for all screen changes
		const dashboardContent = document.querySelector('.dashboard-content');
		if (dashboardContent) {
			const neededWidth = (this.currentDevice === 'desktop' || this.currentDevice === 'large' || this.currentDevice === 'ultraWide')
				? this.carousel.maxContainerWidth + 200  // Desktop with arrows
				: this.carousel.maxContainerWidth + 80;  // Mobile/tablet

			dashboardContent.style.minWidth = `${neededWidth}px`;
			dashboardContent.style.overflow = 'visible';
			dashboardContent.style.maxWidth = 'none'; // ✅ CRITICAL: Remove max-width constraints
		}

		// ✅ RESPONSIVE: Calculate transform with device-appropriate settings
		const offset = this.carousel.currentIndex * (this.carousel.cardWidth + this.carousel.cardGap);
		container.style.transform = `translateX(-${offset}px)`;

		// ✅ CRITICAL FIX: Force layout recalculation to handle window contracting
		container.offsetHeight; // Force reflow

		console.log(`✅ RESPONSIVE carousel layout applied for ${this.currentDevice}:`, {
			containerWidth: container.style.width,
			transform: container.style.transform,
			currentIndex: this.carousel.currentIndex,
			cardsPerView: this.carousel.cardsPerView,
			maxContainerWidth: this.carousel.maxContainerWidth,
			dashboardMinWidth: dashboardContent ? dashboardContent.style.minWidth : 'N/A'
		});
	}

	/**
	 * ✅ LEGACY: Keep old method name for compatibility
	 */
	applyPerfectCarouselLayout() {
		return this.applyFixedCarouselLayout();
	}

	/**
	 * ✅ RESPONSIVE UPDATE: Enforce device-appropriate card sizes
	 */
	enforceFixedCardSizes() {
		const cards = document.querySelectorAll('.budget-card');

		cards.forEach((card, index) => {
			// ✅ RESPONSIVE: Force device-appropriate dimensions on every card
			card.style.width = `${this.carousel.cardWidth}px`;
			card.style.minWidth = `${this.carousel.cardWidth}px`;
			card.style.maxWidth = `${this.carousel.cardWidth}px`;
			card.style.flexShrink = '0';
			card.style.flexGrow = '0';
			card.style.boxSizing = 'border-box';

			// ✅ FIXED: Ensure consistent height for all cards
			card.style.minHeight = '420px';
			card.style.height = 'auto';

			// ✅ DESKTOP FIX: Extra enforcement for desktop cards to prevent width issues
			if (this.currentDevice === 'desktop' || this.currentDevice === 'large' || this.currentDevice === 'ultraWide') {
				card.style.flex = `0 0 ${this.carousel.cardWidth}px`;
				card.style.overflow = 'hidden';
				card.style.wordWrap = 'break-word';
				card.style.wordBreak = 'break-word';

				// ✅ CRITICAL FIX: Force all child elements to respect card width
				const cardContent = card.querySelector('.budget-content');
				if (cardContent) {
					cardContent.style.width = '100%';
					cardContent.style.maxWidth = '100%';
					cardContent.style.overflow = 'hidden';
				}

				const cardTitle = card.querySelector('.budget-title');
				if (cardTitle) {
					cardTitle.style.maxWidth = '100%';
					cardTitle.style.overflow = 'hidden';
					cardTitle.style.textOverflow = 'ellipsis';
					cardTitle.style.whiteSpace = 'nowrap';
				}

				const amountRows = card.querySelectorAll('.amount-row');
				amountRows.forEach(row => {
					row.style.maxWidth = '100%';
					row.style.overflow = 'hidden';
				});
			}
		});

		console.log(`✅ Enforced RESPONSIVE sizes on ${cards.length} cards for ${this.currentDevice} - width: ${this.carousel.cardWidth}px each`);
	}

	/**
	 * ✅ RESPONSIVE UPDATE: Update carousel controls with device-appropriate logic
	 */
	updateFixedCarouselControls() {
		const prevBtn = document.getElementById('carousel-prev');
		const nextBtn = document.getElementById('carousel-next');
		const wrapper = document.querySelector('.perfect-carousel-wrapper');

		if (!prevBtn || !nextBtn || !wrapper) return;

		// ✅ RESPONSIVE: Always show wrapper and arrows
		wrapper.style.display = 'flex';
		prevBtn.style.display = 'flex';
		nextBtn.style.display = 'flex';

		const realCards = this.filteredBudgets.filter(card => !card.isDummy);

		if (realCards.length <= this.carousel.cardsPerView) {
			// ✅ RESPONSIVE: Disable navigation when not enough real cards for current device
			prevBtn.disabled = true;
			nextBtn.disabled = true;
			prevBtn.style.opacity = '0.5';
			nextBtn.style.opacity = '0.5';
			console.log(`🎠 RESPONSIVE navigation disabled for ${this.currentDevice}: not enough cards (${realCards.length} <= ${this.carousel.cardsPerView})`);
		} else {
			// ✅ RESPONSIVE: Enable navigation based on device-appropriate position
			prevBtn.style.opacity = '1';
			nextBtn.style.opacity = '1';

			const maxIndex = Math.max(0, this.carousel.totalCards - this.carousel.cardsPerView);
			prevBtn.disabled = this.carousel.currentIndex <= 0;
			nextBtn.disabled = this.carousel.currentIndex >= maxIndex;

			console.log(`🎠 RESPONSIVE navigation for ${this.currentDevice}: ${this.carousel.currentIndex}/${maxIndex}, Real cards: ${realCards.length}, Cards per view: ${this.carousel.cardsPerView}`);
		}
	}

	/**
	 * ✅ LEGACY: Keep old method name for compatibility
	 */
	updateCarouselControls() {
		return this.updateFixedCarouselControls();
	}

	/**
	 * ✅ RESPONSIVE UPDATE: Fixed carousel navigation with device awareness
	 */
	carouselPrevFixed() {
		const realCards = this.filteredBudgets.filter(card => !card.isDummy);
		if (realCards.length <= this.carousel.cardsPerView) {
			console.log(`⬅️ RESPONSIVE navigation disabled for ${this.currentDevice}: not enough real cards (${realCards.length} <= ${this.carousel.cardsPerView})`);
			return;
		}

		if (this.carousel.currentIndex > 0) {
			this.carousel.currentIndex--;
			this.applyFixedCarouselLayout();
			this.updateFixedCarouselControls();
			console.log(`⬅️ RESPONSIVE carousel moved to index ${this.carousel.currentIndex} on ${this.currentDevice}`);
		}
	}

	/**
	 * ✅ RESPONSIVE UPDATE: Fixed carousel navigation with device awareness
	 */
	carouselNextFixed() {
		const realCards = this.filteredBudgets.filter(card => !card.isDummy);
		if (realCards.length <= this.carousel.cardsPerView) {
			console.log(`➡️ RESPONSIVE navigation disabled for ${this.currentDevice}: not enough real cards (${realCards.length} <= ${this.carousel.cardsPerView})`);
			return;
		}

		const maxIndex = Math.max(0, this.carousel.totalCards - this.carousel.cardsPerView);
		if (this.carousel.currentIndex < maxIndex) {
			this.carousel.currentIndex++;
			this.applyFixedCarouselLayout();
			this.updateFixedCarouselControls();
			console.log(`➡️ RESPONSIVE carousel moved to index ${this.carousel.currentIndex} on ${this.currentDevice}`);
		}
	}

	/**
	 * ✅ LEGACY: Keep old method names for compatibility
	 */
	carouselPrev() {
		return this.carouselPrevFixed();
	}

	carouselNext() {
		return this.carouselNextFixed();
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
	 * ✅ RESPONSIVE UPDATE: Create budget card with device-appropriate sizing
	 */
	createBudgetCardHTML(budget) {
		// Handle dummy cards
		if (budget.isDummy) {
			return `
				<div class="budget-card dummy-card" data-budget-id="${budget.id}" style="width: ${this.carousel.cardWidth}px; min-width: ${this.carousel.cardWidth}px; max-width: ${this.carousel.cardWidth}px; flex-shrink: 0;">
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

		// ✅ ENHANCED: Use smart truncated category name with full name in title for tooltip
		const categoryName = budget.isGeneralBudget ?
			'General Budget' :
			this.translateCategoryName(budget.categoryName);
		const fullCategoryName = budget.isGeneralBudget ?
			'General Budget' :
			this.translateCategoryName(budget.categoryName, 100); // Full name for tooltip
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
			<div class="budget-card ${statusClass}" data-budget-id="${budget.id}" style="width: ${this.carousel.cardWidth}px; min-width: ${this.carousel.cardWidth}px; max-width: ${this.carousel.cardWidth}px; flex-shrink: 0;">
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
					<h3 class="budget-title" title="${this.escapeHtml(fullCategoryName)}">${this.escapeHtml(categoryName)}</h3>
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
	 * FIXED: Analytics with proper General Budget handling and top categories
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
	 * FIXED: Analytics with General Budget logic and top 3 categories
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
	 * ✅ COMPLETELY FIXED: Budget Efficiency Analysis with exactly 2 visible cards and smart scrolling
	 */
	renderBudgetEfficiencyAnalysis(container) {
		// FIXED: Exclude General Budget from efficiency analysis
		const budgetData = this.budgets
			.filter(b => !b.isGeneralBudget && parseFloat(b.plannedAmount) > 0)
			.map(b => ({
				name: this.translateCategoryName(b.categoryName), // ✅ Already applies smart truncation
				planned: parseFloat(b.plannedAmount),
				spent: parseFloat(b.spentAmount),
				efficiency: parseFloat(b.plannedAmount) > 0 ? (parseFloat(b.spentAmount) / parseFloat(b.plannedAmount)) * 100 : 0,
				color: b.categoryColor || '#6366f1',
				isGeneral: false
			}))
			.sort((a, b) => b.efficiency - a.efficiency);

		let chartHTML = '<div class="innovative-analytics-container">';

		if (budgetData.length > 0) {
			const avgEfficiency = budgetData.reduce((sum, b) => sum + b.efficiency, 0) / budgetData.length;

			chartHTML += `
				<div class="analytics-header">
					<div class="header-info">
						<h4><i data-lucide="trending-up"></i> Category Budget Efficiency</h4>
						<div class="efficiency-score">
							<span class="score-label">Average Efficiency:</span>
							<span class="score-value ${avgEfficiency > 100 ? 'over' : avgEfficiency > 80 ? 'high' : 'good'}">${avgEfficiency.toFixed(1)}%</span>
						</div>
					</div>
				</div>
			`;

			// ✅ FIXED: Smart grid sizing - exactly 2 cards visible, scroll if more than 2
			const hasMoreThanTwoCards = budgetData.length > 2;

			// ✅ FIXED: Calculate proper height for exactly 2 cards
			const cardHeight = 220; // Approximate height per card including margins
			const cardGap = 16; // Gap between cards (1rem = 16px)
			const exactHeightForTwoCards = (cardHeight * 2) + cardGap; // 456px for exactly 2 cards

			chartHTML += `
				<div class="efficiency-grid" style="
					display: flex;
					flex-direction: column;
					gap: 1rem;
					flex: 1;
					max-height: ${exactHeightForTwoCards}px;
					min-height: ${exactHeightForTwoCards}px;
					overflow-y: ${hasMoreThanTwoCards ? 'auto' : 'hidden'};
					overflow-x: hidden;
					padding-right: ${hasMoreThanTwoCards ? '0.5rem' : '0'};
					${hasMoreThanTwoCards ? `
						scrollbar-width: thin;
						scrollbar-color: #8b5cf6 #374151;
					` : ''}
				">
			`;

			budgetData.forEach((budget, index) => {
				const efficiencyClass = budget.efficiency > 100 ? 'over-budget' :
									   budget.efficiency > 90 ? 'near-limit' :
									   budget.efficiency > 50 ? 'moderate' : 'under-used';

				chartHTML += `
					<div class="efficiency-card ${efficiencyClass}" style="
						animation-delay: ${index * 0.1}s;
						flex-shrink: 0;
						min-height: ${cardHeight}px;
						max-height: ${cardHeight}px;
					">
						<div class="efficiency-header">
							<div class="budget-label">
								<div class="label-icon" style="background-color: ${budget.color}">
									<i data-lucide="tag"></i>
								</div>
								<span class="label-text" title="${this.escapeHtml(budget.name)}">${budget.name}</span>
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
					<h4>No Category Budget Data</h4>
					<p>Create category budgets to see efficiency analysis</p>
				</div>
			`;
		}

		chartHTML += '</div>';
		container.innerHTML = chartHTML;

		// ✅ FIXED: Apply enhanced scrolling styles after rendering
		if (budgetData.length > 2) {
			this.applyEnhancedEfficiencyScrolling(container);
		}

		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}

		console.log(`✅ Efficiency analysis rendered: ${budgetData.length} categories, shows exactly 2 cards${budgetData.length > 2 ? ' with scroll for ' + (budgetData.length - 2) + ' more' : ''}`);
	}

	/**
	 * ✅ COMPLETELY NEW: Apply enhanced scrolling styles for efficiency grid with purple scrollbar
	 */
	applyEnhancedEfficiencyScrolling(container) {
		const grid = container.querySelector('.efficiency-grid');
		if (!grid) return;

		// ✅ ENHANCED: Add custom CSS styles for webkit scrollbar
		const styleId = 'efficiency-scrollbar-styles';

		// Remove existing styles if any
		const existingStyle = document.getElementById(styleId);
		if (existingStyle) {
			existingStyle.remove();
		}

		// ✅ FIXED: Add purple scrollbar styles
		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
			.efficiency-grid::-webkit-scrollbar {
				width: 8px;
			}
			.efficiency-grid::-webkit-scrollbar-track {
				background: #374151;
				border-radius: 4px;
			}
			.efficiency-grid::-webkit-scrollbar-thumb {
				background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
				border-radius: 4px;
				min-height: 20px;
				border: 1px solid #4b5563;
				transition: all 0.3s ease;
			}
			.efficiency-grid::-webkit-scrollbar-thumb:hover {
				background: linear-gradient(135deg, #9333ea 0%, #8b5cf6 100%);
				box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
				border-color: #6366f1;
			}
			.efficiency-grid::-webkit-scrollbar-corner {
				background: #374151;
			}
		`;

		document.head.appendChild(style);

		console.log('✅ Enhanced efficiency scrolling applied with beautiful purple scrollbar');
	}

	/**
	 * ✅ ENHANCED: Budget Trends Analysis with FIXED Total Spent calculation and NEW Top Spending Categories truncation
	 * ✅ MOBILE FIX: Budget Health card order adjusted for mobile - goes under Top Spending Categories in single column
	 */
	renderBudgetTrendsAnalysis(container) {
		let trendsHTML = '<div class="innovative-analytics-container">';

		if (this.budgets.length > 0) {
			// ✅ FIXED: Use summary data that already has proper Total Spent logic
			const totalPlanned = this.summaryData.totalBudget;
			const totalSpent = this.summaryData.totalSpent; // ✅ This is now ONLY from category budgets
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

			// ✅ MOBILE + TABLET FIX: Add inline CSS for column layout
			trendsHTML += `
				<style>
					@media (max-width: 767px) {
						.trends-grid {
							display: flex !important;
							flex-direction: column !important;
							gap: var(--space-md) !important;
						}
						.trend-card.distribution-card {
							order: 1 !important;
						}
						.trend-card.health-card {
							order: 2 !important;
						}
					}
					@media (min-width: 768px) and (max-width: 1023px) {
						.trends-grid {
							display: flex !important;
							flex-direction: column !important;
							gap: var(--space-md) !important;
						}
						.trend-card.distribution-card {
							order: 1 !important;
						}
						.trend-card.health-card {
							order: 2 !important;
						}
					}
				</style>
			`;

			trendsHTML += '<div class="trends-grid">';

			// ✅ FIXED: Top 3 spending categories with proper calculation and NEW Top Spending Categories truncation
			const categoryBudgets = this.budgets.filter(b => !b.isGeneralBudget && parseFloat(b.spentAmount) > 0);
			const topCategories = categoryBudgets
				.sort((a, b) => parseFloat(b.spentAmount) - parseFloat(a.spentAmount))
				.slice(0, 3);

			// ✅ FIXED: Calculate total spent from ONLY category budgets for percentage calculation
			const categoryTotalSpent = categoryBudgets.reduce((sum, budget) =>
				sum + parseFloat(budget.spentAmount || 0), 0);

			console.log('📊 Analytics Debug (FIXED):', {
				totalCategoryBudgets: categoryBudgets.length,
				topCategories: topCategories.length,
				categoryTotalSpent: categoryTotalSpent,
				summaryTotalSpent: totalSpent,
				budgetsData: categoryBudgets.map(b => ({
					name: b.categoryName,
					spent: b.spentAmount
				}))
			});

			trendsHTML += `
				<div class="trend-card distribution-card">
					<h5><i data-lucide="pie-chart"></i> Top Spending Categories</h5>
					<div class="distribution-chart">
						<div class="chart-center">
							<div class="center-value">€${categoryTotalSpent.toFixed(0)}</div>
							<div class="center-label">Category Spending</div>
						</div>
						<div class="distribution-items">
			`;

			if (topCategories.length > 0) {
				topCategories.forEach((budget, index) => {
					// ✅ FIXED: Calculate percentage based on category spending only
					const percentage = categoryTotalSpent > 0 ? (parseFloat(budget.spentAmount) / categoryTotalSpent) * 100 : 0;

					// ✅ NEW: Apply TOP SPENDING CATEGORIES specific truncation
					const translatedName = this.translateCategoryName(budget.categoryName);
					const categoryName = this.truncateTopSpendingCategory(translatedName);
					const fullCategoryName = this.translateCategoryName(budget.categoryName, 100); // Full name for tooltip

					console.log(`📊 Top Spending Category ${categoryName}: €${budget.spentAmount} = ${percentage.toFixed(1)}%`);

					trendsHTML += `
						<div class="distribution-item">
							<div class="item-color" style="background-color: ${budget.categoryColor || '#6366f1'}"></div>
							<span class="item-name" title="${this.escapeHtml(fullCategoryName)}">${categoryName}</span>
							<span class="item-percentage">${percentage.toFixed(1)}%</span>
						</div>
					`;
				});
			} else {
				trendsHTML += `
					<div class="distribution-item">
						<div class="item-color" style="background-color: #6366f1"></div>
						<span class="item-name">No category spending data</span>
						<span class="item-percentage">0%</span>
					</div>
				`;
			}

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
		return 'Room to grow - consider planned purchases';
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

	/**
	 * FIXED: Check for existing General Budget before opening modal
	 */
	openBudgetModal(type = null, budget = null) {
		const modal = document.getElementById('budget-modal');
		const form = document.getElementById('budget-form');
		const title = document.getElementById('budget-modal-title');

		if (!modal || !form) return;

		// FIXED: Prevent creating second General Budget
		if (type === 'general' && !budget) {
			const existingGeneralBudget = this.budgets.find(b => b.isGeneralBudget);
			if (existingGeneralBudget) {
				this.showToast('You already have a General Budget for this month. Edit the existing one instead.', 'warning');
				console.log('❌ Prevented creating second General Budget');
				return;
			}
		}

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
		// FIXED: Check for existing General Budget when switching to general type
		if (clickedBtn.dataset.type === 'general' && !this.isEditing) {
			const existingGeneralBudget = this.budgets.find(b => b.isGeneralBudget);
			if (existingGeneralBudget) {
				this.showToast('You already have a General Budget for this month. Edit the existing one instead.', 'warning');
				console.log('❌ Prevented switching to General Budget type');
				return;
			}
		}

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

			// FIXED: Final check for General Budget duplication
			if (budgetData.type === 'general' && !this.isEditing) {
				const existingGeneralBudget = this.budgets.find(b => b.isGeneralBudget);
				if (existingGeneralBudget) {
					this.showToast('You already have a General Budget for this month.', 'error');
					return;
				}
			}

			let result;
			if (this.isEditing) {
				result = await this.updateBudget(this.currentBudget.id, budgetData);
				this.showToast('Budget updated successfully!', 'success');

				// ✅ FIXED: Add notification with proper data structure
				this.addLocalNotification({
					title: 'Budget Updated',
					message: `${budgetData.type === 'general' ? 'General' : 'Category'} budget of €${budgetData.plannedAmount} updated`,
					categoryName: budgetData.type === 'general' ? 'General Budget' : this.getCategoryName(budgetData.categoryId),
					type: 'info',
					severity: 'info'
				});
			} else {
				result = await this.createBudget(budgetData);
				this.showToast('Budget created successfully!', 'success');

				// ✅ FIXED: Add notification with proper data structure
				this.addLocalNotification({
					title: 'New Budget Created',
					message: `${budgetData.type === 'general' ? 'General' : 'Category'} budget of €${budgetData.plannedAmount} created`,
					categoryName: budgetData.type === 'general' ? 'General Budget' : this.getCategoryName(budgetData.categoryId),
					type: 'success',
					severity: 'success'
				});
			}

			this.signalBudgetUpdate();
			await this.refreshDataOnly();
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

	/**
	 * ✅ NEW: Get category name by ID
	 */
	getCategoryName(categoryId) {
		if (!categoryId) return 'General Budget';
		const category = this.categories.find(cat => cat.id == categoryId);
		return category ? this.translateCategoryName(category.name) : 'Unknown Category';
	}

	/**
	 * ✅ COMPLETELY FIXED: Validation with STRING-BASED check for large numbers
	 * CRITICAL FIX: Check large numbers as STRING before parseFloat converts to scientific notation
	 */
	validateBudgetForm(form) {
		let isValid = true;
		this.clearFormErrors();

		const amount = form.plannedAmount.value;

		// ✅ FIRST: Check if there's any input at all
		if (!amount || amount.trim() === '') {
			this.showFieldError('amount-error', 'Amount is required');
			isValid = false;
			return isValid; // Stop here if no input
		}

		// ✅ CRITICAL FIX: Check for maximum amount AS STRING - BEFORE parseFloat
		// This catches numbers like 10000000000 BEFORE they get converted to scientific notation
		const MAX_BUDGET_AMOUNT = 9999999999;
		const cleanAmount = amount.trim().replace(/^[+\-]/, ''); // Remove sign for length check

		// Check if it's a pure number string (digits and optional decimal point)
		if (/^\d*\.?\d*$/.test(cleanAmount)) {
			// For pure integers, check digit count
			if (!cleanAmount.includes('.')) {
				if (cleanAmount.length > 10) { // 9999999999 has 10 digits
					this.showFieldError('amount-error',
						`Budget amount is too large. Maximum allowed is €${MAX_BUDGET_AMOUNT.toLocaleString()}`);
					isValid = false;
					return isValid;
				}
			}

			// For numbers with decimals, check if integer part exceeds limit
			const integerPart = cleanAmount.split('.')[0];
			if (integerPart.length > 10) {
				this.showFieldError('amount-error',
					`Budget amount is too large. Maximum allowed is €${MAX_BUDGET_AMOUNT.toLocaleString()}`);
				isValid = false;
				return isValid;
			}

			// Additional check: if integer part has 10 digits, compare value
			if (integerPart.length === 10) {
				const integerValue = parseInt(integerPart);
				if (integerValue > MAX_BUDGET_AMOUNT) {
					this.showFieldError('amount-error',
						`Budget amount is too large. Maximum allowed is €${MAX_BUDGET_AMOUNT.toLocaleString()}`);
					isValid = false;
					return isValid;
				}
			}
		}

		const amountValue = parseFloat(amount);

		// ✅ SECOND: Check for valid number
		if (isNaN(amountValue) || !isFinite(amountValue)) {
			this.showFieldError('amount-error', 'Please enter a valid budget amount');
			isValid = false;
			return isValid;
		}

		// ✅ THIRD: Final safety check for maximum amount (for edge cases)
		if (amountValue > MAX_BUDGET_AMOUNT) {
			this.showFieldError('amount-error',
				`Budget amount is too large. Maximum allowed is €${MAX_BUDGET_AMOUNT.toLocaleString()}`);
			isValid = false;
			return isValid;
		}

		// ✅ FOURTH: Check for negative/zero values
		if (amountValue <= 0) {
			this.showFieldError('amount-error', 'Amount must be greater than 0');
			isValid = false;
			return isValid;
		}

		// ✅ FIFTH: Check for too many decimal places
		const decimalPlaces = amount.includes('.') ? amount.split('.')[1]?.length || 0 : 0;
		if (decimalPlaces > 2) {
			this.showFieldError('amount-error', 'Budget amount can have maximum 2 decimal places');
			isValid = false;
			return isValid;
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

		// Category budget validation against General Budget (only if amount is valid)
		if (activeBudgetType === 'category' && amountValue > 0 && isFinite(amountValue) && amountValue <= MAX_BUDGET_AMOUNT) {
			const generalBudget = this.budgets.find(b => b.isGeneralBudget);

			if (generalBudget) {
				const generalPlanned = parseFloat(generalBudget.plannedAmount || 0);

				const currentBudgetId = this.isEditing ? this.currentBudget.id : null;
				const existingCategoryTotal = this.budgets
					.filter(b => b.isCategoryBudget && b.id !== currentBudgetId)
					.reduce((sum, budget) => sum + parseFloat(budget.plannedAmount || 0), 0);

				const newAmount = amountValue;
				const totalAfterChange = existingCategoryTotal + newAmount;

				if (totalAfterChange > generalPlanned) {
					const maxAllowed = generalPlanned - existingCategoryTotal;
					this.showFieldError('amount-error',
						`Amount exceeds General Budget limit. Maximum allowed: €${maxAllowed.toFixed(2)}`);
					isValid = false;
				}
			}
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

		// ✅ ENHANCED: Use smart truncated category name for display
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

	/**
	 * ✅ FIXED: Confirm delete budget with proper success message and notification
	 */
	async confirmDeleteBudget() {
		if (!this.currentBudget) return;

		const deleteBtn = document.getElementById('confirm-delete-budget-btn');
		const budgetName = this.currentBudget.categoryName || 'General Budget';

		try {
			this.setButtonLoading(deleteBtn, true);

			// ✅ FIXED: Catch potential JSON parsing errors but treat as success
			try {
				await this.fetchAPI(`/budgets/${this.currentBudget.id}`, 'DELETE');
			} catch (fetchError) {
				// If it's a JSON parsing error but the HTTP status was OK, treat as success
				if (fetchError.message.includes('Unexpected end of JSON input') ||
					fetchError.message.includes('SyntaxError') ||
					fetchError.message.includes('Unexpected token')) {
					console.log('✅ Delete successful (server returned empty response)');
					// Continue to success handling
				} else {
					// Real error, re-throw it
					throw fetchError;
				}
			}

			// ✅ SUCCESS - Show proper success message with smart truncated name
			this.showToast(`Budget "${this.translateCategoryName(budgetName)}" deleted successfully!`, 'success');

			// ✅ FIXED: Add notification with proper data structure
			this.addLocalNotification({
				title: 'Budget Deleted',
				message: `Budget for ${this.translateCategoryName(budgetName)} has been removed`,
				categoryName: this.translateCategoryName(budgetName),
				type: 'warning',
				severity: 'warning'
			});

			this.signalBudgetUpdate();
			await this.loadBudgetsForCurrentPeriod();
			this.closeDeleteModal();

			console.log(`✅ Budget deletion completed successfully for: ${budgetName}`);

		} catch (error) {
			console.error(`❌ Failed to delete budget "${budgetName}":`, error);
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

		this.applyFiltersAndRenderFixed();
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

		this.applyFiltersAndRenderFixed();
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

	/**
	 * ✅ COMPLETELY FIXED: Initialize notifications with proper structure and localStorage persistence
	 */
	async initializeNotifications() {
		try {
			// ✅ NEW: Load local notifications from localStorage first
			this.loadLocalNotificationsFromStorage();

			await this.loadNotifications();
			this.updateNotificationBadge();
			console.log('✅ Notifications initialized:', {
				apiNotifications: this.notifications.length,
				localNotifications: this.localNotifications.length
			});
		} catch (error) {
			console.error('❌ Failed to initialize notifications:', error);
		}
	}

	/**
	 * ✅ NEW: Load local notifications from localStorage
	 */
	loadLocalNotificationsFromStorage() {
		try {
			const stored = localStorage.getItem('budgetLocalNotifications');
			if (stored) {
				const parsedNotifications = JSON.parse(stored);

				// ✅ FILTER: Only load notifications less than 1 day old
				const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
				this.localNotifications = parsedNotifications.filter(notification => {
					const notificationDate = new Date(notification.createdAt);
					return notificationDate > oneDayAgo;
				});

				// ✅ SAVE: Update localStorage with filtered notifications
				this.saveLocalNotificationsToStorage();

				console.log(`✅ Loaded ${this.localNotifications.length} local notifications from storage (filtered from ${parsedNotifications.length})`);
			} else {
				this.localNotifications = [];
				console.log('✅ No local notifications found in storage');
			}
		} catch (error) {
			console.error('❌ Failed to load local notifications from storage:', error);
			this.localNotifications = [];
		}
	}

	/**
	 * ✅ NEW: Save local notifications to localStorage
	 */
	saveLocalNotificationsToStorage() {
		try {
			localStorage.setItem('budgetLocalNotifications', JSON.stringify(this.localNotifications));
			console.log(`💾 Saved ${this.localNotifications.length} local notifications to storage`);
		} catch (error) {
			console.error('❌ Failed to save local notifications to storage:', error);
		}
	}

	async loadNotifications() {
		try {
			// Load API notifications
			const apiAlerts = await this.fetchAPI('/alerts');
			this.notifications = apiAlerts.map(notification => ({
				...notification,
				message: this.translateNotificationMessage(notification.message),
				title: this.translateNotificationTitle(notification.title),
				source: 'api' // ✅ Mark as API source
			}));

			console.log(`✅ Loaded ${this.notifications.length} API notifications`);
		} catch (error) {
			console.error('❌ Failed to load API notifications:', error);
			this.notifications = [];
		}
	}

	/**
	 * ✅ NEW: Translate Bulgarian notification titles to English
	 */
	translateNotificationTitle(title) {
		if (!title) return 'Budget Alert';

		const translations = {
			'Предупреждение за бюджет': 'Budget Warning',
			'Бюджет превишен': 'Budget Exceeded',
			'Бюджетно предупреждение': 'Budget Alert',
			'Лимит на бюджета': 'Budget Limit',
			'Общ бюджет': 'General Budget',
			'Категориен бюджет': 'Category Budget',
			'Внимание': 'Attention',
			'Предупреждение': 'Warning',
			'Грешка': 'Error',
			'Информация': 'Information'
		};

		let translatedTitle = title;
		Object.entries(translations).forEach(([bulgarian, english]) => {
			translatedTitle = translatedTitle.replace(new RegExp(bulgarian, 'gi'), english);
		});

		return translatedTitle;
	}

	/**
	 * ✅ ENHANCED: Translate Bulgarian notification messages to English, remove emojis and apply smart truncation to category names
	 */
	translateNotificationMessage(message) {
		if (!message) return 'Budget notification';

		// ✅ REMOVE: All emoji prefixes from the message
		let cleanMessage = message.replace(/^[⚠️🚨📊💰🔔📈📉💸🎯❌✅ℹ️]+\s*/g, '');

		const translations = {
			// Main message patterns
			'Бюджетът е превишен': 'Budget exceeded',
			'Бюджетът беше превишен': 'Budget has been exceeded',
			'Превишен бюджет': 'Budget exceeded',
			'Близо до лимита на бюджета': 'Near budget limit',
			'Бюджетът се приближава към лимита': 'Budget approaching limit',
			'Предупреждение за бюджет': 'Budget warning',
			'Общият бюджет е превишен': 'General budget exceeded',
			'Общият бюджет се приближава към лимита': 'General budget near limit',
			'Категорийният бюджет е превишен': 'Category budget exceeded',
			'Категорийният бюджет се приближава към лимита': 'Category budget near limit',

			// Threshold messages
			'достигна 90% от лимита': 'reached 90% of limit',
			'достигна 95% от лимита': 'reached 95% of limit',
			'достигна 100% от лимита': 'reached 100% of limit',
			'превиши лимита с': 'exceeded limit by',

			// Category names - these will be processed by translateCategoryName as well
			'Общ бюджет': 'General Budget',
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

			// Time expressions
			'за месец': 'for month',
			'за период': 'for period',
			'през': 'in',
			'от': 'from',
			'до': 'to',

			// Status words
			'Внимание': 'Attention',
			'Предупреждение': 'Warning',
			'Грешка': 'Error',
			'Информация': 'Information',
			'Превишихте': 'You exceeded',
			'Изразходили сте': 'You have spent',
			'планираните': 'planned',
			'лв.': '€'
		};

		let translatedMessage = cleanMessage;
		Object.entries(translations).forEach(([bulgarian, english]) => {
			translatedMessage = translatedMessage.replace(new RegExp(bulgarian, 'gi'), english);
		});

		// ✅ ENHANCED: Apply smart truncation to long category names within the message content
		// Look for patterns like 'category name' in quotes and truncate them
		translatedMessage = translatedMessage.replace(/'([^']{16,})'/g, (match, categoryName) => {
			const truncated = this.truncateCategoryName(categoryName);
			return `'${truncated}'`;
		});

		// ✅ ENHANCED: Also handle category names without quotes that are very long
		// Split by spaces and apply smart truncation to any word longer than 25 characters (likely a category name)
		const words = translatedMessage.split(' ');
		const processedWords = words.map(word => {
			// Skip if it's a number, currency, or contains special characters
			if (/^\d+[\.,\d]*$/.test(word) || /[€$%]/.test(word) || word.length <= 25) {
				return word;
			}
			// Apply smart truncation to very long words that are likely category names
			return this.truncateCategoryName(word);
		});

		return processedWords.join(' ');
	}

	/**
	 * ✅ CRITICAL FIX: Toggle notifications with improved mobile/tablet handling
	 */
	toggleNotifications() {
		const panel = document.getElementById('notifications-panel');
		if (!panel) {
			console.error('❌ Notifications panel not found in DOM');
			return;
		}

		const isCurrentlyActive = panel.classList.contains('active');

		if (isCurrentlyActive) {
			this.closeNotificationsPanel();
		} else {
			this.showNotificationsPanel();
		}
	}

	/**
	 * ✅ CRITICAL FIX: Show notifications panel with proper mobile/tablet support
	 */
	async showNotificationsPanel() {
		try {
			console.log('🔔 Opening notifications panel...');

			await this.loadNotifications();

			const panel = document.getElementById('notifications-panel');
			if (!panel) {
				console.error('❌ Notifications panel element not found');
				return;
			}

			// ✅ CRITICAL FIX: Ensure panel is properly positioned and visible
			panel.style.display = 'block';
			panel.style.visibility = 'visible';
			panel.style.opacity = '1';
			panel.style.pointerEvents = 'auto';

			this.renderNotifications();

			// ✅ Add active class after a small delay to ensure smooth animation
			setTimeout(() => {
				panel.classList.add('active');
			}, 10);

			console.log('✅ Notifications panel opened successfully');
		} catch (error) {
			console.error('❌ Failed to show notifications panel:', error);
			this.showToast('Failed to load notifications', 'error');
		}
	}

	/**
	 * ✅ CRITICAL FIX: Close notifications panel with proper cleanup
	 */
	closeNotificationsPanel() {
		const panel = document.getElementById('notifications-panel');
		if (panel) {
			panel.classList.remove('active');

			// ✅ Add a slight delay before hiding to allow animation to complete
			setTimeout(() => {
				panel.style.display = 'none';
				panel.style.visibility = 'hidden';
				panel.style.opacity = '0';
				panel.style.pointerEvents = 'none';
			}, 200);

			console.log('✅ Notifications panel closed');
		}
	}

	/**
	 * ✅ COMPLETELY FIXED: Render notifications with proper merging of API and local notifications
	 */
	renderNotifications() {
		const container = document.getElementById('notifications-list');
		if (!container) {
			console.error('❌ Notifications list container not found');
			return;
		}

		// ✅ FIXED: Merge API and local notifications properly
		const allNotifications = this.getAllNotifications();

		// ✅ FILTER: Only show notifications less than 1 day old
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const validNotifications = allNotifications.filter(notification => {
			const notificationDate = new Date(notification.createdAt);
			return notificationDate > oneDayAgo;
		});

		// ✅ SORT: Most recent first
		validNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

		// ✅ SMART SCROLLBAR: Show scrollbar only when more than 3 notifications
		if (validNotifications.length > 3) {
			container.classList.remove('few-items');
			container.classList.add('many-items');
		} else {
			container.classList.remove('many-items');
			container.classList.add('few-items');
		}

		if (validNotifications.length === 0) {
			container.innerHTML = `
				<div class="no-notifications">
					<i data-lucide="bell-off"></i>
					<p>No recent budget alerts</p>
					<span class="no-notifications-subtitle">Notifications older than 1 day are automatically removed</span>
				</div>
			`;
		} else {
			container.innerHTML = validNotifications.map(notification => {
				// ✅ ENHANCED: Use smart truncated category name for notifications
				const categoryName = this.truncateCategoryName(
					this.translateCategoryName(notification.categoryName || 'General Budget')
				);
				const fullCategoryName = this.translateCategoryName(notification.categoryName || 'General Budget', 100);

				return `
					<div class="notification-item ${notification.isRead ? '' : 'unread'} ${notification.source === 'local' ? 'local-notification' : ''}"
						 onclick="budgetsManager.markNotificationAsRead(${notification.id})">
						<div class="notification-icon ${this.getNotificationSeverity(notification)}">
							<i data-lucide="${this.getNotificationIcon(notification)}"></i>
						</div>
						<div class="notification-content">
							<div class="notification-title">${this.escapeHtml(notification.title || 'Budget Alert')}</div>
							<div class="notification-details">
								${this.escapeHtml(notification.message)}
							</div>
							<div class="notification-meta">
								<span class="notification-category" title="${this.escapeHtml(fullCategoryName)}">${this.escapeHtml(categoryName)}</span>
								<span class="notification-period">${notification.budgetPeriod || this.getCurrentPeriodString()}</span>
							</div>
							<div class="notification-time">${this.formatSmartRelativeTime(notification.createdAt)}</div>
						</div>
					</div>
				`;
			}).join('');
		}

		if (typeof lucide !== 'undefined') {
			lucide.createIcons();
		}

		console.log(`📱 Rendered ${validNotifications.length} total notifications (${this.notifications.length} API + ${this.localNotifications.length} local)`);
	}

	/**
	 * ✅ COMPLETELY NEW: Get all notifications merged and sorted
	 */
	getAllNotifications() {
		// Combine API and local notifications
		const combined = [
			...this.notifications.map(n => ({ ...n, source: 'api' })),
			...this.localNotifications.map(n => ({ ...n, source: 'local' }))
		];

		// Remove duplicates based on a combination of timestamp and message
		const unique = combined.filter((notification, index, array) =>
			index === array.findIndex(n =>
				n.createdAt === notification.createdAt &&
				n.message === notification.message
			)
		);

		// Sort by creation date (most recent first)
		return unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
	}

	/**
	 * ✅ NEW: Smart relative time formatting with update logic
	 * - 0-59 minutes: "X minutes ago" (updates every 15 min)
	 * - 1-23 hours: "X hours ago" (updates every hour)
	 * - >24 hours: Hidden (removed by updateNotificationTimes)
	 */
	formatSmartRelativeTime(dateString) {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now - date) / (1000 * 60));

		if (diffInMinutes < 1) {
			return 'Just now';
		} else if (diffInMinutes < 60) {
			// Round to nearest 15 minutes for cleaner display
			const roundedMinutes = Math.ceil(diffInMinutes / 15) * 15;
			return `${Math.min(roundedMinutes, 59)} minutes ago`;
		} else if (diffInMinutes < 1440) { // Less than 24 hours
			const hours = Math.floor(diffInMinutes / 60);
			return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
		} else {
			// This shouldn't show up due to filtering, but just in case
			return 'More than 1 day ago';
		}
	}

	/**
	 * ✅ NEW: Get notification severity class
	 */
	getNotificationSeverity(notification) {
		if (notification.severity === 'danger' || notification.type === 'error') {
			return 'danger';
		} else if (notification.severity === 'warning' || notification.type === 'warning') {
			return 'warning';
		} else if (notification.type === 'success') {
			return 'success';
		} else {
			return 'info';
		}
	}

	/**
	 * ✅ NEW: Get notification icon
	 */
	getNotificationIcon(notification) {
		const severity = this.getNotificationSeverity(notification);

		switch (severity) {
			case 'danger':
				return 'alert-circle';
			case 'warning':
				return 'alert-triangle';
			case 'success':
				return 'check-circle';
			default:
				return 'info';
		}
	}

	/**
	 * ✅ COMPLETELY FIXED: Update notification badge with proper counting
	 */
	updateNotificationBadge() {
		const badge = document.getElementById('notification-badge');
		if (!badge) return;

		// ✅ FILTER: Only count notifications less than 1 day old
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		const allNotifications = this.getAllNotifications();

		const unreadCount = allNotifications.filter(notification => {
			const notificationDate = new Date(notification.createdAt);
			return notificationDate > oneDayAgo && !notification.isRead;
		}).length;

		if (unreadCount > 0) {
			badge.textContent = unreadCount;
			badge.style.display = 'block';
		} else {
			badge.style.display = 'none';
		}

		console.log(`🔔 Badge updated: ${unreadCount} unread notifications`);
	}

	/**
	 * ✅ FIXED: Mark notification as read with proper handling of local vs API notifications and localStorage sync
	 */
	async markNotificationAsRead(notificationId) {
		try {
			// Find in local notifications first
			const localNotification = this.localNotifications.find(n => n.id === notificationId);
			if (localNotification) {
				localNotification.isRead = true;
				// ✅ NEW: Save to localStorage after marking as read
				this.saveLocalNotificationsToStorage();
				console.log(`✅ Marked local notification ${notificationId} as read`);
			} else {
				// Try API notification
				await this.fetchAPI(`/alerts/${notificationId}/read`, 'PUT');
				const apiNotification = this.notifications.find(n => n.id === notificationId);
				if (apiNotification) {
					apiNotification.isRead = true;
				}
				console.log(`✅ Marked API notification ${notificationId} as read`);
			}

			this.updateNotificationBadge();
			this.renderNotifications();

		} catch (error) {
			console.error('❌ Failed to mark notification as read:', error);
		}
	}

	/**
	 * ✅ FIXED: Mark all notifications as read with proper handling and localStorage sync
	 */
	async markAllNotificationsAsRead() {
		try {
			// Mark all API notifications as read
			if (this.notifications.length > 0) {
				await this.fetchAPI('/alerts/read-all', 'PUT');
				this.notifications.forEach(notification => {
					notification.isRead = true;
				});
			}

			// Mark all local notifications as read
			this.localNotifications.forEach(notification => {
				notification.isRead = true;
			});

			// ✅ NEW: Save to localStorage after marking all as read
			this.saveLocalNotificationsToStorage();

			this.updateNotificationBadge();
			this.renderNotifications();
			this.showToast('All notifications marked as read', 'success');

			console.log('✅ Marked all notifications as read (API + local)');
		} catch (error) {
			console.error('❌ Failed to mark all notifications as read:', error);
			this.showToast('Failed to update notifications', 'error');
		}
	}

	/**
	 * ✅ COMPLETELY FIXED: Add local notification with proper structure, deduplication and localStorage persistence
	 */
	addLocalNotification(notification) {
		const newNotification = {
			id: Date.now() + Math.random(), // Unique ID for local notifications
			title: notification.title || 'Budget Alert',
			message: notification.message || 'Budget notification',
			categoryName: notification.categoryName || 'General Budget',
			budgetPeriod: notification.budgetPeriod || this.getCurrentPeriodString(),
			type: notification.type || 'info',
			severity: notification.severity || notification.type || 'info',
			isRead: false,
			createdAt: new Date().toISOString(),
			source: 'local'
		};

		// ✅ PREVENT DUPLICATES: Check if similar notification already exists
		const isDuplicate = this.localNotifications.some(existing =>
			existing.message === newNotification.message &&
			existing.categoryName === newNotification.categoryName &&
			Math.abs(new Date(existing.createdAt) - new Date(newNotification.createdAt)) < 5000 // Within 5 seconds
		);

		if (isDuplicate) {
			console.log('🚫 Duplicate notification prevented:', newNotification.message);
			return;
		}

		// Add to local notifications
		this.localNotifications.unshift(newNotification);

		// Keep only last 20 local notifications
		if (this.localNotifications.length > 20) {
			this.localNotifications.splice(20);
		}

		// ✅ NEW: Save to localStorage immediately after adding
		this.saveLocalNotificationsToStorage();

		this.updateNotificationBadge();

		console.log('📬 Added local notification:', {
			title: newNotification.title,
			message: newNotification.message,
			categoryName: newNotification.categoryName,
			type: newNotification.type
		});
	}

	/**
	 * ✅ LEGACY: Keep old method for compatibility but redirect to new one
	 */
	addNotification(notification) {
		return this.addLocalNotification(notification);
	}

	/**
	 * ✅ NEW: Get current period as string
	 */
	getCurrentPeriodString() {
		const months = [
			'January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'
		];

		return `${months[this.currentPeriod.month - 1]} ${this.currentPeriod.year}`;
	}

	/**
	 * ✅ COMPLETELY FIXED: Only refresh data without recreating carousel
	 */
	async refreshDataOnly() {
		try {
			console.log('🔄 Refreshing budget data only (keeping RESPONSIVE carousel intact)...');

			await Promise.all([
				this.loadBudgetsForCurrentPeriod(),
				this.loadNotifications()
			]);

			this.updateNotificationBadge();

			console.log('✅ Budget data refreshed without touching RESPONSIVE carousel');
		} catch (error) {
			console.error('❌ Error refreshing data:', error);
		}
	}

	/**
	 * ✅ LEGACY: Keep for compatibility but use refreshDataOnly instead
	 */
	async refreshAllData() {
		return this.refreshDataOnly();
	}

	/**
	 * ✅ RESPONSIVE UPDATE: Ensure carousel integrity with device awareness
	 */
	ensureCarouselIntegrity() {
		const wrapper = document.querySelector('.perfect-carousel-wrapper');
		const arrows = document.querySelectorAll('.carousel-arrow');

		if (!wrapper || arrows.length !== 2) {
			console.log(`🔧 RESPONSIVE carousel integrity compromised for ${this.currentDevice}, fixing...`);
			this.setupFixedCarousel();
		} else {
			console.log(`✅ RESPONSIVE carousel integrity maintained for ${this.currentDevice}`);
			this.applyFixedCarouselLayout();
			this.updateFixedCarouselControls();
			this.enforceFixedCardSizes();
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
		console.log('🔴 DEBUG: showFieldError called with:', { errorId, message });

		const errorElement = document.getElementById(errorId);
		console.log('🔴 DEBUG: Error element found:', errorElement);

		if (errorElement) {
			// ✅ ENHANCED: Force display the error message
			errorElement.textContent = message;
			errorElement.classList.add('visible');
			errorElement.style.display = 'block'; // ✅ Force display
			errorElement.style.color = '#ef4444'; // ✅ Force red color
			errorElement.style.fontSize = '0.875rem';
			errorElement.style.marginTop = '0.5rem';
			errorElement.style.fontWeight = '500';

			console.log('🔴 DEBUG: Error message set:', {
				textContent: errorElement.textContent,
				classes: errorElement.classList.toString(),
				display: errorElement.style.display,
				color: errorElement.style.color
			});
		} else {
			console.error('❌ DEBUG: Error element not found with ID:', errorId);
			// ✅ FALLBACK: Show alert if element not found
			alert(`Field Error: ${message}`);
		}
	}

	clearFormErrors() {
		console.log('🔄 DEBUG: Clearing form errors');

		document.querySelectorAll('.form-error').forEach(error => {
			error.classList.remove('visible');
			error.textContent = '';
			error.style.display = 'none'; // ✅ Force hide
			console.log('🔄 DEBUG: Cleared error element:', error.id || error.className);
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

	/**
	 * ✅ LEGACY: Keep for backward compatibility (but use formatSmartRelativeTime)
	 */
	formatRelativeTime(dateString) {
		return this.formatSmartRelativeTime(dateString);
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

	/**
	 * ✅ ENHANCED: fetchAPI method with better error handling for user-friendly messages
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

			if (!response.ok) {
				let errorMessage = `Request failed with status ${response.status}`;

				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorData.message || errorMessage;
				} catch (e) {
					errorMessage = response.statusText || errorMessage;
				}

				// ✅ NEW: Transform technical database errors into user-friendly messages
				errorMessage = this.transformErrorMessage(errorMessage);

				throw new Error(errorMessage);
			}

			// ✅ FIXED: Handle empty responses for DELETE requests
			const contentType = response.headers.get('content-type');
			const contentLength = response.headers.get('content-length');

			// If response is empty (like for DELETE operations)
			if (contentLength === '0' || !contentType) {
				console.log(`✅ ${method} request to ${endpoint} completed successfully (empty response)`);
				return { success: true }; // Return a success object for DELETE operations
			}

			if (contentType && contentType.includes('application/json')) {
				const jsonResponse = await response.json();
				console.log(`✅ ${method} request to ${endpoint} completed successfully:`, jsonResponse);
				return jsonResponse;
			} else {
				const textResponse = await response.text();
				console.log(`✅ ${method} request to ${endpoint} completed successfully:`, textResponse);
				return { success: true, message: textResponse };
			}

		} catch (error) {
			console.error(`❌ ${method} request to ${endpoint} failed:`, error);

			if (error.name === 'TypeError' && error.message.includes('fetch')) {
				throw new Error('Network error. Please check your connection and try again.');
			}
			throw error;
		}
	}

	/**
	 * ✅ NEW: Transform technical database errors into user-friendly messages
	 */
	transformErrorMessage(errorMessage) {
		if (!errorMessage || typeof errorMessage !== 'string') {
			return 'An unexpected error occurred. Please try again.';
		}

		// ✅ FIX: Handle database truncation errors for large amounts
		if (errorMessage.includes('Data truncation: Out of range value for column') &&
			errorMessage.includes('planned_amount')) {
			return 'Budget amount is too large. Please enter a smaller amount (maximum €9,999,999,999).';
		}

		// ✅ FIX: Handle other data truncation errors
		if (errorMessage.includes('Data truncation: Out of range value')) {
			return 'The entered value is too large. Please enter a smaller number.';
		}

		// ✅ FIX: Handle MySQL numeric overflow errors
		if (errorMessage.includes('Out of range value') ||
			errorMessage.includes('Numeric value out of range')) {
			return 'The amount entered is too large. Please use a smaller number.';
		}

		// ✅ FIX: Handle constraint violations
		if (errorMessage.includes('Duplicate entry') ||
			errorMessage.includes('duplicate key value')) {
			return 'This budget already exists. Please check your existing budgets.';
		}

		// ✅ FIX: Handle foreign key constraint errors
		if (errorMessage.includes('foreign key constraint') ||
			errorMessage.includes('Cannot add or update a child row')) {
			return 'Invalid category selected. Please refresh the page and try again.';
		}

		// ✅ FIX: Handle connection timeouts
		if (errorMessage.includes('timeout') ||
			errorMessage.includes('Connection refused')) {
			return 'Connection timeout. Please check your internet connection and try again.';
		}

		// ✅ FIX: Handle permission errors
		if (errorMessage.includes('Access denied') ||
			errorMessage.includes('Permission denied')) {
			return 'You do not have permission to perform this action.';
		}

		// ✅ FIX: Handle validation errors from server
		if (errorMessage.includes('validation failed') ||
			errorMessage.includes('invalid input')) {
			return 'Invalid data entered. Please check your input and try again.';
		}

		// ✅ FIX: Handle server errors
		if (errorMessage.includes('Internal Server Error') ||
			errorMessage.includes('500')) {
			return 'Server error occurred. Please try again in a few moments.';
		}

		// ✅ FIX: Handle not found errors
		if (errorMessage.includes('Not Found') ||
			errorMessage.includes('404')) {
			return 'The requested resource was not found. Please refresh the page.';
		}

		// ✅ FIX: Handle unauthorized errors
		if (errorMessage.includes('Unauthorized') ||
			errorMessage.includes('401')) {
			return 'Your session has expired. Please refresh the page and try again.';
		}

		// ✅ FIX: Handle bad request errors
		if (errorMessage.includes('Bad Request') ||
			errorMessage.includes('400')) {
			return 'Invalid request. Please check your input and try again.';
		}

		// ✅ FIX: Handle JSON parsing errors
		if (errorMessage.includes('Unexpected end of JSON input') ||
			errorMessage.includes('SyntaxError')) {
			return 'Server response error. Please try again.';
		}

		// ✅ DEFAULT: Return a clean, user-friendly message for unknown errors
		// Remove technical details and SQL statements
		let cleanMessage = errorMessage
			.replace(/\[.*?\]/g, '') // Remove [brackets] content
			.replace(/SQL \[.*?\]/g, '') // Remove SQL statements
			.replace(/could not execute statement/gi, '') // Remove technical phrases
			.replace(/org\.hibernate\..*?:/gi, '') // Remove hibernate errors
			.replace(/java\..*?:/gi, '') // Remove java errors
			.replace(/\s+/g, ' ') // Clean up extra spaces
			.trim();

		// If the message is still too technical or empty, provide a generic message
		if (cleanMessage.length < 10 ||
			cleanMessage.includes('Exception') ||
			cleanMessage.includes('Error:') ||
			cleanMessage.includes('SQLException')) {
			return 'An error occurred while processing your request. Please try again.';
		}

		// Capitalize first letter and ensure proper ending
		cleanMessage = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
		if (!cleanMessage.endsWith('.') && !cleanMessage.endsWith('!') && !cleanMessage.endsWith('?')) {
			cleanMessage += '.';
		}

		return cleanMessage;
	}

	/**
	 * ✅ RESPONSIVE UPDATE: Cleanup method with responsive system cleanup
	 */
	cleanup() {
		// Clear time update interval
		if (this.timeUpdateInterval) {
			clearInterval(this.timeUpdateInterval);
			this.timeUpdateInterval = null;
		}

		// ✅ NEW: Clean up responsive system
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}

		// Remove event listeners
		document.removeEventListener('click', this.globalClickHandler);
		document.removeEventListener('keydown', this.globalKeyHandler);
		document.removeEventListener('visibilitychange', this.visibilityChangeHandler);

		// Clear any running timers
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer);
		}

		// ✅ NEW: Save local notifications to localStorage before cleanup
		this.saveLocalNotificationsToStorage();

		// Clear both notification arrays from memory
		this.notifications = [];
		this.localNotifications = [];

		console.log('🧹 RESPONSIVE BudgetsManager cleanup completed with localStorage save and notifications cleared');
	}
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	window.budgetsManager = new BudgetsManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
	if (window.budgetsManager) {
		window.budgetsManager.cleanup();
	}
});