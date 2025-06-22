package com.example.personal_finance_app.Controller;

import com.example.personal_finance_app.Entity.Category;
import com.example.personal_finance_app.Enum.TransactionType;
import com.example.personal_finance_app.Service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
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
     * Всички АКТИВНИ категории на потребителя
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
     * Всички категории включително архивирани (за reports)
     */
    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllUserCategories() {
        try {
            Long userId = getCurrentUserId();
            List<Category> categories = categoryService.findAllUserCategories(userId);

            List<Map<String, Object>> response = categories.stream()
                    .map(this::categoryToMapWithStatus)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Архивирани категории
     */
    @GetMapping("/archived")
    public ResponseEntity<List<Map<String, Object>>> getArchivedCategories() {
        try {
            Long userId = getCurrentUserId();
            List<Category> categories = categoryService.findDeletedUserCategories(userId);

            List<Map<String, Object>> response = categories.stream()
                    .map(this::categoryToMapWithStatus)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Категории по тип (само активни)
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
     * Получаване на конкретна категория (включително архивирани)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCategoryById(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            Category category = categoryService.findUserCategoryIncludingDeleted(userId, id);
            return ResponseEntity.ok(categoryToMapWithStatus(category));
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Статистики за категории
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCategoryStats() {
        try {
            Long userId = getCurrentUserId();
            CategoryService.CategoryStats stats = categoryService.getCategoryStats(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("activeCount", stats.getActiveCount());
            response.put("archivedCount", stats.getArchivedCount());
            response.put("totalCount", stats.getTotalCount());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Създаване на нова категория - ФИКСИРАНО за български символи
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createCategory(@RequestBody Map<String, String> request) {
        try {
            Long userId = getCurrentUserId();

            // ФИКС: Proper UTF-8 handling за български символи
            String categoryName = ensureUtf8Encoding(request.get("name"));
            String categoryColor = request.get("color");
            String categoryType = request.get("type");

            // Логване за debug
            System.out.println("=== CATEGORY CREATION DEBUG ===");
            System.out.println("Original name: " + request.get("name"));
            System.out.println("Processed name: " + categoryName);
            System.out.println("Name length: " + categoryName.length());
            System.out.println("Name bytes (UTF-8): " + java.util.Arrays.toString(categoryName.getBytes(StandardCharsets.UTF_8)));

            TransactionType type = TransactionType.valueOf(categoryType.toUpperCase());

            Category category = categoryService.createCategory(
                    userId,
                    categoryName,
                    type,
                    categoryColor
            );

            Map<String, Object> response = categoryToMap(category);
            response.put("success", true);
            response.put("message", "Category created successfully");

            // Debug логване на създадената категория
            System.out.println("Created category ID: " + category.getId());
            System.out.println("Created category name: " + category.getName());
            System.out.println("=== END DEBUG ===");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.err.println("ERROR creating category: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Обновяване на категория - ФИКСИРАНО за български символи
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCategory(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            Long userId = getCurrentUserId();

            // ФИКС: Proper UTF-8 handling за български символи
            String categoryName = ensureUtf8Encoding(request.get("name"));
            String categoryColor = request.get("color");

            Category category = categoryService.updateCategory(userId, id, categoryName, categoryColor);

            Map<String, Object> response = categoryToMap(category);
            response.put("success", true);
            response.put("message", "Category updated successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * АРХИВИРАНЕ на категория (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCategory(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            categoryService.deleteCategory(userId, id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Category archived successfully");
            response.put("note", "Category is hidden but transactions keep their relationship with it");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * ВЪЗСТАНОВЯВАНЕ на архивирана категория
     */
    @PostMapping("/{id}/restore")
    public ResponseEntity<Map<String, Object>> restoreCategory(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            Category category = categoryService.restoreCategory(userId, id);

            Map<String, Object> response = categoryToMap(category);
            response.put("success", true);
            response.put("message", "Category restored successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // ===== HELPER METHODS =====

    private Long getCurrentUserId() {
        return AuthController.getCurrentUserId();
    }

    /**
     * КЛЮЧОВ МЕТОД: Осигурява правилно UTF-8 кодиране за български символи
     */
    private String ensureUtf8Encoding(String input) {
        if (input == null) {
            return null;
        }

        try {
            // Trim whitespace
            String trimmed = input.trim();

            // Ensure proper UTF-8 encoding
            byte[] utf8Bytes = trimmed.getBytes(StandardCharsets.UTF_8);
            String utf8String = new String(utf8Bytes, StandardCharsets.UTF_8);

            return utf8String;
        } catch (Exception e) {
            System.err.println("UTF-8 encoding error: " + e.getMessage());
            return input.trim(); // Fallback
        }
    }

    private Map<String, Object> categoryToMap(Category category) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", category.getId());
        map.put("name", category.getName()); // Вече правилно UTF-8 кодирано
        map.put("type", category.getType().name());
        map.put("color", category.getColor());
        map.put("isDefault", category.getIsDefault());
        map.put("isIncomeCategory", category.isIncomeCategory());
        map.put("isExpenseCategory", category.isExpenseCategory());
        map.put("createdAt", category.getCreatedAt());
        map.put("updatedAt", category.getUpdatedAt());
        return map;
    }

    private Map<String, Object> categoryToMapWithStatus(Category category) {
        Map<String, Object> map = categoryToMap(category);
        map.put("isDeleted", category.getIsDeleted());
        map.put("deletedAt", category.getDeletedAt());
        map.put("isActive", category.isActive());
        return map;
    }
}