package com.example.personal_finance_app.Controller;

import com.example.personal_finance_app.Entity.BudgetAlert;
import com.example.personal_finance_app.Service.BudgetAlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alerts")

public class BudgetAlertController {

    @Autowired
    private BudgetAlertService budgetAlertService;

    /**
     * Всички известия на потребителя
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUserAlerts() {
        try {
            Long userId = getCurrentUserId();
            List<BudgetAlert> alerts = budgetAlertService.findUserAlerts(userId);

            List<Map<String, Object>> response = alerts.stream()
                    .map(this::alertToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Непрочетени известия
     */
    @GetMapping("/unread")
    public ResponseEntity<List<Map<String, Object>>> getUnreadAlerts() {
        try {
            Long userId = getCurrentUserId();
            List<BudgetAlert> alerts = budgetAlertService.findUnreadAlerts(userId);

            List<Map<String, Object>> response = alerts.stream()
                    .map(this::alertToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Брой непрочетени известия
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Object>> getUnreadAlertsCount() {
        try {
            Long userId = getCurrentUserId();
            long count = budgetAlertService.countUnreadAlerts(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("count", count);
            response.put("hasUnread", count > 0);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Маркиране на известие като прочетено
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAlertAsRead(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            budgetAlertService.markAlertAsRead(userId, id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Известието беше маркирано като прочетено");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Маркиране на всички известия като прочетени
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAlertsAsRead() {
        try {
            Long userId = getCurrentUserId();
            budgetAlertService.markAllAlertsAsRead(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Всички известия бяха маркирани като прочетени");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Изтриване на известие
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteAlert(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            budgetAlertService.deleteAlert(userId, id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Известието беше изтрито успешно");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Изчистване на стари известия
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupOldAlerts() {
        try {
            Long userId = getCurrentUserId();
            budgetAlertService.cleanupOldAlerts(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Старите известия бяха изчистени успешно");
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

    private Map<String, Object> alertToMap(BudgetAlert alert) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", alert.getId());
        map.put("budgetId", alert.getBudget().getId());
        map.put("categoryName", alert.getCategoryName());
        map.put("budgetPeriod", alert.getBudgetPeriod());
        map.put("message", alert.getMessage());
        map.put("alertType", alert.getAlertType().name());
        map.put("thresholdPercentage", alert.getThresholdPercentage());
        map.put("isRead", alert.getIsRead());
        map.put("createdAt", alert.getCreatedAt());
        map.put("isWarning", alert.isWarning());
        map.put("isExceeded", alert.isExceeded());

        // Допълнителна информация за UI
        map.put("severity", alert.isExceeded() ? "danger" : "warning");
        map.put("icon", alert.isExceeded() ? "⚠️" : "📊");

        return map;
    }
}