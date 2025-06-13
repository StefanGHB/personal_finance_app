/*
 * PERSONAL FINANCE - MODERN LANDING PAGE JAVASCRIPT
 * Handles interactions, form submissions, and enhanced user experience
 */

// DOM Content Loaded - Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeFormHandlers();
    initializeSmoothScrolling();
    initializeFormEnhancements();
    initializeScrollEffects();
    initializeParallaxEffects();
    handleURLParameters();
    initializeFormValidation();
});

/*
 * TAB SWITCHING FUNCTIONALITY
 * Enhanced tab switching with smooth animations
 */
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.opacity = '0';
                content.style.transform = 'translateY(10px)';
            });

            // Add active class to clicked tab
            this.classList.add('active');

            // Animate in the new content
            const targetContent = document.getElementById(targetTab + '-tab');
            setTimeout(() => {
                targetContent.classList.add('active');
                targetContent.style.opacity = '1';
                targetContent.style.transform = 'translateY(0)';
            }, 150);

            // Clear any existing messages when switching tabs
            clearMessages();

            // Add ripple effect to tab button
            createRippleEffect(this, event);
        });
    });
}

/*
 * FORM HANDLERS
 * Enhanced form submission with loading states and animations
 */
function initializeFormHandlers() {
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
}

/*
 * REGISTRATION FORM HANDLER
 * Enhanced with loading animations and better UX
 */
