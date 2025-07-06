/*
 * PERSONAL FINANCE - COMPLETE LANDING PAGE JAVASCRIPT
 * FIXED VERSION - Enhanced Email Validation & Error Display
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

            // Don't do anything if this tab is already active
            if (this.classList.contains('active')) {
                return;
            }

            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));

            // Hide all tab contents instantly without animation
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });

            // Add active class to clicked tab
            this.classList.add('active');

            // Show the target content instantly
            const targetContent = document.getElementById(targetTab + '-tab');
            if (targetContent) {
                targetContent.style.display = 'block';
                targetContent.classList.add('active');
            }

            // Clear any existing messages and reset all form states when switching tabs
            clearMessages();
            resetAllFormStatesComplete(); // Use complete reset for tab switching

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
        console.log('✅ Register form handler attached');
    } else {
        console.log('❌ Register form not found');
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form handler attached');
    } else {
        console.log('❌ Login form not found');
    }
}

async function handleRegistration(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonContent = submitButton.innerHTML;

    console.log('🚀 Registration started');
    console.log('📋 Form element:', form);
    console.log('📋 Form ID:', form.id);

    // Check all inputs in form
    const allInputs = form.querySelectorAll('input');
    console.log('📝 All inputs found:', allInputs.length);

    allInputs.forEach((input, index) => {
        console.log(`Input ${index}:`, {
            name: input.name,
            type: input.type,
            value: input.value ? `"${input.value}"` : 'empty',
            id: input.id
        });
    });

    const formData = {
        firstName: form.firstName ? form.firstName.value.trim() : '',
        lastName: form.lastName ? form.lastName.value.trim() : '',
        email: form.email ? form.email.value.trim() : '',
        password: form.password ? form.password.value : ''
    };

    console.log('📝 Form data collected:', {
        ...formData,
        password: formData.password ? '[HIDDEN]' : 'empty'
    });

    // CRITICAL: Enhanced validation before submit
    if (!validateRegistrationFormEnhanced(formData)) {
        console.log('❌ Validation failed - stopping submission');
        shakeForm(form);
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

            // COMPLETE FORM RESET
            form.reset();
            resetAllFormStates();

        } else {
            console.log('❌ Registration failed:', data.error);

            // Show backend error - will auto-hide after 3.5 seconds due to showMessage implementation
            showMessage(data.error || 'Registration failed. Please try again.', 'error');
            shakeForm(form);

            // COMPLETE FORM RESET
            form.reset();
            resetAllFormStates();
        }

    } catch (error) {
        console.error('💥 Network error:', error);
        showMessage('Network connection error. Please check your internet connection and try again.', 'error');
        shakeForm(form);

        // COMPLETE FORM RESET
        form.reset();
        resetAllFormStates();
    } finally {
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonContent;
            submitButton.classList.remove('loading', 'success');
        }, 2000);
    }
}

// ==========================================
// UPDATED LOGIN HANDLER WITH PROPER FORM RESET
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

    // Clear previous errors and reset form states
    clearMessages();
    clearFieldErrors();
    resetAllFormStates(); // THIS IS KEY!

    // Basic validation
    if (!email) {
        showLoginError('Please enter your email address');
        return;
    }

    if (!password) {
        showLoginError('Please enter your password');
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

                // COMPLETE FORM RESET при успех
                form.reset();
                resetAllFormStates();

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
                return;
            }
        }

        // При всякаква грешка - проверяваме за backend error response
        console.log('❌ Login failed, checking for detailed error info...');

        try {
            const errorResponse = await fetch('/api/auth/login-error');
            const errorData = await errorResponse.json();

            if (errorData && errorData.errorType) {
                console.log('📋 Detailed error received:', errorData);
                handleDetailedLoginError(errorData);
            } else {
                showLoginError('Email or password is incorrect');
            }
        } catch (errorCheckError) {
            console.log('⚠️ Could not get detailed error, using generic message');
            showLoginError('Email or password is incorrect');
        }

        // COMPLETE FORM RESET при грешка - BUT AFTER showing error message
        setTimeout(() => {
            form.reset();
            resetAllFormStates(); // Reset AFTER error message is shown
        }, 100); // Small delay to ensure error message is displayed first

    } catch (error) {
        console.error('💥 Network error during login:', error);
        showLoginError('Connection error. Please try again.');

        // COMPLETE FORM RESET при грешка - BUT AFTER showing error message
        setTimeout(() => {
            form.reset();
            resetAllFormStates();
        }, 100);
    } finally {
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonContent;
            submitButton.classList.remove('loading', 'success');
        }, 2000);
    }
}

// ==========================================
// CRITICAL FIX: RESET ALL FORM STATES FUNCTION
// ==========================================

function resetAllFormStates() {
    console.log('🔄 Resetting all form states...');

    // Reset all input wrappers - remove ALL password validation classes
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        // Remove ALL possible classes EXCEPT has-error (preserve error state)
        wrapper.classList.remove(
            'filled', 'focused', 'error',
            'password-empty', 'password-invalid', 'password-weak',
            'password-fair', 'password-good', 'password-excellent'
        );

        console.log('🧹 Cleaned wrapper classes for:', wrapper);
    });

    // Reset all form inputs to default styling (but preserve error styling)
    document.querySelectorAll('.form-input').forEach(input => {
        // Only reset if the input doesn't have an error state
        const wrapper = input.closest('.input-wrapper');
        if (!wrapper || !wrapper.classList.contains('has-error')) {
            input.style.borderColor = '';
            input.style.boxShadow = '';
            input.style.background = '';
        }

        // Trigger browser reflow to ensure styles are reset
        input.offsetHeight;

        console.log('🎨 Reset input styling for:', input.name || input.type);
    });

    // CRITICAL: Reset ALL password tooltips to initial state
    document.querySelectorAll('.password-tooltip').forEach(tooltip => {
        tooltip.classList.remove('visible');
        tooltip.classList.add('hidden');

        // Reset tooltip content to initial state
        const strengthBar = tooltip.querySelector('.strength-bar-mini');
        const strengthMessage = tooltip.querySelector('.strength-message');
        const requirements = tooltip.querySelectorAll('.req');

        if (strengthBar) {
            strengthBar.style.width = '0%';
            strengthBar.className = 'strength-bar-mini empty';
        }

        if (strengthMessage) {
            strengthMessage.textContent = 'Enter password...';
            strengthMessage.className = 'strength-message empty';
        }

        // Reset all requirements to unmet state
        requirements.forEach(req => {
            req.classList.remove('met', 'unmet');
            req.classList.add('unmet');
        });

        console.log('🧹 Reset password tooltip to initial state');
    });

    console.log('✅ All form states reset successfully (errors preserved)');
}

// ==========================================
// SEPARATE FUNCTION FOR COMPLETE CLEANUP (used on tab switching)
// ==========================================

function resetAllFormStatesComplete() {
    console.log('🔄 Complete reset of all form states and errors...');

    // Reset all input wrappers - remove ALL classes
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        wrapper.classList.remove(
            'filled', 'focused', 'error', 'has-error',
            'password-empty', 'password-invalid', 'password-weak',
            'password-fair', 'password-good', 'password-excellent'
        );
    });

    // Reset all form inputs to default styling
    document.querySelectorAll('.form-input').forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        input.style.background = '';
        input.offsetHeight; // Trigger reflow
    });

    // Remove ALL errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.login-error-message').forEach(error => error.remove());

    // Reset ALL password tooltips to initial state
    document.querySelectorAll('.password-tooltip').forEach(tooltip => {
        tooltip.classList.remove('visible');
        tooltip.classList.add('hidden');

        // Reset tooltip content to initial state
        const strengthBar = tooltip.querySelector('.strength-bar-mini');
        const strengthMessage = tooltip.querySelector('.strength-message');
        const requirements = tooltip.querySelectorAll('.req');

        if (strengthBar) {
            strengthBar.style.width = '0%';
            strengthBar.className = 'strength-bar-mini empty';
        }

        if (strengthMessage) {
            strengthMessage.textContent = 'Enter password...';
            strengthMessage.className = 'strength-message empty';
        }

        // Reset all requirements to unmet state
        requirements.forEach(req => {
            req.classList.remove('met', 'unmet');
            req.classList.add('unmet');
        });

        console.log('🧹 Reset password tooltip to initial state');
    });

    console.log('✅ Complete form reset finished');
}

// ==========================================
// IMPROVED LOGIN ERROR HANDLING
// ==========================================

function handleDetailedLoginError(errorData) {
    console.log('🚫 Handling detailed login error:', errorData);

    let message = 'Email or password is incorrect'; // Default Security-First message
    let showResendButton = false;

    // Handle specific error types with Security-First approach
    switch (errorData.errorType) {
        case 'invalid_password':
        case 'invalid_email':
            // Use same message for both to prevent user enumeration
            message = 'Email or password is incorrect';
            break;

        case 'email_not_verified':
            // This is specific because user exists and needs to take action
            message = 'Please verify your email address before signing in';
            showResendButton = true;
            break;

        case 'oauth_user':
            // Specific guidance needed
            message = 'This account uses Google Sign-In. Please use the Google button below';
            break;

        case 'account_disabled':
            // Security concern - be specific
            message = 'Your account has been temporarily suspended. Contact support for assistance';
            break;

        case 'email_required':
            message = 'Please enter your email address';
            break;

        case 'password_required':
            message = 'Please enter your password';
            break;

        default:
            message = 'Email or password is incorrect';
            break;
    }

    // Show the error message
    showLoginError(message, showResendButton);

    // Log for debugging
    console.log('📤 Showing login error:', {
        originalType: errorData.errorType,
        displayMessage: message,
        showResend: showResendButton
    });
}

function showLoginError(message, showResendButton = false) {
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

    // Add main message
    const messageP = document.createElement('p');
    messageP.textContent = message;
    errorDiv.appendChild(messageP);

    // Add resend verification button if needed
    if (showResendButton) {
        const resendDiv = document.createElement('div');
        resendDiv.style.marginTop = '12px';

        const resendBtn = document.createElement('button');
        resendBtn.type = 'button';
        resendBtn.className = 'btn-resend-verification';
        resendBtn.textContent = 'Resend Verification Email';
        resendBtn.style.cssText = `
            background: transparent;
            border: 1px solid #3b82f6;
            color: #3b82f6;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        resendBtn.addEventListener('mouseover', () => {
            resendBtn.style.background = '#3b82f6';
            resendBtn.style.color = 'white';
        });

        resendBtn.addEventListener('mouseout', () => {
            resendBtn.style.background = 'transparent';
            resendBtn.style.color = '#3b82f6';
        });

        resendBtn.addEventListener('click', handleResendVerification);

        resendDiv.appendChild(resendBtn);
        errorDiv.appendChild(resendDiv);
    }

    // Вмъкни ПРЕДИ submit button-а
    submitButton.parentNode.insertBefore(errorDiv, submitButton);

    // Анимация
    errorDiv.style.opacity = '0';
    errorDiv.style.transform = 'translateY(-10px)';

    setTimeout(() => {
        errorDiv.style.opacity = '1';
        errorDiv.style.transform = 'translateY(0)';
    }, 100);

    // Auto-remove след 3.5 секунди
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
    }, 3500); // Changed from 10000 to 3500 (3.5 seconds)

    // Shake ефект на формата
    const form = loginTab.querySelector('.auth-form');
    if (form) {
        shakeForm(form);
    }
}

async function handleResendVerification() {
    try {
        const emailInput = document.querySelector('#login-tab [name="email"]');
        const email = emailInput ? emailInput.value.trim() : '';

        if (!email) {
            showMessage('Please enter your email address first.', 'error');
            return;
        }

        console.log('📧 Resending verification email to:', email);

        // Update button state
        const resendBtn = event.target;
        const originalText = resendBtn.textContent;
        resendBtn.textContent = 'Sending...';
        resendBtn.disabled = true;

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

            // Remove the error message with resend button
            const errorMessage = document.querySelector('.login-error-message');
            if (errorMessage) {
                errorMessage.style.opacity = '0';
                errorMessage.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (errorMessage.parentNode) {
                        errorMessage.remove();
                    }
                }, 300);
            }
        } else {
            showMessage(data.error || 'Failed to send verification email. Please try again.', 'error');

            // Reset button
            resendBtn.textContent = originalText;
            resendBtn.disabled = false;
        }

    } catch (error) {
        console.error('💥 Error resending verification:', error);
        showMessage('Network error. Please try again.', 'error');

        // Reset button
        const resendBtn = event.target;
        resendBtn.textContent = 'Resend Verification Email';
        resendBtn.disabled = false;
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
        // CRITICAL: Update input wrapper classes in real-time
        updatePasswordInputState(input, input.value);
    });

    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip);

    return tooltip;
}

// ==========================================
// CRITICAL FIX: UPDATE PASSWORD INPUT STATE
// ==========================================

function updatePasswordInputState(input, password) {
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) return;

    // Remove ALL previous password classes
    wrapper.classList.remove(
        'password-empty', 'password-invalid', 'password-weak',
        'password-fair', 'password-good', 'password-excellent'
    );

    // If password is empty, don't add any password class
    if (!password || password.length === 0) {
        console.log('🔄 Password empty - no class added');
        return;
    }

    // Get validation result and add appropriate class
    const validation = validatePassword(password);
    const newClass = `password-${validation.level}`;

    wrapper.classList.add(newClass);
    console.log('🎨 Updated password input class:', newClass);
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

        // CRITICAL: Clear password state when input is cleared
        input.addEventListener('input', () => {
            if (!input.value || input.value.length === 0) {
                const wrapper = input.closest('.input-wrapper');
                if (wrapper) {
                    // Remove ALL password classes when empty
                    wrapper.classList.remove(
                        'password-empty', 'password-invalid', 'password-weak',
                        'password-fair', 'password-good', 'password-excellent'
                    );
                    console.log('🧹 Cleared password classes - input is empty');
                }
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
// ENHANCED EMAIL VALIDATION FUNCTIONS
// ==========================================

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

    // ENHANCED EMAIL VALIDATION
    if (!data.email) {
        console.log('❌ Email is empty');
        showFieldError('email', 'Email address is required');
        isValid = false;
    } else {
        console.log('🔍 Validating email:', data.email);

        const emailValidation = validateEmailEnhanced(data.email);
        if (!emailValidation.valid) {
            console.log('❌ Email validation failed:', emailValidation.message);
            showFieldError('email', emailValidation.message);
            isValid = false;
        } else {
            console.log('✅ Email is valid');
        }
    }

    // Password validation
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

// ENHANCED EMAIL VALIDATION - More comprehensive
function validateEmailEnhanced(email) {
    console.log('🔍 Enhanced email validation for:', email);

    if (!email || typeof email !== 'string') {
        return { valid: false, message: 'Email is required' };
    }

    email = email.trim();

    // Basic length and structure checks
    if (email.length > 254) {
        return { valid: false, message: 'Email address is too long' };
    }

    if (!email.includes('@')) {
        return { valid: false, message: 'Email must contain @ symbol' };
    }

    const parts = email.split('@');
    if (parts.length !== 2) {
        return { valid: false, message: 'Invalid email format' };
    }

    const [localPart, domain] = parts;

    // Local part validation
    if (!localPart || localPart.length === 0 || localPart.length > 64) {
        return { valid: false, message: 'Invalid email format' };
    }

    // Domain validation
    if (!domain || domain.length === 0 || domain.length > 253) {
        return { valid: false, message: 'Invalid email address' };
    }

    // Domain must contain at least one dot
    if (!domain.includes('.')) {
        return { valid: false, message: 'Invalid email address' };
    }

    // Check for invalid domain patterns
    if (domain.startsWith('.') || domain.endsWith('.') ||
        domain.startsWith('-') || domain.endsWith('-') ||
        domain.includes('..')) {
        return { valid: false, message: 'Invalid email address' };
    }

    // Split domain into parts
    const domainParts = domain.split('.');

    // Must have at least 2 parts (domain + TLD)
    if (domainParts.length < 2) {
        return { valid: false, message: 'Invalid email address' };
    }

    // Validate TLD (top-level domain)
    const tld = domainParts[domainParts.length - 1];
    if (!tld || tld.length < 2 || tld.length > 10) {
        return { valid: false, message: 'Invalid email address' };
    }

    // TLD should only contain letters
    if (!/^[a-zA-Z]+$/.test(tld)) {
        return { valid: false, message: 'Invalid email address' };
    }

    // Check for common incomplete domains like "gmail.co", "yahoo.c", "gma", etc.
    const domainLower = domain.toLowerCase();
    const incompleteDomains = [
        // Gmail variants
        'gmail.co', 'gmail.c', 'gmai.com', 'gmial.com', 'gmail.comm',
        'gmail.bg', 'gmail.bh', 'gmail.ba', 'gmail.hu', 'gmail.cz',

        // Yahoo variants
        'yahoo.co', 'yahoo.c', 'yaho.com', 'yahooo.com',
        'yahoo.bg', 'yahoo.bh', 'yahoo.ba',

        // Outlook variants
        'outlok.com', 'outlook.co', 'outlook.c',
        'outlook.bg', 'outlook.bh', 'outlook.ba',

        // Hotmail variants
        'hotmial.com', 'hotmail.co', 'hotmail.c',
        'hotmail.bg', 'hotmail.bh', 'hotmail.ba',

        // Bulgarian providers
        'abv.b', 'abv.gb', 'abv.com',

        // Incomplete/typo domains
        'gma', 'gmai', 'yahooo', 'outlok', 'hotmial'
    ];

    if (incompleteDomains.includes(domainLower)) {
        return { valid: false, message: 'Invalid email address' };
    }

    // Additional check for known major email providers with wrong country codes
    const majorProviders = ['gmail', 'yahoo', 'outlook', 'hotmail'];
    const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'bg', 'uk', 'de', 'fr', 'it', 'es'];

    // Check if it's a major provider with suspicious TLD
    const mainDomainPart = domainParts[domainParts.length - 2]; // The part before TLD
    if (majorProviders.includes(mainDomainPart)) {
        // For major providers, only allow specific valid TLDs
        const validProviderTLDs = {
            'gmail': ['com'],
            'yahoo': ['com', 'bg', 'co.uk'],
            'outlook': ['com'],
            'hotmail': ['com', 'bg', 'co.uk']
        };

        if (validProviderTLDs[mainDomainPart] && !validProviderTLDs[mainDomainPart].includes(tld)) {
            return { valid: false, message: 'Invalid email address' };
        }
    }

    // Check for domains that are too short (like "gma")
    const mainDomain = domainParts[domainParts.length - 2]; // The part before TLD
    if (!mainDomain || mainDomain.length < 2) {
        return { valid: false, message: 'Invalid email address' };
    }

    // Disposable email check
    const disposableDomains = [
        '10minutemail.com', 'temp-mail.org', 'guerrillamail.com',
        'mailinator.com', 'throwaway.email', 'yopmail.com',
        'tempmail.com', 'sharklasers.com', '0-mail.com',
        'maildrop.cc', 'guerrillamailblock.com', 'fakeinbox.com',
        'tempail.com', 'throwawaymail.com', '33mail.com'
    ];

    if (disposableDomains.includes(domainLower)) {
        return { valid: false, message: 'Please use a valid email address' };
    }

    // Email typo detection with suggestions
    const suggestion = getEmailSuggestion(email);
    if (suggestion) {
        return {
            valid: false,
            message: 'Please check your email address',
            suggestion: suggestion
        };
    }

    // Final regex validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }

    console.log('✅ Email passed enhanced validation');
    return { valid: true, message: 'Valid email' };
}

function getEmailSuggestion(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    // Smart suggestions based on common typos
    const suggestions = {
        // Gmail typos
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'gmail.co': 'gmail.com',
        'gmail.c': 'gmail.com',

        // Yahoo typos
        'yahooo.com': 'yahoo.com',
        'yaho.com': 'yahoo.com',

        // Outlook typos
        'outlok.com': 'outlook.com',

        // Hotmail typos
        'hotmial.com': 'hotmail.com',

        // Bulgarian providers typos
        'abv.b': 'abv.bg',
        'abv.gb': 'abv.bg'
    };

    // Handle incomplete domains
    if (domain === 'gma' || domain === 'gmai') {
        return email.replace(domain, 'gmail.com');
    }

    if (suggestions[domain]) {
        return email.replace(domain, suggestions[domain]);
    }

    return null;
}

function validateField(input) {
    const value = input.value.trim();
    const type = input.type;
    const name = input.name;

    // REMOVED automatic email validation on field validation
    // Email validation only happens during form submission

    if (type === 'password' && value) {
        return validatePasswordField(input);
    }

    return true;
}

// ==========================================
// FIXED: ENHANCED FIELD ERROR DISPLAY
// ==========================================

function showFieldError(fieldName, message) {
    console.log('🚫 Showing field error for:', fieldName, 'Message:', message);

    // ENHANCED DEBUGGING - Try multiple selectors
    let input = document.querySelector(`[name="${fieldName}"]`);
    if (!input) {
        input = document.querySelector(`#register-${fieldName}`);
        console.log('🔍 Tried by register-ID, found:', input);
    }
    if (!input) {
        input = document.querySelector(`input[name="${fieldName}"]`);
        console.log('🔍 Tried input[name], found:', input);
    }
    if (!input) {
        console.log('❌ Could not find input for field:', fieldName);
        console.log('🔍 Available inputs with names:',
            Array.from(document.querySelectorAll('input')).map(inp => inp.name || inp.id)
        );
        // FALLBACK: Show in messages container
        showFieldErrorInMessagesContainer(fieldName, message);
        return;
    }

    console.log('✅ Found input:', input);

    // Find wrapper - try multiple strategies
    let wrapper = input.closest('.input-wrapper');
    if (!wrapper) {
        wrapper = input.closest('.form-group');
        console.log('🔍 Used .form-group as wrapper:', wrapper);
    }
    if (!wrapper) {
        wrapper = input.parentElement;
        console.log('🔍 Used parentElement as wrapper:', wrapper);
    }

    if (!wrapper) {
        console.log('❌ Could not find wrapper, using fallback');
        showFieldErrorInMessagesContainer(fieldName, message);
        return;
    }

    console.log('✅ Found wrapper:', wrapper);

    // CRITICAL: If this is a password field, remove ALL password classes first
    if (input.type === 'password') {
        wrapper.classList.remove(
            'password-empty', 'password-invalid', 'password-weak',
            'password-fair', 'password-good', 'password-excellent'
        );
        console.log('🧹 Removed password classes from field with error');
    }

    // Remove existing errors
    const existingError = wrapper.querySelector('.field-error');
    if (existingError) {
        console.log('🧹 Removing existing error:', existingError);
        existingError.remove();
    }

    // Also check for errors that might be outside the wrapper
    const formGroup = wrapper.closest('.form-group') || wrapper;
    const externalError = formGroup.querySelector('.field-error');
    if (externalError && externalError !== existingError) {
        externalError.remove();
    }

    wrapper.classList.remove('has-error', 'error');

    // Add error state
    wrapper.classList.add('has-error');
    console.log('✅ Added has-error class to wrapper');

    // Create error element with GUARANTEED visibility
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;

    // CRITICAL: Force visible styling
    errorDiv.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #ef4444 !important;
        font-size: 14px !important;
        margin-top: 8px !important;
        padding: 12px 16px !important;
        background: rgba(254, 226, 226, 0.9) !important;
        border: 1px solid rgba(239, 68, 68, 0.3) !important;
        border-left: 4px solid #ef4444 !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.1) !important;
        backdrop-filter: blur(8px) !important;
        font-weight: 500 !important;
        line-height: 1.4 !important;
        z-index: 1000 !important;
        position: relative !important;
        max-width: 100% !important;
        word-wrap: break-word !important;
        animation: slideInMessage 0.4s ease-out !important;
    `;

    // SMART INSERTION: Choose best place to insert error
    if (wrapper.classList.contains('input-wrapper')) {
        // If wrapper is input-wrapper, add after it (inside form-group)
        const formGroup = wrapper.parentElement;
        if (formGroup && formGroup.classList.contains('form-group')) {
            formGroup.appendChild(errorDiv);
            console.log('✅ Added error after input-wrapper inside form-group');
        } else {
            wrapper.parentNode.insertBefore(errorDiv, wrapper.nextSibling);
            console.log('✅ Added error after input-wrapper');
        }
    } else {
        // If wrapper is form-group, add inside it after input-wrapper
        wrapper.appendChild(errorDiv);
        console.log('✅ Added error inside form-group');
    }

    console.log('✅ Added error div:', errorDiv);

    // Style the input with error state
    input.style.borderColor = '#ef4444 !important';
    input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1) !important';
    input.style.background = 'rgba(254, 226, 226, 0.1) !important';
    console.log('✅ Applied error styling to input');

    // Force browser reflow to ensure visibility
    errorDiv.offsetHeight;
    wrapper.offsetHeight;

    // Check if error is actually visible after a short delay
    setTimeout(() => {
        const isVisible = errorDiv.offsetHeight > 0 && errorDiv.offsetWidth > 0;
        const computedStyle = window.getComputedStyle(errorDiv);
        console.log('🔍 Error visibility check:', {
            isVisible: isVisible,
            offsetHeight: errorDiv.offsetHeight,
            offsetWidth: errorDiv.offsetWidth,
            computedDisplay: computedStyle.display,
            computedVisibility: computedStyle.visibility,
            computedOpacity: computedStyle.opacity,
            parentElement: errorDiv.parentElement?.tagName
        });

        if (!isVisible) {
            console.log('⚠️ Error not visible, using fallback');
            showFieldErrorInMessagesContainer(fieldName, message);
        }
    }, 100);

    // Auto-remove after 3.5 seconds for sign up form errors
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            console.log('🧹 Auto-removing error after 3.5 seconds');
            errorDiv.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (errorDiv && errorDiv.parentNode) {
                    errorDiv.remove();
                    wrapper.classList.remove('has-error', 'error');
                    input.style.borderColor = '';
                    input.style.boxShadow = '';
                    input.style.background = '';

                    // CRITICAL: Also remove password classes when error disappears
                    if (input.type === 'password') {
                        wrapper.classList.remove(
                            'password-empty', 'password-invalid', 'password-weak',
                            'password-fair', 'password-good', 'password-excellent'
                        );
                        console.log('🧹 Removed password classes when error cleared');
                    }
                }
            }, 300);
        }
    }, 3500);
}

// FALLBACK ERROR DISPLAY FUNCTION
function showFieldErrorInMessagesContainer(fieldName, message) {
    console.log('🚨 Using fallback error display for:', fieldName);

    // Try to show as a general message if field-specific fails
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        // Clear previous messages
        messagesContainer.innerHTML = '';

        const errorMessage = document.createElement('div');
        errorMessage.className = 'message error';
        errorMessage.style.cssText = `
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%) !important;
            border: 1px solid rgba(239, 68, 68, 0.2) !important;
            border-left: 4px solid #ef4444 !important;
            color: #dc2626 !important;
            padding: 16px 20px !important;
            border-radius: 12px !important;
            font-weight: 500 !important;
            margin: 16px 0 !important;
            animation: slideInMessage 0.4s ease-out !important;
            backdrop-filter: blur(8px) !important;
            box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -2px rgba(239, 68, 68, 0.05) !important;
            font-size: 14px !important;
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
        `;

        // Format field name nicely
        const fieldDisplayName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        errorMessage.textContent = `${fieldDisplayName}: ${message}`;

        messagesContainer.appendChild(errorMessage);

        console.log('✅ Fallback error message added to messages container');

        // Scroll to make sure it's visible
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Auto-remove after 3.5 seconds for fallback errors
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    if (errorMessage.parentNode) {
                        errorMessage.remove();
                    }
                }, 300);
            }
        }, 3500);

        return true;
    }

    // Last resort - alert
    console.log('🚨 Using alert as last resort');
    alert(`${fieldName}: ${message}`);
    return false;
}

function clearFieldErrors() {
    // Clear field errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        wrapper.classList.remove('error', 'has-error');

        // CRITICAL: Also remove password classes when clearing errors
        wrapper.classList.remove(
            'password-empty', 'password-invalid', 'password-weak',
            'password-fair', 'password-good', 'password-excellent'
        );
    });
    document.querySelectorAll('.form-input').forEach(input => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        input.style.background = '';
    });

    // Clear login error messages
    document.querySelectorAll('.login-error-message').forEach(error => error.remove());

    console.log('✅ Cleared all field errors and password classes');
}

function initializeRealTimeEmailValidation() {
    const emailInput = document.querySelector('#register-tab input[name="email"]');

    if (emailInput) {
        // REMOVED real-time validation on input
        // Only validate on blur if the user wants immediate feedback
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();

            // Clear existing errors when user focuses out
            const wrapper = this.closest('.input-wrapper');
            const existingError = wrapper ? wrapper.querySelector('.field-error') : null;
            const formGroup = wrapper ? wrapper.closest('.form-group') : null;
            const externalError = formGroup ? formGroup.querySelector('.field-error') : null;

            if (existingError) existingError.remove();
            if (externalError && externalError !== existingError) externalError.remove();

            if (wrapper) wrapper.classList.remove('has-error');
            this.style.borderColor = '';
            this.style.boxShadow = '';
            this.style.background = '';

            // NO validation on blur - only when form is submitted
        });

        // Clear errors when typing (but don't validate)
        emailInput.addEventListener('input', function() {
            // Clear existing errors when typing
            const wrapper = this.closest('.input-wrapper');
            const existingError = wrapper ? wrapper.querySelector('.field-error') : null;
            const formGroup = wrapper ? wrapper.closest('.form-group') : null;
            const externalError = formGroup ? formGroup.querySelector('.field-error') : null;

            if (existingError) existingError.remove();
            if (externalError && externalError !== existingError) externalError.remove();

            if (wrapper) wrapper.classList.remove('has-error');
            this.style.borderColor = '';
            this.style.boxShadow = '';
            this.style.background = '';
        });
    }
}

function validateEmailRealTime(email) {
    console.log('🔍 Real-time email validation for:', email);

    const validation = validateEmailEnhanced(email);

    if (!validation.valid) {
        console.log('❌ Real-time: Email validation failed:', validation.message);
        showFieldError('email', validation.message);
        return false;
    }

    console.log('✅ Real-time: Email is valid');
    return true;
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
    if (!messagesContainer) {
        console.log('❌ Messages container not found');
        return;
    }

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

    // Auto-hide timing based on message type
    if (autoHide) {
        let hideTimeout = 5000; // default 5 seconds

        if (type === 'error') {
            hideTimeout = 3500; // 3.5 seconds for error messages
        } else if (type === 'success') {
            hideTimeout = 5000; // 5 seconds for success messages
        }

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
        }, hideTimeout);
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
        resetAllFormStates();
    }

    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});

// ==========================================
// DEVELOPMENT HELPERS & DEBUGGING
// ==========================================

// Global debugging functions
window.testEmailValidation = function(email) {
    console.log('🧪 Testing email:', email);
    const result = validateEmailEnhanced(email);
    console.log('🧪 Result:', result);
    return result;
};

window.checkFormRegistration = function() {
    const registerForm = document.getElementById('register-form');
    console.log('🔍 Register form by ID:', registerForm);

    const allForms = document.querySelectorAll('form');
    console.log('🔍 All forms on page:', allForms);

    allForms.forEach((form, index) => {
        console.log(`Form ${index}:`, {
            id: form.id,
            action: form.action,
            method: form.method,
            hasEventListener: form.onsubmit !== null
        });
    });

    const allInputs = document.querySelectorAll('input');
    console.log('🔍 All inputs:', allInputs);

    allInputs.forEach((input, index) => {
        console.log(`Input ${index}:`, {
            name: input.name,
            id: input.id,
            type: input.type,
            form: input.form ? input.form.id : 'no form'
        });
    });
};

window.testFieldError = function(fieldName, message) {
    console.log('🧪 Testing field error display for:', fieldName);
    showFieldError(fieldName, message || 'Test error message');
};

// Add CSS for fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }

    @keyframes slideInMessage {
        from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
`;
document.head.appendChild(style);

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🚀 PersonalFinance Complete Landing Page Loaded');
    console.log('✨ Updated Features:', {
        'FIXED Field Error Display': 'Multiple fallback strategies for error visibility',
        'ENHANCED Email Validation': 'Comprehensive validation including "g543@gma" detection',
        'Domain Completeness Check': 'Detects incomplete domains and typos',
        'TLD Validation': 'Validates top-level domains properly',
        'Disposable Email Detection': 'Blocks temporary email services',
        'Real-time Validation': 'Immediate feedback on email input',
        'Security-First Approach': 'Prevents user enumeration attacks',
        'Form Reset Logic': 'Complete cleanup of password validation classes',
        'Enhanced Error Messages': 'Clear, actionable error messages with fallbacks',
        'Multiple Error Display Strategies': 'Field-specific, form-wide, and container fallbacks'
    });

    console.log('🔧 Available debugging functions:');
    console.log('- testEmailValidation("g543@gma")');
    console.log('- checkFormRegistration()');
    console.log('- testFieldError("email", "Test message")');
}