package com.example.personal_finance_app.Service;

import com.example.personal_finance_app.Entity.PasswordResetToken;
import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Repository.PasswordResetTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Configuration values
    @Value("${app.password-reset.token-expiry-minutes:30}")
    private int tokenExpiryMinutes;

    @Value("${app.password-reset.max-requests-per-hour:3}")
    private int maxRequestsPerHour;

    @Value("${app.password-reset.cleanup-interval-hours:24}")
    private int cleanupIntervalHours;

    @Value("${app.password-reset.max-ip-requests-per-hour:10}")
    private int maxIpRequestsPerHour;

    // ===== PUBLIC API METHODS =====

    /**
     * Създава заявка за reset на парола
     */
    @Transactional
    public PasswordResetResult requestPasswordReset(String email, HttpServletRequest request) {
        try {
            System.out.println("🔄 Password reset requested for email: " + email);

            // 1. Validate email input
            if (email == null || email.trim().isEmpty()) {
                return PasswordResetResult.error("Email address is required");
            }

            email = email.trim().toLowerCase();

            // 2. Security checks
            String ipAddress = getClientIpAddress(request);
            if (!isRequestAllowed(email, ipAddress)) {
                System.out.println("🚫 Rate limit exceeded for email: " + email + " or IP: " + ipAddress);
                return PasswordResetResult.rateLimited("Too many requests. Please try again later.");
            }

            // 3. Find user (important: don't leak if user exists)
            User user;
            try {
                user = userService.findByEmail(email);
            } catch (RuntimeException e) {
                // User doesn't exist - return generic success message for security
                System.out.println("🔍 User not found for email: " + email);
                return PasswordResetResult.success("If this email address exists in our system, you will receive a password reset link.");
            }

            // 4. Check if user can reset password
            if (!user.getIsEnabled()) {
                System.out.println("🚫 Account disabled for email: " + email);
                return PasswordResetResult.success("If this email address exists in our system, you will receive a password reset link.");
            }

            // 5. Check if it's OAuth user
            if (user.isOAuthUser()) {
                System.out.println("🔍 OAuth user attempted password reset: " + email);
                return PasswordResetResult.error("This account uses Google Sign-In. Please sign in with Google.");
            }

            // 6. Invalidate all existing tokens for security
            invalidateExistingTokens(user);

            // 7. Generate new token
            String token = generateSecureToken();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(tokenExpiryMinutes);
            String userAgent = request.getHeader("User-Agent");

            PasswordResetToken resetToken = new PasswordResetToken(token, user, expiresAt, ipAddress, userAgent);
            passwordResetTokenRepository.save(resetToken);

            // 8. Send email
            emailService.sendPasswordResetEmail(user, token);

            System.out.println("✅ Password reset token created for user: " + email);
            return PasswordResetResult.success("Password reset instructions have been sent to your email address.");

        } catch (Exception e) {
            System.err.println("❌ Error during password reset request: " + e.getMessage());
            e.printStackTrace();
            return PasswordResetResult.error("Unable to process password reset request. Please try again later.");
        }
    }

    /**
     * Валидира reset token
     */
    public TokenValidationResult validateResetToken(String token) {
        try {
            System.out.println("🔍 Validating reset token: " + (token != null ? token.substring(0, 8) + "..." : "null"));

            if (token == null || token.trim().isEmpty()) {
                return TokenValidationResult.invalid("Invalid reset link");
            }

            Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findValidToken(token, LocalDateTime.now());

            if (tokenOpt.isEmpty()) {
                System.out.println("🚫 Invalid or expired token");
                return TokenValidationResult.invalid("This reset link is invalid or has expired");
            }

            PasswordResetToken resetToken = tokenOpt.get();
            User user = resetToken.getUser();

            // Additional security checks
            if (!user.getIsEnabled()) {
                System.out.println("🚫 Account disabled for token validation");
                return TokenValidationResult.invalid("Account is disabled");
            }

            if (user.isOAuthUser()) {
                System.out.println("🚫 OAuth user token validation");
                return TokenValidationResult.invalid("This account uses Google Sign-In");
            }

            System.out.println("✅ Token validation successful for user: " + user.getEmail());
            return TokenValidationResult.valid(resetToken, user);

        } catch (Exception e) {
            System.err.println("❌ Error during token validation: " + e.getMessage());
            return TokenValidationResult.invalid("Unable to validate reset link");
        }
    }

    /**
     * Сменя паролата с валиден token
     */
    @Transactional
    public PasswordChangeResult changePassword(String token, String newPassword, HttpServletRequest request) {
        try {
            System.out.println("🔄 Password change attempt with token: " + (token != null ? token.substring(0, 8) + "..." : "null"));

            // 1. Validate inputs
            if (token == null || token.trim().isEmpty()) {
                return PasswordChangeResult.error("Invalid reset link");
            }

            if (newPassword == null || newPassword.length() < 8) {
                return PasswordChangeResult.error("Password must be at least 8 characters long");
            }

            // 2. Validate token
            TokenValidationResult validation = validateResetToken(token);
            if (!validation.isValid()) {
                return PasswordChangeResult.error(validation.getMessage());
            }

            PasswordResetToken resetToken = validation.getToken();
            User user = validation.getUser();

            // 3. Security check: prevent reuse of old password
            if (passwordEncoder.matches(newPassword, user.getPassword())) {
                return PasswordChangeResult.error("New password must be different from your current password");
            }

            // 4. Update password
            String encodedPassword = passwordEncoder.encode(newPassword);
            user.setPassword(encodedPassword);
            userService.updateUserPassword(user.getId(), encodedPassword);

            // 5. Mark token as used
            resetToken.markAsUsed();
            passwordResetTokenRepository.save(resetToken);

            // 6. Invalidate all other tokens for security
            invalidateExistingTokens(user);

            // 7. Send confirmation email
            emailService.sendPasswordChangeConfirmationEmail(user);

            // 8. Log security event
            String ipAddress = getClientIpAddress(request);
            System.out.println("✅ Password successfully changed for user: " + user.getEmail() + " from IP: " + ipAddress);

            return PasswordChangeResult.success("Your password has been successfully updated. You can now sign in with your new password.");

        } catch (Exception e) {
            System.err.println("❌ Error during password change: " + e.getMessage());
            e.printStackTrace();
            return PasswordChangeResult.error("Unable to update password. Please try again.");
        }
    }

    // ===== SECURITY & VALIDATION METHODS =====

    /**
     * Проверява дали заявката е позволена (rate limiting)
     */
    private boolean isRequestAllowed(String email, String ipAddress) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

        try {
            // Check user-specific rate limit
            User user = userService.findByEmail(email);
            long userRequests = passwordResetTokenRepository.countTokensCreatedSince(user, oneHourAgo);
            if (userRequests >= maxRequestsPerHour) {
                return false;
            }
        } catch (RuntimeException e) {
            // User doesn't exist - still check IP limit
        }

        // Check IP-based rate limit
        long ipRequests = passwordResetTokenRepository.countTokensByIpAddressSince(ipAddress, oneHourAgo);
        return ipRequests < maxIpRequestsPerHour;
    }

    /**
     * Инвалидира всички съществуващи токени за потребител
     */
    private void invalidateExistingTokens(User user) {
        passwordResetTokenRepository.invalidateAllUserTokens(user, LocalDateTime.now());
        System.out.println("🔄 Invalidated existing tokens for user: " + user.getEmail());
    }

    /**
     * Генерира сигурен token
     */
    private String generateSecureToken() {
        return UUID.randomUUID().toString() + "-" + System.currentTimeMillis();
    }

    /**
     * Получава IP адреса на клиента
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    // ===== MAINTENANCE METHODS =====

    /**
     * Почиства стари и изтекли токени
     */
    @Transactional
    public void cleanupOldTokens() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime cutoffDate = now.minusHours(cleanupIntervalHours);

            // Delete expired tokens
            int expiredCount = passwordResetTokenRepository.deleteExpiredTokens(now);

            // Delete old used tokens
            int oldUsedCount = passwordResetTokenRepository.deleteUsedTokensOlderThan(cutoffDate);

            // Delete very old unused tokens
            LocalDateTime veryOldCutoff = now.minusDays(7);
            int veryOldCount = passwordResetTokenRepository.deleteOldTokens(veryOldCutoff);

            System.out.println("🧹 Token cleanup completed. Removed: " +
                    expiredCount + " expired, " +
                    oldUsedCount + " old used, " +
                    veryOldCount + " very old tokens");

        } catch (Exception e) {
            System.err.println("❌ Error during token cleanup: " + e.getMessage());
        }
    }

    /**
     * Получава статистика за токените
     */
    public TokenStatistics getTokenStatistics() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime thirtyDaysAgo = now.minusDays(30);

            long activeTokens = passwordResetTokenRepository.countActiveTokens(now);
            long usedTokensLast30Days = passwordResetTokenRepository.countUsedTokensSince(thirtyDaysAgo);

            return new TokenStatistics(activeTokens, usedTokensLast30Days);

        } catch (Exception e) {
            System.err.println("❌ Error getting token statistics: " + e.getMessage());
            return new TokenStatistics(0, 0);
        }
    }

    // ===== RESULT CLASSES =====

    public static class PasswordResetResult {
        private final boolean success;
        private final String message;
        private final String errorType;

        private PasswordResetResult(boolean success, String message, String errorType) {
            this.success = success;
            this.message = message;
            this.errorType = errorType;
        }

        public static PasswordResetResult success(String message) {
            return new PasswordResetResult(true, message, null);
        }

        public static PasswordResetResult error(String message) {
            return new PasswordResetResult(false, message, "error");
        }

        public static PasswordResetResult rateLimited(String message) {
            return new PasswordResetResult(false, message, "rate_limited");
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public String getErrorType() { return errorType; }
    }

    public static class TokenValidationResult {
        private final boolean valid;
        private final String message;
        private final PasswordResetToken token;
        private final User user;

        private TokenValidationResult(boolean valid, String message, PasswordResetToken token, User user) {
            this.valid = valid;
            this.message = message;
            this.token = token;
            this.user = user;
        }

        public static TokenValidationResult valid(PasswordResetToken token, User user) {
            return new TokenValidationResult(true, "Token is valid", token, user);
        }

        public static TokenValidationResult invalid(String message) {
            return new TokenValidationResult(false, message, null, null);
        }

        // Getters
        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
        public PasswordResetToken getToken() { return token; }
        public User getUser() { return user; }
    }

    public static class PasswordChangeResult {
        private final boolean success;
        private final String message;

        private PasswordChangeResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public static PasswordChangeResult success(String message) {
            return new PasswordChangeResult(true, message);
        }

        public static PasswordChangeResult error(String message) {
            return new PasswordChangeResult(false, message);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }

    public static class TokenStatistics {
        private final long activeTokens;
        private final long usedTokensLast30Days;

        public TokenStatistics(long activeTokens, long usedTokensLast30Days) {
            this.activeTokens = activeTokens;
            this.usedTokensLast30Days = usedTokensLast30Days;
        }

        // Getters
        public long getActiveTokens() { return activeTokens; }
        public long getUsedTokensLast30Days() { return usedTokensLast30Days; }
    }
}