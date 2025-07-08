package com.example.personal_finance_app.Controller;

import com.example.personal_finance_app.Service.EmailValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class PageController {

    @Autowired
    private EmailValidationService emailValidationService;

    /**
     * Landing Page - пренасочва към статичен HTML файл
     */
    @GetMapping("/")
    public String landingPage(@RequestParam(value = "error", required = false) String error,
                              @RequestParam(value = "logout", required = false) String logout,
                              @RequestParam(value = "register", required = false) String register,
                              @RequestParam(value = "password-changed", required = false) String passwordChanged,
                              @RequestParam(value = "view", required = false) String view,
                              @RequestParam(value = "token", required = false) String token) {

        System.out.println("🔍 Landing page accessed!");
        System.out.println("🔍 Parameters: error=" + error + ", logout=" + logout +
                ", register=" + register + ", password-changed=" + passwordChanged +
                ", view=" + view + ", token=" + (token != null ? token.substring(0, 8) + "..." : "null"));

        // Проверка дали потребителят е вече логнат
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("🔍 Authentication: " + (auth != null ? auth.getName() : "null"));

        if (auth != null && auth.isAuthenticated() &&
                !auth.getName().equals("anonymousUser")) {
            System.out.println("🔍 User authenticated, redirecting to dashboard");
            return "redirect:/dashboard";
        }

        // Пренасочва към статичния HTML файл с параметри
        String redirectUrl = "/static/index.html";
        StringBuilder params = new StringBuilder();

        // Build query parameters
        if (error != null) {
            appendParam(params, "error", error);
        }

        if (logout != null) {
            appendParam(params, "logout", logout);
        }

        if (register != null && register.equals("success")) {
            appendParam(params, "register", register);
        }

        if (passwordChanged != null && passwordChanged.equals("true")) {
            appendParam(params, "password-changed", passwordChanged);
        }

        // NEW: Handle special views (reset-password, etc.)
        if (view != null) {
            appendParam(params, "view", view);

            // If it's reset-password view, also pass the token
            if ("reset-password".equals(view) && token != null) {
                appendParam(params, "token", token);
            }
        }

        // Append parameters to URL if any exist
        if (params.length() > 0) {
            redirectUrl += "?" + params.toString();
        }

        System.out.println("🔍 Redirecting to: " + redirectUrl);
        return "redirect:" + redirectUrl;
    }

    /**
     * Email confirmation endpoint
     */
    @GetMapping("/confirm-email")
    public String confirmEmail(@RequestParam String token) {
        System.out.println("🔍 Email confirmation accessed with token: " +
                (token != null ? token.substring(0, 8) + "..." : "null"));

        try {
            boolean confirmed = emailValidationService.confirmEmail(token);

            if (confirmed) {
                System.out.println("✅ Email confirmed successfully!");
                return "redirect:/dashboard?confirmed=true";
            } else {
                System.out.println("❌ Email confirmation failed - invalid or expired token");
                return "redirect:/?error=invalid_token";
            }

        } catch (Exception e) {
            System.out.println("❌ Email confirmation error: " + e.getMessage());
            return "redirect:/?error=confirmation_failed";
        }
    }

    /**
     * Login страница - пренасочва към landing
     */
    @GetMapping("/login")
    public String loginPage() {
        System.out.println("🔍 Login page accessed - redirecting to landing");
        return "redirect:/";
    }

    /**
     * Register страница - пренасочва към landing
     */
    @GetMapping("/register")
    public String registerPage() {
        System.out.println("🔍 Register page accessed - redirecting to landing");
        return "redirect:/";
    }

    // ==========================================
    // PASSWORD RESET PAGES - REDIRECT TO LANDING
    // ==========================================

    /**
     * Forgot Password страница - пренасочва към landing с модал
     */
    @GetMapping("/forgot-password")
    public String forgotPasswordPage(@RequestParam(value = "email", required = false) String email,
                                     @RequestParam(value = "sent", required = false) String sent) {
        System.out.println("🔍 Forgot password page accessed");

        // Ако потребителят е логнат, пренасочи го към dashboard
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            System.out.println("🔍 User already authenticated, redirecting to dashboard");
            return "redirect:/dashboard";
        }

        // NEW: Redirect to landing with special view parameter
        String redirectUrl = "/?view=forgot-password";
        StringBuilder params = new StringBuilder();

        if (email != null && !email.trim().isEmpty()) {
            appendParam(params, "email", email.trim());
        }

        if ("true".equals(sent)) {
            appendParam(params, "sent", "true");
        }

        if (params.length() > 0) {
            redirectUrl += "&" + params.toString();
        }

        System.out.println("🔍 Redirecting to landing with forgot password view: " + redirectUrl);
        return "redirect:" + redirectUrl;
    }

    /**
     * Reset Password страница - пренасочва към landing с модал
     */
    @GetMapping("/reset-password")
    public String resetPasswordPage(@RequestParam(value = "token", required = false) String token,
                                    @RequestParam(value = "error", required = false) String error,
                                    @RequestParam(value = "success", required = false) String success) {
        System.out.println("🔍 Reset password page accessed with token: " +
                (token != null ? token.substring(0, 8) + "..." : "null"));

        // Ако потребителят е логнат, пренасочи го към dashboard
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            System.out.println("🔍 User already authenticated, redirecting to dashboard");
            return "redirect:/dashboard";
        }

        // NEW: Redirect to landing with reset-password view
        String redirectUrl = "/?view=reset-password";
        StringBuilder params = new StringBuilder();

        if (token != null && !token.trim().isEmpty()) {
            appendParam(params, "token", token.trim());
        } else {
            // Няма token - пренасочи към forgot password view
            System.out.println("🔍 No token provided, redirecting to forgot password view");
            return "redirect:/?view=forgot-password&error=no_token";
        }

        if (error != null) {
            appendParam(params, "error", error);
        }

        if ("true".equals(success)) {
            appendParam(params, "success", "true");
        }

        if (params.length() > 0) {
            redirectUrl += "&" + params.toString();
        }

        System.out.println("🔍 Redirecting to landing with reset password view: " + redirectUrl);
        return "redirect:" + redirectUrl;
    }

    // ==========================================
    // AUTHENTICATED PAGES (БЕЗ ПРОМЕНИ)
    // ==========================================

    /**
     * Dashboard страница - пренасочва към статичен HTML
     */
    @GetMapping("/dashboard")
    public String dashboardPage(@RequestParam(value = "confirmed", required = false) String confirmed) {
        System.out.println("🔍 Dashboard page accessed");

        // Проверка за автентикация
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            System.out.println("🔍 User not authenticated, redirecting to landing");
            return "redirect:/";
        }

        String redirectUrl = "/static/dashboard.html";

        if ("true".equals(confirmed)) {
            redirectUrl += "?confirmed=true";
        }

        System.out.println("🔍 Redirecting to dashboard: " + redirectUrl);
        return "redirect:" + redirectUrl;
    }

    /**
     * Transactions страница
     */
    @GetMapping("/transactions")
    public String transactionsPage() {
        System.out.println("🔍 Transactions page accessed");

        // Проверка за автентикация
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            System.out.println("🔍 User not authenticated, redirecting to landing");
            return "redirect:/";
        }

        System.out.println("🔍 Redirecting to transactions page");
        return "redirect:/static/transactions.html";
    }

    /**
     * Budgets страница
     */
    @GetMapping("/budgets")
    public String budgetsPage() {
        System.out.println("🔍 Budgets page accessed");

        // Проверка за автентикация
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            System.out.println("🔍 User not authenticated, redirecting to landing");
            return "redirect:/";
        }

        System.out.println("🔍 Redirecting to budgets page");
        return "redirect:/static/budgets.html";
    }

    /**
     * Categories страница
     */
    @GetMapping("/categories")
    public String categoriesPage() {
        System.out.println("🔍 Categories page accessed");

        // Проверка за автентикация
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            System.out.println("🔍 User not authenticated, redirecting to landing");
            return "redirect:/";
        }

        System.out.println("🔍 Redirecting to categories page");
        return "redirect:/static/categories.html";
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Helper method за добавяне на URL параметри
     */
    private void appendParam(StringBuilder params, String key, String value) {
        if (params.length() > 0) {
            params.append("&");
        }
        params.append(key).append("=").append(value);
    }
}