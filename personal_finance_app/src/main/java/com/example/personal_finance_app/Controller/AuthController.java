package com.example.personal_finance_app.Controller;

import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Entity.EmailConfirmationToken;
import com.example.personal_finance_app.Service.CategoryService;
import com.example.personal_finance_app.Service.CustomOAuth2User;
import com.example.personal_finance_app.Service.UserService;
import com.example.personal_finance_app.Service.EmailValidationService;
import com.example.personal_finance_app.Service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private EmailValidationService emailValidationService;

    @Autowired
    private EmailService emailService;

    // Static reference за getCurrentUserId() method
    private static ApplicationContext applicationContext;

    @Autowired
    public void setApplicationContext(ApplicationContext context) {
        AuthController.applicationContext = context;
    }

    /**
     * API Register endpoint - ОБНОВЕН с email validation
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerUser(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            // ===== НОВА ЛОГИКА: Email validation =====
            EmailValidationService.EmailValidationResult validation =
                    emailValidationService.validateEmailForRegistration(email);

            if (!validation.isValid()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("error", validation.getMessage());
                error.put("severity", validation.getSeverity());
                return ResponseEntity.badRequest().body(error);
            }
            // =======================================

            // СЪЩАТА логика като преди:
            User user = userService.registerUser(
                    email,
                    request.get("password"),
                    request.get("firstName"),
                    request.get("lastName")
            );

            // Създаване на default категории за новия потребител
            categoryService.createDefaultCategoriesForUser(user);

            // ===== НОВА ЛОГИКА: Send confirmation email =====
            try {
                EmailConfirmationToken token = emailValidationService.sendConfirmationEmail(user);

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Account created! Please check your email to confirm your account.");
                response.put("emailSent", true);
                response.put("email", user.getEmail());
                response.put("redirectUrl", "/?register=success");

                return ResponseEntity.ok(response);

            } catch (Exception emailError) {
                // Ако email изпращането се провали, все пак връщаме success
                // но с различно съобщение
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Account created, but failed to send confirmation email. Please contact support.");
                response.put("emailSent", false);
                response.put("emailError", emailError.getMessage());
                response.put("redirectUrl", "/?register=success");

                return ResponseEntity.ok(response);
            }
            // =============================================

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Email confirmation endpoint - НОВ
     */
    @GetMapping("/confirm-email")
    public ResponseEntity<String> confirmEmail(@RequestParam String token) {
        try {
            boolean confirmed = emailValidationService.confirmEmail(token);

            if (confirmed) {
                // Можеш да върнеш redirect или JSON response
                return ResponseEntity.ok("redirect:/dashboard?confirmed=true");
            } else {
                return ResponseEntity.badRequest().body("redirect:/?error=invalid_token");
            }

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("redirect:/?error=confirmation_failed");
        }
    }

    /**
     * Resend confirmation email - НОВ
     */
    @PostMapping("/resend-confirmation")
    public ResponseEntity<Map<String, Object>> resendConfirmationEmail(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            EmailConfirmationToken token = emailValidationService.resendConfirmationEmail(email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Confirmation email sent successfully!");
            response.put("email", email);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Получаване на текущия автентикиран потребител - ОБНОВЕН
     */
    @GetMapping("/current-user")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated() ||
                    "anonymousUser".equals(authentication.getName())) {
                Map<String, Object> response = new HashMap<>();
                response.put("authenticated", false);
                return ResponseEntity.ok(response);
            }

            User user = null;

            // Проверка дали е OAuth потребител
            if (authentication.getPrincipal() instanceof CustomOAuth2User) {
                CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
                user = oAuth2User.getUser();
            }
            // Проверка дали е обикновен потребител
            else if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.User) {
                String email = authentication.getName();
                user = userService.findByEmail(email);
            }

            if (user == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("authenticated", false);
                response.put("error", "User not found");
                return ResponseEntity.ok(response);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("authenticated", true);
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("fullName", user.getFullName());
            response.put("provider", user.getProvider().name());
            response.put("isOAuthUser", user.isOAuthUser());

            // ===== НОВИ ПОЛЕТА =====
            response.put("emailVerified", user.isEmailVerified());
            response.put("emailVerifiedAt", user.getEmailVerifiedAt());
            response.put("verificationStatus", user.getVerificationStatus());
            response.put("needsEmailVerification", user.needsEmailVerification());
            // ======================

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("authenticated", false);
            error.put("error", "Authentication error: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }



    /**
     * НОВ ENDPOINT: Login error handler за AJAX response
     * ДОБАВИ ТОЗИ МЕТОД В AuthController.java
     */
    /**
     * ПОДОБРЕН Login error endpoint с професионални съобщения
     * ЗАМЕНИ В AuthController.java
     */
    @GetMapping("/login-error")
    public ResponseEntity<Map<String, Object>> handleLoginError(HttpServletRequest request) {
        try {
            HttpSession session = request.getSession(false);
            Map<String, Object> response = new HashMap<>();

            if (session != null) {
                String errorType = (String) session.getAttribute("login_error_type");
                String errorMessage = (String) session.getAttribute("login_error_message");
                String failedEmail = (String) session.getAttribute("login_failed_email");

                // Изчисти session attributes
                session.removeAttribute("login_error_type");
                session.removeAttribute("login_error_message");
                session.removeAttribute("login_failed_email");

                if (errorType != null && errorMessage != null) {
                    response.put("success", false);
                    response.put("errorType", errorType);
                    response.put("message", errorMessage);
                    response.put("email", failedEmail);

                    // Професионални съобщения за всеки тип грешка
                    switch (errorType) {
                        case "invalid_password":
                            response.put("field", "password");
                            response.put("title", "Invalid Password");
                            response.put("suggestion", "The password you entered is incorrect. Please check your password and try again.");
                            break;

                        case "invalid_email":
                            response.put("field", "email");
                            response.put("title", "Invalid Email Address");
                            response.put("suggestion", "No account exists with this email address. Please check your email or create a new account.");
                            break;

                        case "email_not_verified":
                            response.put("field", "email");
                            response.put("title", "Email Not Verified");
                            response.put("suggestion", "Please verify your email address before signing in. Check your inbox for the verification email.");
                            response.put("showResendButton", true);
                            break;

                        case "oauth_user":
                            response.put("field", "password");
                            response.put("title", "Google Account Detected");
                            response.put("suggestion", "This account was created with Google Sign-In. Please use the Google button to access your account.");
                            break;

                        case "account_disabled":
                            response.put("field", "email");
                            response.put("title", "Account Disabled");
                            response.put("suggestion", "Your account has been temporarily disabled. Please contact support for assistance.");
                            break;

                        case "email_required":
                            response.put("field", "email");
                            response.put("title", "Email Required");
                            response.put("suggestion", "Please enter your email address to continue.");
                            break;

                        case "password_required":
                            response.put("field", "password");
                            response.put("title", "Password Required");
                            response.put("suggestion", "Please enter your password to continue.");
                            break;

                        default:
                            response.put("field", "general");
                            response.put("title", "Sign In Failed");
                            response.put("suggestion", "Unable to sign in with the provided credentials. Please verify your information and try again.");
                            break;
                    }

                    System.out.println("📤 Sending login error response: " + errorType);
                    return ResponseEntity.ok(response);
                }
            }

            // Fallback response
            response.put("success", false);
            response.put("errorType", "system_error");
            response.put("message", "Authentication failed");
            response.put("field", "general");
            response.put("title", "System Error");
            response.put("suggestion", "A system error occurred. Please try again in a few moments.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.out.println("❌ Error in login-error endpoint: " + e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("errorType", "handler_error");
            errorResponse.put("message", "System error occurred");
            errorResponse.put("field", "general");
            errorResponse.put("title", "Technical Error");
            errorResponse.put("suggestion", "A technical error occurred. Please refresh the page and try again.");

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Helper method за получаване на current user ID в другите контролери
     * ОСТАВА СЪЩИЯ
     */
    public static Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated() ||
                    "anonymousUser".equals(authentication.getName())) {
                throw new RuntimeException("User not authenticated");
            }

            // OAuth потребител
            if (authentication.getPrincipal() instanceof CustomOAuth2User) {
                CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
                return oAuth2User.getUserId();
            }
            // Обикновен потребител - намираме ID по email
            else if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.User) {
                String email = authentication.getName();

                // Получаваме UserService през ApplicationContext
                UserService userService = applicationContext.getBean(UserService.class);
                User user = userService.findByEmail(email);
                return user.getId();
            }

            throw new RuntimeException("Unknown authentication type");

        } catch (Exception e) {
            throw new RuntimeException("User not authenticated: " + e.getMessage());
        }
    }
}