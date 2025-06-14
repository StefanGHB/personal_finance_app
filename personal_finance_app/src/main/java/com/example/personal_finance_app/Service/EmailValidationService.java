package com.example.personal_finance_app.Service;

import com.example.personal_finance_app.Entity.EmailConfirmationToken;
import com.example.personal_finance_app.Entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class EmailValidationService {

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    // Email format regex
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$");

    // Disposable email domains to block
    private static final Set<String> DISPOSABLE_DOMAINS = Set.of(
            "10minutemail.com", "temp-mail.org", "guerrillamail.com",
            "mailinator.com", "throwaway.email", "yopmail.com"
    );

    // Common domain typos to suggest
    private static final Map<String, String> DOMAIN_SUGGESTIONS = Map.of(
            "gmail.comm", "gmail.com",
            "gmial.com", "gmail.com",
            "yahooo.com", "yahoo.com",
            "outlok.com", "outlook.com",
            "hotmial.com", "hotmail.com",
            "abv.gb", "abv.bg"
    );

    /**
     * ЕТАП 1: Real-time validation за frontend
     */
    public EmailValidationResult validateEmailRealtime(String email) {
        EmailValidationResult result = new EmailValidationResult();

        try {
            // 1. Format validation
            if (!isValidFormat(email)) {
                result.setValid(false);
                result.setMessage("Invalid email format");
                result.setSeverity("error");
                return result;
            }

            // 2. Extract domain
            String domain = extractDomain(email);

            // 3. Check for typos and suggest corrections
            if (DOMAIN_SUGGESTIONS.containsKey(domain)) {
                result.setValid(false);
                result.setMessage("Did you mean: " + email.replace(domain, DOMAIN_SUGGESTIONS.get(domain)) + "?");
                result.setSeverity("warning");
                result.setSuggestion(email.replace(domain, DOMAIN_SUGGESTIONS.get(domain)));
                return result;
            }

            // 4. Check for disposable emails
            if (isDisposableEmail(domain)) {
                result.setValid(false);
                result.setMessage("Temporary email addresses are not allowed");
                result.setSeverity("error");
                return result;
            }

            // 5. DNS lookup
            if (!isDomainValid(domain)) {
                result.setValid(false);
                result.setMessage("Email domain does not exist");
                result.setSeverity("error");
                return result;
            }

            // All checks passed
            result.setValid(true);
            result.setMessage("Email format looks good");
            result.setSeverity("success");

        } catch (Exception e) {
            result.setValid(false);
            result.setMessage("Validation error occurred");
            result.setSeverity("error");
        }

        return result;
    }

    /**
     * ЕТАП 2: Pre-registration validation
     */
    public EmailValidationResult validateEmailForRegistration(String email) {
        // 1. All real-time checks
        EmailValidationResult realtimeResult = validateEmailRealtime(email);
        if (!realtimeResult.isValid()) {
            return realtimeResult;
        }

        // 2. Check if email already exists
        if (userService.emailExists(email)) {
            EmailValidationResult result = new EmailValidationResult();
            result.setValid(false);
            result.setMessage("An account with this email already exists");
            result.setSeverity("error");
            return result;
        }

        // All checks passed
        EmailValidationResult result = new EmailValidationResult();
        result.setValid(true);
        result.setMessage("Email is valid for registration");
        result.setSeverity("success");
        return result;
    }

    /**
     * ЕТАП 3: Send confirmation email
     */
    public EmailConfirmationToken sendConfirmationEmail(User user) {
        try {
            // 1. Check if user can receive new token
            if (!userService.canReceiveNewConfirmationToken(user.getEmail())) {
                throw new RuntimeException("A confirmation email was already sent recently");
            }

            // 2. Create confirmation token
            EmailConfirmationToken token = userService.createEmailConfirmationToken(user);

            // 3. Send email
            emailService.sendConfirmationEmail(user, token.getToken());

            return token;

        } catch (Exception e) {
            throw new RuntimeException("Failed to send confirmation email: " + e.getMessage());
        }
    }

    /**
     * Confirm email with token
     */
    public boolean confirmEmail(String token) {
        return userService.confirmEmailWithToken(token);
    }

    /**
     * Resend confirmation email
     */
    public EmailConfirmationToken resendConfirmationEmail(String email) {
        try {
            User user = userService.findByEmail(email);

            if (user.isEmailVerified()) {
                throw new RuntimeException("Email is already verified");
            }

            return sendConfirmationEmail(user);

        } catch (Exception e) {
            throw new RuntimeException("Failed to resend confirmation email: " + e.getMessage());
        }
    }

    // ===== HELPER METHODS =====

    private boolean isValidFormat(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }

    private String extractDomain(String email) {
        return email.substring(email.lastIndexOf("@") + 1).toLowerCase();
    }

    private boolean isDomainValid(String domain) {
        try {
            InetAddress.getByName(domain);
            return true;
        } catch (UnknownHostException e) {
            return false;
        }
    }

    private boolean isDisposableEmail(String domain) {
        return DISPOSABLE_DOMAINS.contains(domain.toLowerCase());
    }

    // ===== RESULT CLASS =====
    public static class EmailValidationResult {
        private boolean valid;
        private String message;
        private String severity; // success, info, warning, error
        private String suggestion;

        // Constructors
        public EmailValidationResult() {}

        public EmailValidationResult(boolean valid, String message, String severity) {
            this.valid = valid;
            this.message = message;
            this.severity = severity;
        }

        // Getters and setters
        public boolean isValid() { return valid; }
        public void setValid(boolean valid) { this.valid = valid; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public String getSuggestion() { return suggestion; }
        public void setSuggestion(String suggestion) { this.suggestion = suggestion; }

        @Override
        public String toString() {
            return "EmailValidationResult{" +
                    "valid=" + valid +
                    ", message='" + message + '\'' +
                    ", severity='" + severity + '\'' +
                    '}';
        }
    }
}