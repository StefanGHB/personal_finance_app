package com.example.personal_finance_app.Controller;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class PageController {

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
            return "redirect:/static/dashboard.html";
        }

        // Пренасочва към статичния HTML файл с параметри
        String redirectUrl = "/static/index.html";

        if (error != null) {
            redirectUrl += "?error=true";
        } else if (logout != null) {
            redirectUrl += "?logout=true";
        } else if (register != null && register.equals("success")) {
            redirectUrl += "?register=success";
        }

        System.out.println("🔍 Redirecting to: " + redirectUrl);
        return "redirect:" + redirectUrl;
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
    public String dashboardPage() {
        System.out.println("🔍 Dashboard page accessed");
        return "redirect:/static/dashboard.html";
    }
}