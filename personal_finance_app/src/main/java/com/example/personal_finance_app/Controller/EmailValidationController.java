package com.example.personal_finance_app.Controller;

import com.example.personal_finance_app.Service.EmailValidationService;
import com.example.personal_finance_app.Service.EmailValidationService.EmailValidationResult;
import com.example.personal_finance_app.Service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/email-validation")
public class EmailValidationController {

    @Autowired
    private EmailValidationService emailValidationService;

    @Autowired
    private EmailService emailService;

    /**
     * Real-time email validation за frontend
     */
    @PostMapping("/validate-realtime")
    public ResponseEntity<Map<String, Object>> validateEmailRealtime(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "valid", false,
                        "message", "Email is required",
                        "severity", "error"
                ));
            }

            EmailValidationResult result = emailValidationService.validateEmailRealtime(email.trim());

            Map<String, Object> response = new HashMap<>();
            response.put("valid", result.isValid());
            response.put("message", result.getMessage());
            response.put("severity", result.getSeverity());

            if (result.getSuggestion() != null) {
                response.put("suggestion", result.getSuggestion());
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "message", "Validation error: " + e.getMessage(),
                    "severity", "error"
            ));
        }
    }

    /**
     * Pre-registration email validation
     */
    @PostMapping("/validate-registration")
    public ResponseEntity<Map<String, Object>> validateEmailForRegistration(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "valid", false,
                        "message", "Email is required",
                        "severity", "error",
                        "canProceed", false
                ));
            }

            EmailValidationResult result = emailValidationService.validateEmailForRegistration(email.trim());

            Map<String, Object> response = new HashMap<>();
            response.put("valid", result.isValid());
            response.put("message", result.getMessage());
            response.put("severity", result.getSeverity());
            response.put("canProceed", result.isValid());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "message", "Registration validation error: " + e.getMessage(),
                    "severity", "error",
                    "canProceed", false
            ));
        }
    }

    /**
     * Test email configuration
     */
    @PostMapping("/test-email")
    public ResponseEntity<Map<String, Object>> testEmailConfiguration(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email is required"
                ));
            }

            boolean success = emailService.sendTestEmail(email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", success);
            response.put("message", success ?
                    "Test email sent successfully! Check your inbox." :
                    "Failed to send test email. Please check your email configuration.");
            response.put("email", email);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to send test email: " + e.getMessage()
            ));
        }
    }
}