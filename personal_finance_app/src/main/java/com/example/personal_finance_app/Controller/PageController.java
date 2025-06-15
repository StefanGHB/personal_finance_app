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
                              @RequestParam(value = "register", required = false) String register) {

        System.out.println("🔍 Landing page accessed!");

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

        if (error != null) {
            if ("invalid_token".equals(error)) {
                redirectUrl += "?error=invalid_token";
            } else if ("confirmation_failed".equals(error)) {
                redirectUrl += "?error=confirmation_failed";
            } else {
                redirectUrl += "?error=true";
            }
        } else if (logout != null) {
            redirectUrl += "?logout=true";
        } else if (register != null && register.equals("success")) {
            redirectUrl += "?register=success";
        }

        System.out.println("🔍 Redirecting to: " + redirectUrl);
        return "redirect:" + redirectUrl;
    }

    /**
     * Email confirmation endpoint
     */
    @GetMapping("/confirm-email")
    public String confirmEmail(@RequestParam String token) {
        System.out.println("🔍 Email confirmation accessed with token: " + token.substring(0, 8) + "...");

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

    /**
     * Reports страница
     */
    @GetMapping("/reports")
    public String reportsPage() {
        System.out.println("🔍 Reports page accessed");

        // Проверка за автентикация
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            System.out.println("🔍 User not authenticated, redirecting to landing");
            return "redirect:/";
        }

        System.out.println("🔍 Redirecting to reports page");
        return "redirect:/static/reports.html";
    }

    /**
     * Settings страница
     */
    @GetMapping("/settings")
    public String settingsPage() {
        System.out.println("🔍 Settings page accessed");

        // Проверка за автентикация
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            System.out.println("🔍 User not authenticated, redirecting to landing");
            return "redirect:/";
        }

        System.out.println("🔍 Redirecting to settings page");
        return "redirect:/static/settings.html";
    }
}