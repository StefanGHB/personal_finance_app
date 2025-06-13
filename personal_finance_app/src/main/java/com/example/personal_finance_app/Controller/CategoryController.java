package com.example.personal_finance_app.Controller;


import com.example.personal_finance_app.Entity.Category;
import com.example.personal_finance_app.Enum.TransactionType;
import com.example.personal_finance_app.Service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")

public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    /**
     * Всички категории на потребителя
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUserCategories() {
        try {
            Long userId = getCurrentUserId();
            List<Category> categories = categoryService.findUserCategories(userId);

            List<Map<String, Object>> response = categories.stream()
                    .map(this::categoryToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Категории по тип (INCOME/EXPENSE)
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Map<String, Object>>> getCategoriesByType(@PathVariable String type) {
        try {
            Long userId = getCurrentUserId();
            TransactionType transactionType = TransactionType.valueOf(type.toUpperCase());
            List<Category> categories = categoryService.findUserCategoriesByType(userId, transactionType);

            List<Map<String, Object>> response = categories.stream()
                    .map(this::categoryToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Получаване на конкретна категория
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCategoryById(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            Category category = categoryService.findUserCategory(userId, id);
            return ResponseEntity.ok(categoryToMap(category));
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Създаване на нова категория
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createCategory(@RequestBody Map<String, String> request) {
        try {
            Long userId = getCurrentUserId();
            TransactionType type = TransactionType.valueOf(request.get("type").toUpperCase());

            Category category = categoryService.createCategory(
                    userId,
                    request.get("name"),
                    type,
                    request.get("color")
            );

            Map<String, Object> response = categoryToMap(category);
            response.put("success", true);
            response.put("message", "Категорията беше създадена успешно");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Обновяване на категория
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCategory(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            Long userId = getCurrentUserId();
            Category category = categoryService.updateCategory(userId, id, request.get("name"), request.get("color"));

            Map<String, Object> response = categoryToMap(category);
            response.put("success", true);
            response.put("message", "Категорията беше обновена успешно");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Изтриване на категория
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCategory(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            categoryService.deleteCategory(userId, id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Категорията беше изтрита успешно");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Helper methods
    private Long getCurrentUserId() {
        return AuthController.getCurrentUserId();
    }

    private Map<String, Object> categoryToMap(Category category) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", category.getId());
        map.put("name", category.getName());
        map.put("type", category.getType().name());
        map.put("color", category.getColor());
        map.put("isDefault", category.getIsDefault());
        map.put("isIncomeCategory", category.isIncomeCategory());
        map.put("isExpenseCategory", category.isExpenseCategory());
        return map;
    }
}