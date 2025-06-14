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

    // ===== HELPER METHODS =====

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
}