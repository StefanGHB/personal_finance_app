/*
 * PERSONAL FINANCE - COMPLETE LANDING PAGE JAVASCRIPT
 * Final version with clean password validation and email confirmation
 */

// ==========================================
// CORE INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeFormHandlers();
    initializeSmoothScrolling();
    initializeFormEnhancements();
    initializeScrollEffects();
    initializeParallaxEffects();
    handleURLParameters();

    // Initialize clean password validation
    setTimeout(() => {
        initializeCleanPasswordValidation();
        console.log('✅ All systems initialized');
    }, 200);
});

// ==========================================
// TAB SWITCHING FUNCTIONALITY
// ==========================================

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

// ==========================================
// FORM HANDLERS
// ==========================================

function initializeFormHandlers() {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.querySelector('.auth-form[action="/login"]');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleRegistration(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonContent = submitButton.innerHTML;

    console.log('🚀 Registration started');

    const formData = {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value
    };

    console.log('📝 Form data collected:', { ...formData, password: '[HIDDEN]' });

    if (!validateRegistrationFormEnhanced(formData)) {
        console.log('❌ Validation failed');
        return;
    }

    console.log('✅ Validation passed');

    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="loading-spinner"></span>
        <span>Creating Account...</span>
    `;
    submitButton.classList.add('loading');

    try {
        console.log('🌐 Sending request to backend...');

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        console.log('📡 Response received:', response.status);

        const data = await response.json();
        console.log('📄 Response data:', data);

        if (data.success) {
            console.log('✅ Registration successful!');

            submitButton.innerHTML = `
                <span>✓</span>
                <span>Account Created!</span>
            `;
            submitButton.classList.add('success');

            if (data.emailSent) {
                showCompactEmailConfirmation(data.email);
            } else {
                showMessage(data.message || 'Account created successfully!', 'success');
            }

            // ИЗЧИСТВАМЕ ФОРМАТА при успех
            form.reset();
            resetFormLabels();

        } else {
            console.log('❌ Registration failed:', data.error);
            showMessage(data.error || 'Registration failed. Please try again.', 'error');
            shakeForm(form);

            // ИЗЧИСТВАМЕ ФОРМАТА при грешка
            form.reset();
            resetFormLabels();
        }

    } catch (error) {
        console.error('💥 Network error:', error);
        showMessage('Network connection error. Please check your internet connection and try again.', 'error');
        shakeForm(form);

        // ИЗЧИСТВАМЕ ФОРМАТА при грешка
        form.reset();
        resetFormLabels();
    } finally {
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonContent;
            submitButton.classList.remove('loading', 'success');
        }, 2000);
    }
}

// ==========================================
// CLEAN PASSWORD VALIDATION SYSTEM
// ==========================================

function validatePassword(password) {
    console.log('🔐 validatePassword called with:', password ? `"${password}" (length: ${password.length})` : 'empty password');

    if (!password) {
        console.log('❌ Password is empty');
        return { valid: false, message: 'Password is required', level: 'empty' };
    }

    const length = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    console.log('🔐 Password checks:', {
        length: length,
        hasUpper: hasUpper,
        hasLower: hasLower,
        hasNumber: hasNumber,
        hasSpecial: hasSpecial
    });

    // Length check first
    if (length < 8) {
        console.log('❌ Password too short');
        return {
            valid: false,
            message: `Password must be at least 8 characters (${8 - length} more needed)`,
            level: 'invalid'
        };
    }

    // Format requirements
    const requirements = [hasUpper, hasLower, hasNumber, hasSpecial];
    const metCount = requirements.filter(Boolean).length;

    console.log('🔐 Met requirements count:', metCount);

    if (metCount < 3) {
        const missing = [];
        if (!hasUpper) missing.push('uppercase letter');
        if (!hasLower) missing.push('lowercase letter');
        if (!hasNumber) missing.push('number');
        if (!hasSpecial) missing.push('special character');

        console.log('❌ Not enough requirements met. Missing:', missing);
        return {
            valid: false,
            message: `Add: ${missing.slice(0, 2).join(', ')}`,
            level: 'weak'
        };
    }

    // Calculate strength score
    let score = 0;
    if (length >= 8) score += 25;
    if (length >= 12) score += 20;
    score += metCount * 15;

    // Penalties
    if (/(.)\1{2,}/.test(password)) score -= 15;
    if (/123|abc|password|admin/i.test(password)) score -= 20;

    // Determine level
    let level = 'fair';
    let message = 'Password strength: acceptable';

    if (score >= 80) {
        level = 'excellent';
        message = 'Password strength: excellent';
    } else if (score >= 65) {
        level = 'good';
        message = 'Password strength: strong';
    } else if (score < 45) {
        level = 'weak';
        message = 'Password strength: weak';
    }

    console.log('✅ Password validation passed:', { level, message, score });
    return { valid: true, message, level, score };
}

function createPasswordTooltip(input) {
    const tooltipId = 'password-tooltip-' + Math.random().toString(36).substr(2, 9);

    const tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.className = 'password-tooltip hidden';
    tooltip.innerHTML = `
        <div class="tooltip-content">
            <div class="strength-indicator">
                <div class="strength-bar-mini"></div>
            </div>
            <div class="strength-message">Enter password...</div>
            <div class="requirements-compact">
                <span class="req" data-req="length">8+ chars</span>
                <span class="req" data-req="upper">A-Z</span>
                <span class="req" data-req="lower">a-z</span>
                <span class="req" data-req="number">0-9</span>
                <span class="req" data-req="special">!@#</span>
            </div>
        </div>
        <div class="tooltip-arrow"></div>
    `;

    document.body.appendChild(tooltip);

    // Position tooltip
    function positionTooltip() {
        const rect = input.getBoundingClientRect();
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;

        tooltip.style.position = 'absolute';
        tooltip.style.left = (rect.left + scrollX) + 'px';
        tooltip.style.top = (rect.bottom + scrollY + 8) + 'px';
        tooltip.style.zIndex = '10000';
    }

    input.addEventListener('focus', () => {
        positionTooltip();
        tooltip.classList.remove('hidden');
        tooltip.classList.add('visible');
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            tooltip.classList.remove('visible');
            tooltip.classList.add('hidden');
        }, 150);
    });

    input.addEventListener('input', () => {
        updatePasswordTooltip(tooltip, input.value);
    });

    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip);

    return tooltip;
}

function updatePasswordTooltip(tooltip, password) {
    const validation = validatePassword(password);
    const strengthBar = tooltip.querySelector('.strength-bar-mini');
    const strengthMessage = tooltip.querySelector('.strength-message');
    const requirements = tooltip.querySelectorAll('.req');

    // Update strength bar
    let progress = 0;
    let barClass = 'empty';

    if (validation.level === 'invalid') {
        progress = Math.min(40, (password.length / 8) * 40);
        barClass = 'invalid';
    } else if (validation.level === 'weak') {
        progress = 45;
        barClass = 'weak';
    } else if (validation.level === 'fair') {
        progress = 65;
        barClass = 'fair';
    } else if (validation.level === 'good') {
        progress = 80;
        barClass = 'good';
    } else if (validation.level === 'excellent') {
        progress = 100;
        barClass = 'excellent';
    }

    strengthBar.style.width = progress + '%';
    strengthBar.className = `strength-bar-mini ${barClass}`;
    strengthMessage.textContent = validation.message;
    strengthMessage.className = `strength-message ${validation.level}`;

    // Update individual requirements
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasLength = password.length >= 8;

    const checks = {
        length: hasLength,
        upper: hasUpper,
        lower: hasLower,
        number: hasNumber,
        special: hasSpecial
    };

    requirements.forEach(req => {
        const type = req.dataset.req;
        const isMet = checks[type];

        req.classList.remove('met', 'unmet');
        req.classList.add(isMet ? 'met' : 'unmet');
    });

    // Update input styling
    const currentInput = document.querySelector('input[type="password"]:focus');
    if (currentInput) {
        const wrapper = currentInput.closest('.input-wrapper');
        if (wrapper) {
            wrapper.classList.remove('password-empty', 'password-invalid', 'password-weak', 'password-fair', 'password-good', 'password-excellent');
            wrapper.classList.add(`password-${validation.level}`);
        }
    }
}

function validatePasswordField(input) {
    console.log('🔐 validatePasswordField called');
    const password = input.value;
    console.log('🔐 Input password value:', password ? `"${password}"` : 'empty');

    const validation = validatePassword(password);
    console.log('🔐 Password validation result:', validation);

    // Clear existing errors
    const wrapper = input.closest('.input-wrapper') || input.parentElement;
    const existingError = wrapper.querySelector('.field-error');
    if (existingError) existingError.remove();
    wrapper.classList.remove('has-error');

    if (!validation.valid) {
        console.log('❌ Password validation failed, showing error:', validation.message);
        // Show error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = validation.message;
        wrapper.appendChild(errorDiv);
        wrapper.classList.add('has-error');
        return false;
    }

    console.log('✅ Password validation passed');
    return true;
}

function initializeCleanPasswordValidation() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    passwordInputs.forEach(input => {
        createPasswordTooltip(input);

        input.addEventListener('blur', () => {
            if (input.value) {
                validatePasswordField(input);
            }
        });
    });

    console.log('✅ Password validation initialized');
}

// ==========================================
// COMPACT EMAIL CONFIRMATION
// ==========================================

function showCompactEmailConfirmation(email) {
    clearMessages();

    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="notification-icon">✓</div>
        <div class="notification-content">
            <strong>Account created!</strong> Check ${email} to activate.
        </div>
        <div class="notification-close">×</div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 6000);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
}

// ==========================================
// FORM ENHANCEMENTS
// ==========================================

function initializeFormEnhancements() {
    const formInputs = document.querySelectorAll('.form-input');

    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
            this.parentElement.classList.remove('error');
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');

            if (this.value.trim()) {
                this.parentElement.classList.add('filled');
            } else {
                this.parentElement.classList.remove('filled');
            }

            validateField(this);
        });

        input.addEventListener('input', function() {
            if (this.value.trim()) {
                this.parentElement.classList.add('filled');
            } else {
                this.parentElement.classList.remove('filled');
            }

            this.parentElement.classList.remove('error');
        });

        if (input.value.trim()) {
            input.parentElement.classList.add('filled');
        }
    });

    // Инициализирай real-time email валидация
    initializeRealTimeEmailValidation();
}
// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

// ЗАМЕНИ ТАЗИ ФУНКЦИЯ В LANDING.JS
// Намери функцията validateRegistrationForm и замени я с тази:

// ЗАМЕНИ validateRegistrationForm функцията с тази:

function validateRegistrationForm(data) {
    console.log('🔍 Starting validation with data:', data);
    clearMessages();
    let isValid = true;

    // Basic field validation
    const validations = [
        { field: 'firstName', value: data.firstName, message: 'First name is required' },
        { field: 'lastName', value: data.lastName, message: 'Last name is required' },
        { field: 'email', value: data.email, message: 'Email is required' }
    ];

    validations.forEach(validation => {
        console.log(`🔍 Checking ${validation.field}:`, validation.value);
        if (!validation.value) {
            console.log(`❌ ${validation.field} is empty`);
            showFieldError(validation.field, validation.message);
            isValid = false;
        } else {
            console.log(`✅ ${validation.field} is OK`);
        }
    });

    // Email validation
    if (data.email) {
        console.log('🔍 Validating email:', data.email);
        if (!isValidEmail(data.email)) {
            console.log('❌ Email format invalid');
            showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        } else {
            console.log('✅ Email format OK');
        }
    }

    // FIXED Password validation - use the data directly instead of DOM element
    console.log('🔍 Checking password...');
    if (!data.password) {
        console.log('❌ Password is empty');
        showFieldError('password', 'Password is required');
        isValid = false;
    } else {
        console.log('🔍 Password provided, validating directly...');
        const passwordValidation = validatePassword(data.password);
        console.log('🔍 Password validation result:', passwordValidation);

        if (!passwordValidation.valid) {
            console.log('❌ Password validation failed:', passwordValidation.message);
            showFieldError('password', passwordValidation.message);
            isValid = false;
        } else {
            console.log('✅ Password validation passed');
        }
    }

    console.log('🔍 Final validation result:', isValid);
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateField(input) {
    const value = input.value.trim();
    const type = input.type;
    const name = input.name;

    if (type === 'email' && value && !isValidEmail(value)) {
        showFieldError(name, 'Please enter a valid email address');
        return false;
    }

    if (type === 'password' && value) {
        return validatePasswordField(input);
    }

    return true;
}

// НАМЕРИ СЪЩЕСТВУВАЩАТА showFieldError функция И Я ЗАМЕНИ С:
function showFieldError(fieldName, message) {
    console.log('🚫 Showing field error for:', fieldName, 'Message:', message);

    const input = document.querySelector(`[name="${fieldName}"]`);
    if (!input) {
        console.log('❌ Input field not found:', fieldName);
        return;
    }

    const wrapper = input.closest('.input-wrapper') || input.parentElement;
    if (!wrapper) {
        console.log('❌ Input wrapper not found for:', fieldName);
        return;
    }

    // Remove existing error
    const existingError = wrapper.querySelector('.field-error');
    if (existingError) {
        console.log('🔄 Removing existing error for:', fieldName);
        existingError.remove();
    }
    wrapper.classList.remove('has-error', 'error');

    // Add new error
    wrapper.classList.add('has-error');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;

    // Insert after the input wrapper
    wrapper.appendChild(errorDiv);

    console.log('✅ Field error added for:', fieldName);

    // Add red border to input
    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.remove();
            wrapper.classList.remove('has-error', 'error');
            input.style.borderColor = '';
            input.style.boxShadow = '';
            console.log('🔄 Auto-removed error for:', fieldName);
        }
    }, 10000);
}

// ==========================================
// SCROLL EFFECTS
// ==========================================

function initializeScrollEffects() {
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 50) {
            header.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #0891b2 100%)';
            header.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
        } else {
            header.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #0891b2 100%)';
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
        animateOnScroll();
    });
}

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

// ==========================================
// SMOOTH SCROLLING
// ==========================================

function initializeSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();
                createRippleEffect(this, e);

                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;

                smoothScrollTo(targetPosition, 1000);
            }
        });
    });
}

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

// ==========================================
// URL PARAMETER HANDLING
// ==========================================

function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Email confirmation success
    if (urlParams.get('confirmed') === 'true') {
        setTimeout(() => {
            showMessage('🎉 Email confirmed successfully! Your account is now active.', 'success');
        }, 500);
    }

    // Registration success
    if (urlParams.get('register') === 'success') {
        setTimeout(() => {
            showMessage('Registration successful! Please check your email to confirm your account.', 'info');
            switchToLoginTab();
        }, 500);
    }

    // Handle various error types
    const errorType = urlParams.get('error');
    const isLogoutForced = urlParams.get('logout') === 'forced';

    if (errorType) {
        setTimeout(() => {
            let message = '';
            let type = 'error';

            switch (errorType) {
                case 'user_deleted':
                    message = '⚠️ Your account was deleted. Please contact support if this was not intended.';
                    type = 'error';
                    break;

                case 'account_invalid':
                    message = '⚠️ Your account is disabled or email not verified. Please contact support.';
                    type = 'error';
                    break;

                case 'user_not_found':
                    message = '⚠️ User account not found. Please log in again.';
                    type = 'error';
                    break;

                case 'validation_error':
                    message = '⚠️ Account validation failed. Please log in again.';
                    type = 'error';
                    break;

                case 'account_disabled':
                    message = '⚠️ Your account has been disabled. Please contact support.';
                    type = 'error';
                    break;

                case 'email_not_verified':
                    message = '⚠️ Please verify your email address before continuing.';
                    type = 'warning';
                    break;

                case 'invalid_token':
                    message = 'Invalid or expired confirmation link. Please request a new one.';
                    type = 'error';
                    break;

                case 'confirmation_failed':
                    message = 'Email confirmation failed. Please try again or contact support.';
                    type = 'error';
                    break;

                case 'oauth':
                    message = 'OAuth authentication failed. Please try again or use email/password.';
                    type = 'error';
                    break;

                case 'logout_failed':
                    message = 'Logout process failed. Please clear your browser data and try again.';
                    type = 'error';
                    break;

                case 'true':
                default:
                    if (isLogoutForced) {
                        message = '⚠️ You were automatically logged out due to account changes.';
                        type = 'warning';
                    } else {
                        message = 'Invalid email or password. Please try again.';
                        type = 'error';
                    }
                    break;
            }

            showMessage(message, type);

            // Always switch to login tab for errors
            if (type === 'error' || type === 'warning') {
                switchToLoginTab();
            }
        }, 500);
    }

    // Regular logout success
    if (urlParams.get('logout') === 'true' && !isLogoutForced) {
        setTimeout(() => {
            showMessage('You have been successfully signed out.', 'success');
        }, 500);
    }

    // Clean URL after processing parameters
    if (urlParams.toString()) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
}
// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function switchToLoginTab() {
    const loginTab = document.querySelector('.tab-btn[data-tab="login"]');
    if (loginTab) {
        loginTab.click();
    }
}

function showMessage(message, type = 'info', autoHide = true) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;

    if (typeof message === 'string') {
        messageElement.textContent = message;
    } else {
        messageElement.innerHTML = message;
    }

    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(-10px)';

    messagesContainer.appendChild(messageElement);

    setTimeout(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    }, 100);

    if (autoHide && type === 'success') {
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

    messagesContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearMessages() {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }

    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        wrapper.classList.remove('error', 'has-error');
    });
}

function resetFormLabels() {
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        wrapper.classList.remove('filled', 'focused', 'error', 'has-error');
    });
}

function shakeForm(form) {
    form.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        form.style.animation = '';
    }, 500);
}

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

// ==========================================
// GOOGLE OAUTH ENHANCEMENTS
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    const googleButtons = document.querySelectorAll('.btn-google');

    googleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            createRippleEffect(this, e);

            this.style.opacity = '0.8';
            this.style.pointerEvents = 'none';

            const originalContent = this.innerHTML;
            this.innerHTML = `
                <span class="loading-spinner"></span>
                <span>Connecting to Google...</span>
            `;

            setTimeout(() => {
                this.innerHTML = originalContent;
                this.style.opacity = '';
                this.style.pointerEvents = '';
            }, 10000);
        });
    });
});

// ==========================================
// KEYBOARD ACCESSIBILITY
// ==========================================

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('tab-btn')) {
        e.target.click();
    }

    if (e.key === 'Escape') {
        clearMessages();
    }

    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});

// ==========================================
// DEVELOPMENT HELPERS
// ==========================================

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🚀 PersonalFinance Complete Landing Page Loaded');
    console.log('✨ Features:', {
        'Clean Password Validation': 'Length + Format validation',
        'Floating Tooltip': 'Non-intrusive requirements display',
        'Compact Notifications': 'Elegant email confirmations',
        'Form Validation': 'Real-time field validation',
        'Accessibility': 'Keyboard navigation, focus management'
    });
}

// ==========================================
// НОВИ ФУНКЦИИ ЗА LOGIN ERROR HANDLING
// ДОБАВИ ТЕЗИ В КРАЯ НА landing.js
// ==========================================
async function handleLogin(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonContent = submitButton.innerHTML;

    console.log('🔐 Login started');

    // Get form data
    const formData = new FormData(form);
    const email = formData.get('email').trim();
    const password = formData.get('password');

    console.log('📝 Login data collected:', { email: email, password: '[HIDDEN]' });

    // Clear previous errors
    clearMessages();
    clearFieldErrors();

    // Basic validation
    if (!email) {
        showLoginError('Email is required');
        return;
    }

    if (!password) {
        showLoginError('Password is required');
        return;
    }

    // Show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="loading-spinner"></span>
        <span>Signing In...</span>
    `;
    submitButton.classList.add('loading');

    try {
        console.log('🌐 Submitting login via AJAX...');

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
            redirect: 'manual'
        });

        console.log('📡 Response status:', response.status);

        if (response.type === 'opaqueredirect' || response.status === 0) {
            console.log('🔄 Redirect detected, checking destination...');

            const authCheckResponse = await fetch('/api/auth/current-user');
            const authData = await authCheckResponse.json();

            if (authData.authenticated) {
                console.log('✅ Login successful!');

                submitButton.innerHTML = `
                    <span>✓</span>
                    <span>Success!</span>
                `;
                submitButton.classList.add('success');

                // ИЗЧИСТВАМЕ ФОРМАТА при успех
                form.reset();
                resetFormLabels();

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
                return;
            }
        }

        // При всякаква грешка - показваме същото съобщение
        console.log('❌ Login failed');
        showLoginError('Invalid email or password!');

        // ИЗЧИСТВАМЕ ФОРМАТА при грешка
        form.reset();
        resetFormLabels();

    } catch (error) {
        console.error('💥 Network error during login:', error);
        showLoginError('Connection error. Please try again.');

        // ИЗЧИСТВАМЕ ФОРМАТА при грешка
        form.reset();
        resetFormLabels();
    } finally {
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonContent;
            submitButton.classList.remove('loading', 'success');
        }, 2000);
    }
}


