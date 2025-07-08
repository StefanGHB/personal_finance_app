package com.example.personal_finance_app.Service;

import com.example.personal_finance_app.Entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@personalfinance.com}")
    private String fromEmail;

    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${app.password-reset.token-expiry-minutes:30}")
    private int tokenExpiryMinutes;

    // ===== ОРИГИНАЛНИ МЕТОДИ (ОСТАВАТ СЪЩИТЕ) =====

    /**
     * Изпраща confirmation email
     */
    public void sendConfirmationEmail(User user, String token) {
        try {
            String confirmationUrl = buildConfirmationUrl(token);
            String emailBody = buildConfirmationEmailBody(user.getFirstName(), confirmationUrl);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Confirm Your PersonalFinance Account");
            message.setText(emailBody);
            message.setFrom(fromEmail);

            mailSender.send(message);

            System.out.println("✅ Confirmation email sent to: " + user.getEmail());

        } catch (Exception e) {
            System.err.println("❌ Failed to send email to: " + user.getEmail());
            System.err.println("Error: " + e.getMessage());
            throw new RuntimeException("Failed to send confirmation email", e);
        }
    }

    /**
     * Изпраща welcome email след verification
     */
    public void sendWelcomeEmail(User user) {
        try {
            String emailBody = buildWelcomeEmailBody(user.getFirstName());

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Welcome to PersonalFinance! 🎉");
            message.setText(emailBody);
            message.setFrom(fromEmail);

            mailSender.send(message);

            System.out.println("✅ Welcome email sent to: " + user.getEmail());

        } catch (Exception e) {
            System.err.println("❌ Failed to send welcome email to: " + user.getEmail());
            // Don't throw exception for welcome email - it's not critical
        }
    }

    /**
     * Test email functionality
     */
    public boolean sendTestEmail(String toEmail) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("PersonalFinance - Test Email");
            message.setText("This is a test email from PersonalFinance app. If you received this, email configuration is working correctly!");
            message.setFrom(fromEmail);

            mailSender.send(message);
            return true;

        } catch (Exception e) {
            System.err.println("❌ Test email failed: " + e.getMessage());
            return false;
        }
    }

    // ===== НОВИ МЕТОДИ ЗА PASSWORD RESET =====

    /**
     * Изпраща password reset email
     */
    public void sendPasswordResetEmail(User user, String resetToken) {
        try {
            String resetUrl = buildPasswordResetUrl(resetToken);
            String emailBody = buildPasswordResetEmailBody(user.getFirstName(), resetUrl);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Reset Your PersonalFinance Password");
            message.setText(emailBody);
            message.setFrom(fromEmail);

            mailSender.send(message);

            System.out.println("✅ Password reset email sent to: " + user.getEmail());

        } catch (Exception e) {
            System.err.println("❌ Failed to send password reset email to: " + user.getEmail());
            System.err.println("Error: " + e.getMessage());
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    /**
     * Изпраща confirmation email след успешна смяна на парола
     */
    public void sendPasswordChangeConfirmationEmail(User user) {
        try {
            String emailBody = buildPasswordChangeConfirmationBody(user.getFirstName());

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Password Changed Successfully - PersonalFinance");
            message.setText(emailBody);
            message.setFrom(fromEmail);

            mailSender.send(message);

            System.out.println("✅ Password change confirmation email sent to: " + user.getEmail());

        } catch (Exception e) {
            System.err.println("❌ Failed to send password change confirmation email to: " + user.getEmail());
            // Don't throw exception - this is not critical
        }
    }

    /**
     * Изпраща security alert email при подозрителна активност
     */
    public void sendSecurityAlertEmail(User user, String alertType, String ipAddress) {
        try {
            String emailBody = buildSecurityAlertEmailBody(user.getFirstName(), alertType, ipAddress);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Security Alert - PersonalFinance Account");
            message.setText(emailBody);
            message.setFrom(fromEmail);

            mailSender.send(message);

            System.out.println("✅ Security alert email sent to: " + user.getEmail());

        } catch (Exception e) {
            System.err.println("❌ Failed to send security alert email to: " + user.getEmail());
            // Don't throw exception - this is not critical
        }
    }

    // ===== ОРИГИНАЛНИ HELPER METHODS =====

    private String buildConfirmationUrl(String token) {
        return "http://localhost:" + serverPort + "/confirm-email?token=" + token;
    }

    private String buildConfirmationEmailBody(String firstName, String confirmationUrl) {
        return String.format("""
            Hi %s,
            
            Welcome to PersonalFinance! 🎉
            
            To complete your account setup and start managing your finances, 
            please confirm your email address by clicking the link below:
            
            %s
            
            This link will expire in 24 hours.
            
            If you didn't create this account, please ignore this email.
            
            Best regards,
            The PersonalFinance Team
            
            ---
            PersonalFinance - Manage Your Finances Smart
            """, firstName, confirmationUrl);
    }

    private String buildWelcomeEmailBody(String firstName) {
        return String.format("""
            Hi %s,
            
            🎉 Your email has been confirmed successfully!
            
            You're now ready to:
            ✅ Track your income and expenses
            ✅ Create monthly budgets
            ✅ Set financial goals
            ✅ Get spending insights
            
            Get started: http://localhost:%s/dashboard
            
            Need help? Feel free to contact us anytime.
            
            Happy budgeting!
            The PersonalFinance Team
            
            ---
            PersonalFinance - Manage Your Finances Smart
            """, firstName, serverPort);
    }

    // ===== НОВИ HELPER METHODS ЗА PASSWORD RESET =====

    private String buildPasswordResetUrl(String resetToken) {
        return "http://localhost:" + serverPort + "/reset-password?token=" + resetToken;
    }

    private String buildPasswordResetEmailBody(String firstName, String resetUrl) {
        return String.format("""
            Hi %s,
            
            We received a request to reset your PersonalFinance password.
            
            To reset your password, please click the link below:
            
            %s
            
            ⚠️ IMPORTANT SECURITY INFORMATION:
            • This link will expire in %d minutes
            • If you didn't request this password reset, please ignore this email
            • Your password will remain unchanged until you create a new one
            • For your security, this link can only be used once
            
            If you're having trouble clicking the link, copy and paste it into your browser.
            
            Need help? Contact our support team.
            
            Best regards,
            The PersonalFinance Security Team
            
            ---
            PersonalFinance - Manage Your Finances Smart
            """, firstName, resetUrl, tokenExpiryMinutes);
    }

    private String buildPasswordChangeConfirmationBody(String firstName) {
        return String.format("""
            Hi %s,
            
            ✅ Your PersonalFinance password has been successfully changed.
            
            🔐 Password Change Details:
            • Date: %s
            • Time: %s
            • Status: Successful
            
            🛡️ SECURITY NOTICE:
            If you didn't make this change, please contact our support team immediately.
            Your account security is our top priority.
            
            What's Next:
            • You can now sign in with your new password
            • All your data and settings remain unchanged
            • Consider updating your password manager if you use one
            
            Security Tips:
            ✅ Use a unique password for your PersonalFinance account
            ✅ Never share your password with anyone
            ✅ Enable two-factor authentication when available
            
            Questions? Our support team is here to help.
            
            Best regards,
            The PersonalFinance Security Team
            
            ---
            PersonalFinance - Manage Your Finances Smart
            """, firstName,
                java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMMM dd, yyyy")),
                java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")));
    }

    private String buildSecurityAlertEmailBody(String firstName, String alertType, String ipAddress) {
        return String.format("""
            Hi %s,
            
            🚨 SECURITY ALERT - PersonalFinance Account
            
            We detected suspicious activity on your account:
            
            🔍 Alert Details:
            • Activity: %s
            • IP Address: %s
            • Date: %s
            • Time: %s
            
            🛡️ WHAT YOU SHOULD DO:
            
            If this was you:
            ✅ No action needed - your account is secure
            
            If this wasn't you:
            🚨 Change your password immediately
            🚨 Review your account activity
            🚨 Contact our support team
            
            🔐 Secure Your Account:
            1. Change your password: http://localhost:%s/forgot-password
            2. Review recent transactions in your dashboard
            3. Enable additional security measures
            
            ⚠️ IMPORTANT:
            • Never share your login credentials
            • Always access PersonalFinance through our official website
            • Be cautious of phishing emails
            
            Questions or concerns? Contact our security team immediately.
            
            Stay secure,
            The PersonalFinance Security Team
            
            ---
            PersonalFinance - Manage Your Finances Smart
            """, firstName, alertType, ipAddress,
                java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMMM dd, yyyy")),
                java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")),
                serverPort);
    }
}