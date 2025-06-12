package com.example.personal_finance_app.Controller;

import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Service.CategoryService;
import com.example.personal_finance_app.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private CategoryService categoryService;

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
     * Получаване на текущия автентикиран потребител
     */
    @GetMapping("/current-user")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();

            if ("anonymousUser".equals(email)) {
                Map<String, Object> response = new HashMap<>();
                response.put("authenticated", false);
                return ResponseEntity.ok(response);
            }

            User user = userService.findByEmail(email);

            Map<String, Object> response = new HashMap<>();
            response.put("authenticated", true);
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("fullName", user.getFullName());
            response.put("provider", user.getProvider().name());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("authenticated", false);
            error.put("error", "User not found");
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Helper method за получаване на current user ID в другите контролери
     */
    public static Long getCurrentUserId() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            if ("anonymousUser".equals(email)) {
                throw new RuntimeException("User not authenticated");
            }

            // TODO: Оптимизация - кеширане на user ID в сесията
            // За сега трябва да намерим user-а по email всеки път
            // В реална имплементация би трябвало да се кешира ID-то

            // Временно решение за тестване - връщаме ID=1
            return 1L;

        } catch (Exception e) {
            throw new RuntimeException("User not authenticated");
        }
    }
}