function showLoginError(message) {
    console.log('🚫 Showing login error:', message);

    // Намери login tab-a
    const loginTab = document.getElementById('login-tab');
    if (!loginTab) return;

    // Намери submit button-а
    const submitButton = loginTab.querySelector('.btn-auth');
    if (!submitButton) return;

    // Премахни съществуващи error съобщения
    const existingError = loginTab.querySelector('.login-error-message');
    if (existingError) {
        existingError.remove();
    }

    // Създай ново error съобщение
    const errorDiv = document.createElement('div');
    errorDiv.className = 'login-error-message';
    errorDiv.textContent = message;

    // Вмъкни ПРЕДИ submit button-а
    submitButton.parentNode.insertBefore(errorDiv, submitButton);

    // Анимация
    errorDiv.style.opacity = '0';
    errorDiv.style.transform = 'translateY(-10px)';

    setTimeout(() => {
        errorDiv.style.opacity = '1';
        errorDiv.style.transform = 'translateY(0)';
    }, 100);

    // Auto-remove след 8 секунди
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.style.opacity = '0';
            errorDiv.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (errorDiv && errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 300);
        }
    }, 8000);

    // Shake ефект на формата
    const form = loginTab.querySelector('.auth-form');
    if (form) {
        shakeForm(form);
    }
}


