/*
 * PERSONAL FINANCE - LANDING PAGE JAVASCRIPT
 * Handles tab switching, form submissions, and user interactions
 */

// DOM Content Loaded - Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeFormHandlers();
    initializeSmoothScrolling();
    handleURLParameters();
    initializeFormValidation();
});

/*
 * TAB SWITCHING FUNCTIONALITY
 * Handles Login/Register tab switching
 */
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');

            // Clear any existing messages when switching tabs
            clearMessages();
        });
    });
}

/*
 * FORM HANDLERS
 * Handle registration form submission via AJAX
 */
function initializeFormHandlers() {
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
}

/*
 * REGISTRATION FORM HANDLER
 * Submits registration data to backend API
 */
async function handleRegistration(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;

    // Get form data
    const formData = {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value
    };

    // Basic validation
    if (!validateRegistrationForm(formData)) {
        return;
    }

    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            // Success - show message and switch to login tab
            showMessage('Registration successful! Please log in with your credentials.', 'success');
            form.reset();
            switchToLoginTab();
        } else {
            // Error from server
            showMessage(data.error || 'Registration failed. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

/*
 * FORM VALIDATION
 * Client-side validation for registration form
 */
function validateRegistrationForm(data) {
    // Clear previous messages
    clearMessages();

    // Check required fields
    if (!data.firstName) {
        showMessage('First name is required.', 'error');
        return false;
    }

    if (!data.lastName) {
        showMessage('Last name is required.', 'error');
        return false;
    }

    if (!data.email) {
        showMessage('Email is required.', 'error');
        return false;
    }

    if (!data.password) {
        showMessage('Password is required.', 'error');
        return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showMessage('Please enter a valid email address.', 'error');
        return false;
    }

    // Password validation
    if (data.password.length < 8) {
        showMessage('Password must be at least 8 characters long.', 'error');
        return false;
    }

    return true;
}

/*
 * ADDITIONAL FORM VALIDATION
 * Real-time validation as user types
 */
function initializeFormValidation() {
    const emailInputs = document.querySelectorAll('input[type="email"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    // Email validation on blur
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !isValidEmail(this.value)) {
                this.style.borderColor = 'var(--error-red)';
            } else {
                this.style.borderColor = '';
            }
        });
    });

    // Password validation on input
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value && this.value.length < 8) {
                this.style.borderColor = 'var(--warning-orange)';
            } else {
                this.style.borderColor = '';
            }
        });
    });
}

/*
 * UTILITY FUNCTIONS
 */

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Switch to login tab after successful registration
function switchToLoginTab() {
    const loginTab = document.querySelector('.tab-btn[data-tab="login"]');
    if (loginTab) {
        loginTab.click();
    }
}

// Show success/error messages
function showMessage(message, type = 'info') {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    // Clear existing messages
    messagesContainer.innerHTML = '';

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;

    // Add message to container
    messagesContainer.appendChild(messageElement);

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }

    // Scroll to message
    messagesContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Clear all messages
function clearMessages() {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }
}

/*
 * SMOOTH SCROLLING
 * Handle smooth scrolling for anchor links
 */
function initializeSmoothScrolling() {
    // Handle VIEW APP button and other anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();

                // Calculate offset for sticky header
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/*
 * URL PARAMETER HANDLING
 * Handle success/error messages from URL parameters
 */
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Handle registration success
    if (urlParams.get('register') === 'success') {
        showMessage('Registration successful! Please log in with your credentials.', 'success');
        switchToLoginTab();
    }

    // Handle login errors
    if (urlParams.get('error') === 'true') {
        showMessage('Invalid email or password. Please try again.', 'error');
        switchToLoginTab();
    }

    // Handle OAuth errors
    if (urlParams.get('error') === 'oauth') {
        showMessage('OAuth authentication failed. Please try again or use email/password.', 'error');
        switchToLoginTab();
    }

    // Handle logout message
    if (urlParams.get('logout') === 'true') {
        showMessage('You have been successfully logged out.', 'success');
    }

    // Clean URL parameters after handling
    if (urlParams.toString()) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

/*
 * FORM INPUT ENHANCEMENTS
 * Add better UX to form inputs
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add focus/blur effects to form inputs
    const formInputs = document.querySelectorAll('.form-input');

    formInputs.forEach(input => {
        // Add floating label effect (if needed)
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');

            // Add filled class if input has value
            if (this.value.trim()) {
                this.parentElement.classList.add('filled');
            } else {
                this.parentElement.classList.remove('filled');
            }
        });

        // Check initial state
        if (input.value.trim()) {
            input.parentElement.classList.add('filled');
        }
    });
});

/*
 * GOOGLE OAUTH BUTTON ENHANCEMENT
 * Add loading state to Google OAuth buttons
 */
document.addEventListener('DOMContentLoaded', function() {
    const googleButtons = document.querySelectorAll('.btn-google');

    googleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Add loading state
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';

            // Create loading text
            const originalText = this.innerHTML;
            this.innerHTML = '<span style="margin-right: 8px;">⏳</span>Connecting to Google...';

            // Reset after 10 seconds in case of error
            setTimeout(() => {
                this.innerHTML = originalText;
                this.style.opacity = '';
                this.style.pointerEvents = '';
            }, 10000);
        });
    });
});

/*
 * KEYBOARD ACCESSIBILITY
 * Improve keyboard navigation
 */
document.addEventListener('keydown', function(e) {
    // Handle Enter key on tab buttons
    if (e.key === 'Enter' && e.target.classList.contains('tab-btn')) {
        e.target.click();
    }

    // Handle Escape key to clear messages
    if (e.key === 'Escape') {
        clearMessages();
    }
});

/*
 * DEVELOPMENT HELPERS
 * Console logging for development (remove in production)
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🏠 PersonalFinance Landing Page Loaded');
    console.log('📝 Available functions:', {
        showMessage: 'showMessage(text, type)',
        clearMessages: 'clearMessages()',
        switchToLoginTab: 'switchToLoginTab()'
    });
}