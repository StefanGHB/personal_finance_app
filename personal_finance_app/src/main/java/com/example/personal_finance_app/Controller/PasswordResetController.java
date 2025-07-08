package com.example.personal_finance_app.Controller;


import com.example.personal_finance_app.Service.PasswordResetService;
import com.example.personal_finance_app.Service.PasswordResetService.PasswordResetResult;
import com.example.personal_finance_app.Service.PasswordResetService.TokenValidationResult;
import com.example.personal_finance_app.Service.PasswordResetService.PasswordChangeResult;
import com.example.personal_finance_app.Service.PasswordResetService.TokenStatistics;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/password-reset")
public class PasswordResetController {

    @Autowired
    private PasswordResetService passwordResetService;

    // ===== PUBLIC ENDPOINTS =====

    /**
     * Заявка за reset на парола
     * POST /api/password-reset/request
     */
    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> requestPasswordReset(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {

        try {
            String email = request.get("email");

            System.out.println("🔄 Password reset request received for email: " +
                    (email != null ? email.replaceAll("(.{3}).*(@.*)", "$1***$2") : "null"));

            // Validate input
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse(
                        "email_required",
                        "Email address is required",
                        "email"
                ));
            }

            // Process reset request
            PasswordResetResult result = passwordResetService.requestPasswordReset(email, httpRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("message", result.getMessage());

            if (!result.isSuccess()) {
                response.put("errorType", result.getErrorType());

                // Special handling for rate limiting
                if ("rate_limited".equals(result.getErrorType())) {
                    response.put("field", "general");
                    response.put("title", "Too Many Requests");
                    response.put("suggestion", "Please wait before requesting another password reset.");
                    return ResponseEntity.status(429).body(response); // 429 Too Many Requests
                }

                response.put("field", "email");
                return ResponseEntity.badRequest().body(response);
            }

            // Success response
            response.put("title", "Reset Link Sent");
            response.put("email", email);
            response.put("nextStep", "Check your email for reset instructions");

            System.out.println("✅ Password reset request processed successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error in password reset request: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse(
                    "system_error",
                    "Unable to process your request. Please try again later.",
                    "general"
            ));
        }
    }

    /**
     * Валидация на reset token
     * GET /api/password-reset/validate?token=xxx
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateResetToken(@RequestParam String token) {
        try {
            System.out.println("🔍 Token validation request: " +
                    (token != null ? token.substring(0, 8) + "..." : "null"));

            if (token == null || token.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse(
                        "invalid_token",
                        "Invalid reset link",
                        "token"
                ));
            }

            TokenValidationResult validation = passwordResetService.validateResetToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("valid", validation.isValid());
            response.put("message", validation.getMessage());

            if (!validation.isValid()) {
                response.put("errorType", "invalid_token");
                response.put("title", "Invalid Reset Link");
                response.put("suggestion", "This reset link is invalid or has expired. Please request a new one.");
                response.put("redirectUrl", "/forgot-password");
                return ResponseEntity.badRequest().body(response);
            }

            // Valid token - provide form data
            response.put("title", "Reset Your Password");
            response.put("userName", validation.getUser().getFirstName());
            response.put("email", validation.getUser().getEmail());
            response.put("tokenExpiry", validation.getToken().getMinutesUntilExpiry());
            response.put("canProceed", true);

            System.out.println("✅ Token validation successful");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error in token validation: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse(
                    "validation_error",
                    "Unable to validate reset link",
                    "token"
            ));
        }
    }

    /**
     * Смяна на парола с token
     * POST /api/password-reset/confirm
     */
    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmPasswordReset(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {

        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");
            String confirmPassword = request.get("confirmPassword");

            System.out.println("🔄 Password change attempt with token: " +
                    (token != null ? token.substring(0, 8) + "..." : "null"));

            // Validate inputs
            Map<String, Object> validationError = validatePasswordChangeInputs(token, newPassword, confirmPassword);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(validationError);
            }

            // Process password change
            PasswordChangeResult result = passwordResetService.changePassword(token, newPassword, httpRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("message", result.getMessage());

            if (!result.isSuccess()) {
                response.put("errorType", "password_change_failed");
                response.put("field", "newPassword");
                response.put("title", "Password Change Failed");
                response.put("suggestion", result.getMessage());
                return ResponseEntity.badRequest().body(response);
            }

            // Success response
            response.put("title", "Password Changed Successfully");
            response.put("redirectUrl", "/?password-changed=true");
            response.put("autoRedirect", true);
            response.put("redirectDelay", 3000); // 3 seconds

            System.out.println("✅ Password change completed successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error in password change: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse(
                    "system_error",
                    "Unable to change password. Please try again.",
                    "general"
            ));
        }
    }

    /**
     * Проверка на статус на token (за frontend polling)
     * GET /api/password-reset/status?token=xxx
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getTokenStatus(@RequestParam String token) {
        try {
            TokenValidationResult validation = passwordResetService.validateResetToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("valid", validation.isValid());
            response.put("expired", !validation.isValid());

            if (validation.isValid()) {
                response.put("minutesRemaining", validation.getToken().getMinutesUntilExpiry());
                response.put("percentageRemaining", calculatePercentageRemaining(validation.getToken().getMinutesUntilExpiry()));
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("valid", false, "expired", true));
        }
    }

    // ===== ADMIN/MONITORING ENDPOINTS =====

    /**
     * Статистики за системата (за monitoring)
     * GET /api/password-reset/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getSystemStatistics() {
        try {
            TokenStatistics stats = passwordResetService.getTokenStatistics();

            Map<String, Object> response = new HashMap<>();
            response.put("activeTokens", stats.getActiveTokens());
            response.put("usedTokensLast30Days", stats.getUsedTokensLast30Days());
            response.put("timestamp", java.time.LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error getting statistics: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", "Unable to retrieve statistics"));
        }
    }

    /**
     * Manual cleanup trigger (за maintenance)
     * POST /api/password-reset/cleanup
     */
    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> triggerCleanup() {
        try {
            passwordResetService.cleanupOldTokens();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Token cleanup completed successfully");
            response.put("timestamp", java.time.LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error during cleanup: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "Cleanup failed: " + e.getMessage()
            ));
        }
    }

    // ===== HELPER METHODS =====

    /**
     * Валидира входните данни за смяна на парола
     */
    private Map<String, Object> validatePasswordChangeInputs(String token, String newPassword, String confirmPassword) {
        if (token == null || token.trim().isEmpty()) {
            return createErrorResponse("invalid_token", "Invalid reset link", "token");
        }

        if (newPassword == null || newPassword.length() < 8) {
            return createErrorResponse("password_too_short", "Password must be at least 8 characters long", "newPassword");
        }

        if (confirmPassword == null || !newPassword.equals(confirmPassword)) {
            return createErrorResponse("passwords_mismatch", "Passwords do not match", "confirmPassword");
        }

        // Additional password strength validation
        if (!isPasswordStrong(newPassword)) {
            return createErrorResponse("weak_password",
                    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                    "newPassword");
        }

        return null; // No validation errors
    }

    /**
     * Проверява силата на паролата
     */
    private boolean isPasswordStrong(String password) {
        if (password.length() < 8) return false;

        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);

        return hasUpper && hasLower && hasDigit;
    }

    /**
     * Изчислява процента оставащо време
     */
    private int calculatePercentageRemaining(long minutesRemaining) {
        long totalMinutes = 30; // Default expiry time
        if (minutesRemaining <= 0) return 0;
        if (minutesRemaining >= totalMinutes) return 100;
        return (int) ((minutesRemaining * 100) / totalMinutes);
    }

    /**
     * Създава стандартизиран error response
     */
    private Map<String, Object> createErrorResponse(String errorType, String message, String field) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("errorType", errorType);
        response.put("message", message);
        response.put("field", field);

        // Add user-friendly titles based on error type
        switch (errorType) {
            case "email_required":
                response.put("title", "Email Required");
                response.put("suggestion", "Please enter your email address to continue.");
                break;
            case "invalid_token":
                response.put("title", "Invalid Reset Link");
                response.put("suggestion", "This reset link is invalid or has expired. Please request a new one.");
                break;
            case "password_too_short":
                response.put("title", "Password Too Short");
                response.put("suggestion", "Your password must be at least 8 characters long.");
                break;
            case "passwords_mismatch":
                response.put("title", "Passwords Don't Match");
                response.put("suggestion", "Please make sure both password fields match.");
                break;
            case "weak_password":
                response.put("title", "Password Too Weak");
                response.put("suggestion", "Use a mix of uppercase, lowercase letters, and numbers.");
                break;
            default:
                response.put("title", "Error");
                response.put("suggestion", "Please try again or contact support if the problem persists.");
        }

        return response;
    }
}