function showDetailedError(title, suggestion, errorType, showResendButton = false) {
    console.log('📋 Showing detailed error:', { title, suggestion, errorType });

    // Create detailed error notification
    const notification = document.createElement('div');
    notification.className = 'detailed-error-notification';
    notification.innerHTML = `
        <div class="error-header">
            <div class="error-icon">⚠️</div>
            <div class="error-title">${title}</div>
            <div class="error-close">×</div>
        </div>
        <div class="error-content">
            <p>${suggestion}</p>
            ${showResendButton ? `
                <button class="btn-resend-verification" onclick="handleResendVerification()">
                    Resend Verification Email
                </button>
            ` : ''}
        </div>
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 10000);

    // Close button
    notification.querySelector('.error-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

async function handleResendVerification() {
    try {
        const emailInput = document.querySelector('[name="email"]');
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email) {
            showMessage('Please enter your email address first.', 'error');
            return;
        }

        console.log('📧 Resending verification email to:', email);

        const response = await fetch('/api/auth/resend-confirmation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('✅ Verification email sent! Please check your inbox.', 'success');

            // Close detailed error notification
            const notification = document.querySelector('.detailed-error-notification');
            if (notification) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        } else {
            showMessage(data.error || 'Failed to send verification email. Please try again.', 'error');
        }

    } catch (error) {
        console.error('💥 Error resending verification:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

function clearFieldErrors() {
    console.log('🧹 Clearing all field errors');

    // Clear all field errors
    document.querySelectorAll('.field-error').forEach(error => {
        console.log('🧹 Removing field error:', error.textContent);
        error.remove();
    });

    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        wrapper.classList.remove('error', 'has-error');
    });

    // Reset input styles
    document.querySelectorAll('.form-input').forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
    });

    // Clear detailed error notifications
    document.querySelectorAll('.detailed-error-notification').forEach(notification => {
        notification.remove();
    });

    console.log('✅ All field errors cleared');
}

// Подобрена showFieldError функция
function showFieldErrorEnhanced(fieldName, message) {
    const input = document.querySelector(`[name="${fieldName}"]`);
    if (input) {
        const wrapper = input.closest('.input-wrapper') || input.parentElement;

        // Remove existing error
        const existingError = wrapper.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        wrapper.classList.remove('has-error');

        // Add new error
        wrapper.classList.add('has-error');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        wrapper.appendChild(errorDiv);

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.remove();
                wrapper.classList.remove('has-error');
            }
        }, 8000);
    }
}


function validateRegistrationFormEnhanced(data) {
    console.log('🔍 Starting enhanced validation with data:', data);
    clearMessages();
    clearFieldErrors();
    let isValid = true;

    // First Name validation
    if (!data.firstName) {
        console.log('❌ First name is empty');
        showFieldError('firstName', 'First name is required');
        isValid = false;
    } else if (data.firstName.length < 2) {
        console.log('❌ First name too short');
        showFieldError('firstName', 'First name must be at least 2 characters');
        isValid = false;
    } else {
        console.log('✅ First name is valid');
    }

    // Last Name validation
    if (!data.lastName) {
        console.log('❌ Last name is empty');
        showFieldError('lastName', 'Last name is required');
        isValid = false;
    } else if (data.lastName.length < 2) {
        console.log('❌ Last name too short');
        showFieldError('lastName', 'Last name must be at least 2 characters');
        isValid = false;
    } else {
        console.log('✅ Last name is valid');
    }

    // ПЪЛНА Email validation с всички проверки
    if (!data.email) {
        console.log('❌ Email is empty');
        showFieldError('email', 'Email address is required');
        isValid = false;
    } else {
        console.log('🔍 Validating email:', data.email);

        // 1. Основна format проверка
        if (!isValidEmailFormat(data.email)) {
            console.log('❌ Email format invalid');
            showFieldError('email', 'Invalid email address');
            isValid = false;
        } else {
            // 2. Проверка за disposable email domains
            const domain = data.email.split('@')[1]?.toLowerCase();
            const disposableDomains = [
                '10minutemail.com', 'temp-mail.org', 'guerrillamail.com',
                'mailinator.com', 'throwaway.email', 'yopmail.com',
                'tempmail.com', 'sharklasers.com', '0-mail.com',
                'maildrop.cc', 'guerrillamailblock.com', 'fakeinbox.com'
            ];

            if (disposableDomains.includes(domain)) {
                console.log('❌ Disposable email detected');
                showFieldError('email', 'Invalid email address');
                isValid = false;
            } else {
                // 3. Проверка за common typos
                const suggestions = getEmailSuggestion(data.email);
                if (suggestions) {
                    console.log('⚠️ Email typo detected, suggesting:', suggestions);
                    showFieldError('email', 'Invalid email address');
                    isValid = false;
                } else {
                    // 4. Проверка за много къси или странни домейни
                    const domainParts = domain.split('.');
                    const tld = domainParts[domainParts.length - 1];

                    if (tld.length < 2 || domainParts.length < 2) {
                        console.log('❌ Email domain too short or invalid');
                        showFieldError('email', 'Invalid email address');
                        isValid = false;
                    } else {
                        console.log('✅ Email is valid');
                    }
                }
            }
        }
    }

    // Password validation (остава същата)
    if (!data.password) {
        console.log('❌ Password is empty');
        showFieldError('password', 'Password is required');
        isValid = false;
    } else {
        const passwordValidation = validatePassword(data.password);
        if (!passwordValidation.valid) {
            console.log('❌ Password validation failed:', passwordValidation.message);
            showFieldError('password', passwordValidation.message);
            isValid = false;
        } else {
            console.log('✅ Password is valid');
        }
    }

    console.log('🔍 Final validation result:', isValid);
    return isValid;
}


// ==========================================
// НОВИ: EMAIL VALIDATION HELPERS
// ==========================================

function isValidEmailFormat(email) {
    console.log('🔍 Checking email format for:', email);

    if (!email || typeof email !== 'string') {
        console.log('❌ Email is empty or not string');
        return false;
    }

    email = email.trim();

    // Базови проверки
    if (email.length > 254) {
        console.log('❌ Email too long');
        return false;
    }

    if (!email.includes('@')) {
        console.log('❌ Email missing @ symbol');
        return false;
    }

    const parts = email.split('@');
    if (parts.length !== 2) {
        console.log('❌ Email has wrong number of @ symbols');
        return false;
    }

    const [localPart, domain] = parts;

    // Local part проверки
    if (!localPart || localPart.length === 0 || localPart.length > 64) {
        console.log('❌ Email local part invalid length');
        return false;
    }

    // Domain проверки
    if (!domain || domain.length === 0 || domain.length > 253) {
        console.log('❌ Email domain invalid length');
        return false;
    }

    if (!domain.includes('.')) {
        console.log('❌ Email domain missing dot');
        return false;
    }

    // Проверка че domain не започва/завършва с точка или тире
    if (domain.startsWith('.') || domain.endsWith('.') ||
        domain.startsWith('-') || domain.endsWith('-')) {
        console.log('❌ Email domain invalid start/end');
        return false;
    }

    // Проверка че има валиден TLD
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
        console.log('❌ Email domain invalid TLD');
        return false;
    }

    // Проверка за .test, .invalid, .localhost и други невалидни TLDs
    const invalidTlds = ['test', 'invalid', 'localhost', 'local', 'example'];
    if (invalidTlds.includes(tld.toLowerCase())) {
        console.log('❌ Email domain uses invalid TLD');
        return false;
    }

    // Final regex проверка
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    const isValid = emailRegex.test(email);
    console.log('🔍 Email regex test result:', isValid);

    return isValid;
}

function getEmailSuggestion(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    const suggestions = {
        // Gmail typos
        'gmail.comm': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'gmail.co': 'gmail.com',
        'gamil.com': 'gmail.com',
        'gmaill.com': 'gmail.com',

        // Yahoo typos
        'yahooo.com': 'yahoo.com',
        'yahoo.co': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        'yhoo.com': 'yahoo.com',

        // Outlook typos
        'outlok.com': 'outlook.com',
        'outlook.co': 'outlook.com',
        'outloook.com': 'outlook.com',

        // Hotmail typos
        'hotmial.com': 'hotmail.com',
        'hotmail.co': 'hotmail.com',
        'hotmial.co': 'hotmail.com',

        // Bulgarian domains
        'abv.gb': 'abv.bg',
        'abv.b': 'abv.bg',
        'mail.gb': 'mail.bg',
        'mail.b': 'mail.bg',

        // Common misspellings
        'gmai.bg': 'gmail.com',
        'test.com': null, // Don't suggest anything for test domains
        'example.com': null,
        'localhost': null
    };

    if (suggestions.hasOwnProperty(domain)) {
        return suggestions[domain] ? email.replace(domain, suggestions[domain]) : null;
    }

    return null;
}

function isValidEmailFormat(email) {
    console.log('🔍 Checking email format for:', email);

    if (!email || typeof email !== 'string') {
        return false;
    }

    email = email.trim();

    if (email.length > 254 || !email.includes('@')) {
        return false;
    }

    const parts = email.split('@');
    if (parts.length !== 2) {
        return false;
    }

    const [localPart, domain] = parts;

    if (!localPart || localPart.length === 0 || localPart.length > 64) {
        return false;
    }

    if (!domain || domain.length === 0 || domain.length > 253 || !domain.includes('.')) {
        return false;
    }

    if (domain.startsWith('.') || domain.endsWith('.') ||
        domain.startsWith('-') || domain.endsWith('-')) {
        return false;
    }

    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
        return false;
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(email);
}

function getEmailSuggestion(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    const suggestions = {
        'gmail.comm': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'gmail.co': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'yahoo.co': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        'outlok.com': 'outlook.com',
        'outlook.co': 'outlook.com',
        'hotmial.com': 'hotmail.com',
        'hotmail.co': 'hotmail.com',
        'abv.gb': 'abv.bg',
        'abv.b': 'abv.bg'
    };

    if (suggestions[domain]) {
        return email.replace(domain, suggestions[domain]);
    }

    return null;
}

function clearFieldErrors() {
    // Clear field errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        wrapper.classList.remove('error', 'has-error');
    });
    document.querySelectorAll('.form-input').forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
    });

    // Clear login error messages
    document.querySelectorAll('.login-error-message').forEach(error => error.remove());

    // Clear detailed error notifications
    document.querySelectorAll('.detailed-error-notification').forEach(notification => {
        notification.remove();
    });
}

function showFieldError(fieldName, message) {
    console.log('🚫 Showing field error for:', fieldName, 'Message:', message);

    const input = document.querySelector(`[name="${fieldName}"]`);
    if (!input) return;

    const wrapper = input.closest('.input-wrapper') || input.parentElement;
    if (!wrapper) return;

    const existingError = wrapper.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    wrapper.classList.remove('has-error', 'error');

    wrapper.classList.add('has-error');

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    wrapper.appendChild(errorDiv);

    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';

    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.remove();
            wrapper.classList.remove('has-error', 'error');
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }
    }, 8000);
}

function showDetailedError(title, suggestion, errorType, showResendButton = false) {
    const notification = document.createElement('div');
    notification.className = 'detailed-error-notification';
    notification.innerHTML = `
        <div class="error-header">
            <div class="error-icon">⚠️</div>
            <div class="error-title">${title}</div>
            <div class="error-close">×</div>
        </div>
        <div class="error-content">
            <p>${suggestion}</p>
            ${showResendButton ? `
                <button class="btn-resend-verification" onclick="handleResendVerification()">
                    Resend Verification Email
                </button>
            ` : ''}
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 10000);

    notification.querySelector('.error-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

async function handleResendVerification() {
    try {
        const emailInput = document.querySelector('[name="email"]');
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email) {
            showMessage('Please enter your email address first.', 'error');
            return;
        }

        const response = await fetch('/api/auth/resend-confirmation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('✅ Verification email sent! Please check your inbox.', 'success');

            const notification = document.querySelector('.detailed-error-notification');
            if (notification) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        } else {
            showMessage(data.error || 'Failed to send verification email. Please try again.', 'error');
        }

    } catch (error) {
        console.error('💥 Error resending verification:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

function resetFormLabels() {
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        wrapper.classList.remove('filled', 'focused', 'error', 'has-error');
    });
}

function initializeRealTimeEmailValidation() {
    const emailInput = document.querySelector('#register-tab input[name="email"]');

    if (emailInput) {
        let validationTimeout;

        emailInput.addEventListener('input', function() {
            const email = this.value.trim();

            // Clear existing timeout
            clearTimeout(validationTimeout);

            // Clear existing errors when typing
            const wrapper = this.closest('.input-wrapper');
            const existingError = wrapper.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
            wrapper.classList.remove('has-error');
            this.style.borderColor = '';
            this.style.boxShadow = '';

            // Only validate if there's content and it looks like an email
            if (email.length > 5 && email.includes('@')) {
                validationTimeout = setTimeout(() => {
                    validateEmailRealTime(email);
                }, 1000); // 1 second delay
            }
        });

        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email) {
                validateEmailRealTime(email);
            }
        });
    }
}

function validateEmailRealTime(email) {
    console.log('🔍 Real-time email validation for:', email);

    if (!isValidEmailFormat(email)) {
        console.log('❌ Real-time: Email format invalid');
        showFieldError('email', 'Invalid email address');
        return false;
    }

    // Check for disposable emails
    const domain = email.split('@')[1]?.toLowerCase();
    const disposableDomains = [
        '10minutemail.com', 'temp-mail.org', 'guerrillamail.com',
        'mailinator.com', 'throwaway.email', 'yopmail.com'
    ];

    if (disposableDomains.includes(domain)) {
        console.log('❌ Real-time: Disposable email detected');
        showFieldError('email', 'Invalid email address');
        return false;
    }

    // Check for typos
    const suggestion = getEmailSuggestion(email);
    if (suggestion) {
        console.log('⚠️ Real-time: Email typo detected');
        showFieldError('email', 'Invalid email address');
        return false;
    }

    console.log('✅ Real-time: Email is valid');
    return true;
}
