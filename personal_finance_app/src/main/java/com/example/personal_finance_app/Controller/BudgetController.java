package com.example.personal_finance_app.Controller;


import com.example.personal_finance_app.Entity.Budget;
import com.example.personal_finance_app.Service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    /**
     * Всички бюджети на потребителя
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUserBudgets() {
        try {
            Long userId = getCurrentUserId();
            List<Budget> budgets = budgetService.findUserBudgets(userId);

            List<Map<String, Object>> response = budgets.stream()
                    .map(this::budgetToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Бюджети за конкретен период
     */
    @GetMapping("/period/{year}/{month}")
    public ResponseEntity<List<Map<String, Object>>> getBudgetsByPeriod(@PathVariable Integer year, @PathVariable Integer month) {
        try {
            Long userId = getCurrentUserId();
            List<Budget> budgets = budgetService.findUserBudgetsByPeriod(userId, year, month);

            List<Map<String, Object>> response = budgets.stream()
                    .map(this::budgetToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Бюджети за текущия месец
     */
    @GetMapping("/current-month")
    public ResponseEntity<List<Map<String, Object>>> getCurrentMonthBudgets() {
        try {
            Long userId = getCurrentUserId();
            List<Budget> budgets = budgetService.findCurrentMonthBudgets(userId);

            List<Map<String, Object>> response = budgets.stream()
                    .map(this::budgetToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Общ месечен бюджет
     */
    @GetMapping("/general/{year}/{month}")
    public ResponseEntity<Map<String, Object>> getGeneralBudget(@PathVariable Integer year, @PathVariable Integer month) {
        try {
            Long userId = getCurrentUserId();
            Optional<Budget> budget = budgetService.findGeneralBudget(userId, year, month);

            if (budget.isPresent()) {
                return ResponseEntity.ok(budgetToMap(budget.get()));
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("found", false);
                response.put("message", "Няма намерен общ бюджет за този период");
                response.put("year", year);
                response.put("month", month);
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Получаване на конкретен бюджет
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBudgetById(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            Budget budget = budgetService.findUserBudget(userId, id);
            return ResponseEntity.ok(budgetToMap(budget));
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Създаване на общ месечен бюджет
     */
    @PostMapping("/general")
    public ResponseEntity<Map<String, Object>> createGeneralBudget(@RequestBody Map<String, Object> request) {
        try {
            Long userId = getCurrentUserId();

            Budget budget = budgetService.createGeneralBudget(
                    userId,
                    new BigDecimal(request.get("plannedAmount").toString()),
                    Integer.valueOf(request.get("year").toString()),
                    Integer.valueOf(request.get("month").toString())
            );

            Map<String, Object> response = budgetToMap(budget);
            response.put("success", true);
            response.put("message", "Общият месечен бюджет беше създаден успешно");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Създаване на бюджет по категория
     */
    @PostMapping("/category")
    public ResponseEntity<Map<String, Object>> createCategoryBudget(@RequestBody Map<String, Object> request) {
        try {
            Long userId = getCurrentUserId();

            Budget budget = budgetService.createCategoryBudget(
                    userId,
                    Long.valueOf(request.get("categoryId").toString()),
                    new BigDecimal(request.get("plannedAmount").toString()),
                    Integer.valueOf(request.get("year").toString()),
                    Integer.valueOf(request.get("month").toString())
            );

            Map<String, Object> response = budgetToMap(budget);
            response.put("success", true);
            response.put("message", "Бюджетът по категория беше създаден успешно");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Обновяване на бюджет
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBudget(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Long userId = getCurrentUserId();
            Budget budget = budgetService.updateBudget(
                    userId,
                    id,
                    new BigDecimal(request.get("plannedAmount").toString())
            );

            Map<String, Object> response = budgetToMap(budget);
            response.put("success", true);
            response.put("message", "Бюджетът беше обновен успешно");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Изтриване на бюджет
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteBudget(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            budgetService.deleteBudget(userId, id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Бюджетът беше изтрит успешно");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Обновяване на изразходваните суми
     */
    @PutMapping("/update-spent/{year}/{month}")
    public ResponseEntity<Map<String, Object>> updateSpentAmounts(@PathVariable Integer year, @PathVariable Integer month) {
        try {
            Long userId = getCurrentUserId();
            budgetService.updateSpentAmounts(userId, year, month);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Изразходваните суми бяха обновени успешно");
            response.put("year", year);
            response.put("month", month);
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

    private Map<String, Object> budgetToMap(Budget budget) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", budget.getId());
        map.put("categoryId", budget.getCategory() != null ? budget.getCategory().getId() : null);
        map.put("categoryName", budget.getCategory() != null ? budget.getCategory().getName() : "Общ бюджет");
        map.put("categoryColor", budget.getCategory() != null ? budget.getCategory().getColor() : null);
        map.put("plannedAmount", budget.getPlannedAmount());
        map.put("spentAmount", budget.getSpentAmount());
        map.put("remainingAmount", budget.getRemainingAmount());
        map.put("spentPercentage", budget.getSpentPercentage());
        map.put("isOverBudget", budget.isOverBudget());
        map.put("isNearLimit90", budget.isNearLimit(90));
        map.put("budgetYear", budget.getBudgetYear());
        map.put("budgetMonth", budget.getBudgetMonth());
        map.put("budgetPeriod", budget.getBudgetPeriod());
        map.put("isGeneralBudget", budget.isGeneralBudget());
        map.put("isCategoryBudget", budget.isCategoryBudget());
        return map;
    }
}