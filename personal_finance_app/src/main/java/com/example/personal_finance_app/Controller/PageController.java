package com.example.personal_finance_app.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class PageController {

    /**
     * Landing Page с Login форма
     * За НЕ-логнати потребители - показва информация за приложението + login форма
     */
    @GetMapping({"/", "/login"})
    public String landingPage(@RequestParam(value = "error", required = false) String error,
                              @RequestParam(value = "logout", required = false) String logout,
                              @RequestParam(value = "register", required = false) String register,
                              Model model) {

        if (error != null) {
            model.addAttribute("error", "Невалиден email или парола. Моля опитайте отново.");
        }

        if (logout != null) {
            model.addAttribute("message", "Успешно излязохте от системата.");
        }

        if (register != null && register.equals("success")) {
            model.addAttribute("message", "Регистрацията беше успешна! Моля логнете се.");
        }

        return "landing"; // landing.html template
    }

    /**
     * Register страница - за създаване на нов акаунт
     * За НЕ-логнати потребители - ако са логнати Spring Security ги пренасочва към dashboard
     */
    @GetMapping("/register")
    public String registerPage() {
        return "register"; // register.html template
    }

    /**
     * Dashboard страница - главната страница след успешен login
     * Spring Security автоматично пренасочва тук при успешен login
     */
    @GetMapping("/dashboard")
    public String dashboardPage() {
        return "dashboard"; // dashboard.html template
    }

    /**
     * App страници - различни секции на приложението (всички защитени)
     */
    @GetMapping("/app/transactions")
    public String transactionsPage() {
        return "pages/transactions";
    }

    @GetMapping("/app/categories")
    public String categoriesPage() {
        return "pages/categories";
    }

    @GetMapping("/app/budgets")
    public String budgetsPage() {
        return "pages/budgets";
    }

    @GetMapping("/app/reports")
    public String reportsPage() {
        return "pages/reports";
    }

    @GetMapping("/app/profile")
    public String profilePage() {
        return "pages/profile";
    }
}