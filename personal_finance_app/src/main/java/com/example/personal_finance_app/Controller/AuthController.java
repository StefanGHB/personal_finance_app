package com.example.personal_finance_app.Controller;

import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Service.CategoryService;
import com.example.personal_finance_app.Service.CustomOAuth2User;
import com.example.personal_finance_app.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private CategoryService categoryService;

    // Static reference за getCurrentUserId() method
    private static ApplicationContext applicationContext;

    @Autowired
    public void setApplicationContext(ApplicationContext context) {
        AuthController.applicationContext = context;
    }

    /**
     * API Register endpoint - създава нов акаунт
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerUser(@RequestBody Map<String, String> request) {
        try {
            User user = userService.registerUser(
                    request.get("email"),
                    request.get("password"),
                    request.get("firstName"),
                    request.get("lastName")
            );

            // Създаване на default категории за новия потребител
            categoryService.createDefaultCategoriesForUser(user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Регистрацията беше успешна! Моля логнете се.");
            response.put("redirectUrl", "/?register=success");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Получаване на текущия автентикиран потребител (поддържа и OAuth)
     */
    @GetMapping("/current-user")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated() ||
                    "anonymousUser".equals(authentication.getName())) {
                Map<String, Object> response = new HashMap<>();
                response.put("authenticated", false);
                return ResponseEntity.ok(response);
            }

            User user = null;

            // Проверка дали е OAuth потребител
            if (authentication.getPrincipal() instanceof CustomOAuth2User) {
                CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
                user = oAuth2User.getUser();
            }
            // Проверка дали е обикновен потребител
            else if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.User) {
                String email = authentication.getName();
                user = userService.findByEmail(email);
            }

            if (user == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("authenticated", false);
                response.put("error", "User not found");
                return ResponseEntity.ok(response);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("authenticated", true);
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("fullName", user.getFullName());
            response.put("provider", user.getProvider().name());
            response.put("isOAuthUser", user.isOAuthUser());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("authenticated", false);
            error.put("error", "Authentication error: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Helper method за получаване на current user ID в другите контролери
     * ФИКС: Сега работи както за OAuth, така и за обикновени потребители
     */
    public static Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated() ||
                    "anonymousUser".equals(authentication.getName())) {
                throw new RuntimeException("User not authenticated");
            }

            // OAuth потребител
            if (authentication.getPrincipal() instanceof CustomOAuth2User) {
                CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
                return oAuth2User.getUserId();
            }
            // Обикновен потребител - намираме ID по email
            else if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.User) {
                String email = authentication.getName();

                // Получаваме UserService през ApplicationContext
                UserService userService = applicationContext.getBean(UserService.class);
                User user = userService.findByEmail(email);
                return user.getId();
            }

            throw new RuntimeException("Unknown authentication type");

        } catch (Exception e) {
            throw new RuntimeException("User not authenticated: " + e.getMessage());
        }
    }
}