async function handleRegistration(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonContent = submitButton.innerHTML;

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

    // Show loading state with animation
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="loading-spinner"></span>
        <span>Creating Account...</span>
    `;
    submitButton.classList.add('loading');

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
            // Success animation
            submitButton.innerHTML = `
                <span>✓</span>
                <span>Account Created!</span>
            `;
            submitButton.classList.add('success');

            // Show success message and switch to login tab
            showMessage('Registration successful! Please sign in with your credentials.', 'success');
            form.reset();
            resetFormLabels();

            setTimeout(() => {
                switchToLoginTab();
            }, 1500);

        } else {
            // Error from server
            showMessage(data.error || 'Registration failed. Please try again.', 'error');
            shakeForm(form);
        }

    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
        shakeForm(form);
    } finally {
        // Reset button state after delay
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonContent;
            submitButton.classList.remove('loading', 'success');
        }, 2000);
    }
}

/*
 * FORM VALIDATION
 * Enhanced real-time validation with visual feedback
 */
function validateRegistrationForm(data) {
    clearMessages();
    let isValid = true;

    // Check required fields with individual validation
    const validations = [
        { field: 'firstName', value: data.firstName, message: 'First name is required.' },
        { field: 'lastName', value: data.lastName, message: 'Last name is required.' },
        { field: 'email', value: data.email, message: 'Email is required.' },
        { field: 'password', value: data.password, message: 'Password is required.' }
    ];

    validations.forEach(validation => {
        if (!validation.value) {
            showFieldError(validation.field, validation.message);
            isValid = false;
        }
    });

    // Email validation
    if (data.email && !isValidEmail(data.email)) {
        showFieldError('email', 'Please enter a valid email address.');
        isValid = false;
    }

    // Password validation
    if (data.password && data.password.length < 8) {
        showFieldError('password', 'Password must be at least 8 characters long.');
        isValid = false;
    }

    return isValid;
}

/*
 * FORM ENHANCEMENTS
 * Modern form interactions and animations
 */
function initializeFormEnhancements() {
    const formInputs = document.querySelectorAll('.form-input');

    formInputs.forEach(input => {
        // Enhanced focus/blur effects
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
            this.parentElement.classList.remove('error');
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');

            // Add filled class if input has value
            if (this.value.trim()) {
                this.parentElement.classList.add('filled');
            } else {
                this.parentElement.classList.remove('filled');
            }

            // Real-time validation
            validateField(this);
        });

        // Input animation on typing
        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.parentElement.classList.add('filled');
            } else {
                this.parentElement.classList.remove('filled');
            }

            // Clear previous errors while typing
            this.parentElement.classList.remove('error');
        });

        // Check initial state
        if (input.value.trim()) {
            input.parentElement.classList.add('filled');
        }
    });
}

/*
 * SCROLL EFFECTS
 * Enhanced scrolling animations and header effects
 */
function initializeScrollEffects() {
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;

        // Header background opacity based on scroll
        if (currentScrollY > 50) {
            header.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #0891b2 100%)';
            header.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
        } else {
            header.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #0891b2 100%)';
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }

        // Hide/show header on scroll direction
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;

        // Animate elements on scroll into view
        animateOnScroll();
    });
}

/*
 * PARALLAX EFFECTS
 * Subtle parallax scrolling for modern feel
 */
function initializeParallaxEffects() {
    const heroPattern = document.querySelector('.hero-pattern');

    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;

        if (heroPattern) {
            heroPattern.style.transform = `translateY(${rate}px)`;
        }
    });
}

/*
 * SCROLL ANIMATIONS
 * Animate elements when they come into view
 */
function animateOnScroll() {
    const elements = document.querySelectorAll('.feature-card, .trust-card, .benefit-item');

    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animate-in');
        }
    });
}

/*
 * ENHANCED SMOOTH SCROLLING
 * Improved smooth scrolling with easing
 */
function initializeSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();

                // Add ripple effect
                createRippleEffect(this, e);

                // Calculate offset for sticky header
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;

                // Smooth scroll with easing
                smoothScrollTo(targetPosition, 1000);
            }
        });
    });
}

/*
 * UTILITY FUNCTIONS
 */

// Enhanced email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Field validation
function validateField(input) {
    const value = input.value.trim();
    const type = input.type;
    const name = input.name;

    if (type === 'email' && value && !isValidEmail(value)) {
        showFieldError(name, 'Please enter a valid email address.');
        return false;
    }

    if (type === 'password' && value && value.length < 8) {
        showFieldError(name, 'Password must be at least 8 characters long.');
        return false;
    }

    return true;
}

// Show field-specific error
function showFieldError(fieldName, message) {
    const input = document.querySelector(`[name="${fieldName}"]`);
    if (input) {
        input.parentElement.classList.add('error');

        // Create or update error message
        let errorElement = input.parentElement.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            input.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = message;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorElement && errorElement.parentNode) {
                errorElement.remove();
                input.parentElement.classList.remove('error');
            }
        }, 5000);
    }
}

// Switch to login tab with animation
function switchToLoginTab() {
    const loginTab = document.querySelector('.tab-btn[data-tab="login"]');
    if (loginTab) {
        loginTab.click();
    }
}

// Enhanced message display with animations
function showMessage(message, type = 'info') {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    // Clear existing messages
    messagesContainer.innerHTML = '';

    // Create message element with animation
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(-10px)';

    // Add message to container
    messagesContainer.appendChild(messageElement);

    // Animate in
    setTimeout(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    }, 100);

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.opacity = '0';
                messageElement.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.remove();
                    }
                }, 300);
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

    // Clear field errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.input-wrapper').forEach(wrapper => wrapper.classList.remove('error'));
}

// Reset form labels after form reset
function resetFormLabels() {
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        wrapper.classList.remove('filled', 'focused', 'error');
    });
}

// Shake animation for forms
function shakeForm(form) {
    form.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        form.style.animation = '';
    }, 500);
}

// Ripple effect for buttons
function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.remove();
        }
    }, 600);
}

// Smooth scroll with easing
function smoothScrollTo(target, duration) {
    const start = window.pageYOffset;
    const distance = target - start;
    let startTime = null;

    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, start, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    requestAnimationFrame(animation);
}

/*
 * URL PARAMETER HANDLING
 * Enhanced with animations
 */
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Handle registration success
    if (urlParams.get('register') === 'success') {
        setTimeout(() => {
            showMessage('Registration successful! Please sign in with your credentials.', 'success');
            switchToLoginTab();
        }, 500);
    }

    // Handle login errors
    if (urlParams.get('error') === 'true') {
        setTimeout(() => {
            showMessage('Invalid email or password. Please try again.', 'error');
            switchToLoginTab();
        }, 500);
    }

    // Handle OAuth errors
    if (urlParams.get('error') === 'oauth') {
        setTimeout(() => {
            showMessage('OAuth authentication failed. Please try again or use email/password.', 'error');
            switchToLoginTab();
        }, 500);
    }

    // Handle logout message
    if (urlParams.get('logout') === 'true') {
        setTimeout(() => {
            showMessage('You have been successfully signed out.', 'success');
        }, 500);
    }

    // Clean URL parameters after handling
    if (urlParams.toString()) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}

/*
 * ADDITIONAL FORM VALIDATION
 * Real-time validation with enhanced UX
 */
function initializeFormValidation() {
    const emailInputs = document.querySelectorAll('input[type="email"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    // Email validation with visual feedback
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value && !isValidEmail(this.value)) {
                this.parentElement.classList.add('error');
            } else {
                this.parentElement.classList.remove('error');
            }
        });

        input.addEventListener('input', function() {
            this.parentElement.classList.remove('error');
        });
    });

    // Password strength indicator
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            updatePasswordStrength(this, strength);
        });
    });
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/)) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;
    return score;
}

// Update password strength indicator
function updatePasswordStrength(input, strength) {
    let indicator = input.parentElement.querySelector('.password-strength');
    if (!indicator && input.value.length > 0) {
        indicator = document.createElement('div');
        indicator.className = 'password-strength';
        input.parentElement.appendChild(indicator);
    }

    if (indicator && input.value.length === 0) {
        indicator.remove();
        return;
    }

    if (indicator) {
        const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const strengthColors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'];

        indicator.textContent = strengthLevels[strength - 1] || 'Very Weak';
        indicator.style.color = strengthColors[strength - 1] || strengthColors[0];
        indicator.style.fontSize = '0.75rem';
        indicator.style.marginTop = '0.25rem';
    }
}

/*
 * GOOGLE OAUTH BUTTON ENHANCEMENT
 * Enhanced loading states and animations
 */
document.addEventListener('DOMContentLoaded', function() {
    const googleButtons = document.querySelectorAll('.btn-google');

    googleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add ripple effect
            createRippleEffect(this, e);

            // Add loading state
            this.style.opacity = '0.8';
            this.style.pointerEvents = 'none';

            // Create loading animation
            const originalContent = this.innerHTML;
            this.innerHTML = `
                <span class="loading-spinner"></span>
                <span>Connecting to Google...</span>
            `;

            // Reset after timeout in case of error
            setTimeout(() => {
                this.innerHTML = originalContent;
                this.style.opacity = '';
                this.style.pointerEvents = '';
            }, 10000);
        });
    });
});

/*
 * KEYBOARD ACCESSIBILITY
 * Enhanced keyboard navigation
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

    // Handle Tab key for better focus management
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

// Remove keyboard navigation class on mouse use
document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});

/*
 * DEVELOPMENT HELPERS
 * Console logging for development
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🚀 PersonalFinance Modern Landing Page Loaded');
    console.log('✨ Enhanced features:', {
        animations: 'Scroll, parallax, ripple effects',
        forms: 'Real-time validation, floating labels',
        interactions: 'Tab switching, smooth scrolling',
        accessibility: 'Keyboard navigation, focus management'
    });
}