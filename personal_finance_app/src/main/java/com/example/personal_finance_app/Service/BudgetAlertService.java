package com.example.personal_finance_app.Service;


import com.example.personal_finance_app.Entity.Budget;
import com.example.personal_finance_app.Entity.BudgetAlert;
import com.example.personal_finance_app.Enum.AlertType;
import com.example.personal_finance_app.Repository.BudgetAlertRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Transactional
public class BudgetAlertService {

    private static final Logger logger = LoggerFactory.getLogger(BudgetAlertService.class);

    private final BudgetAlertRepository budgetAlertRepository;

    @Autowired
    public BudgetAlertService(BudgetAlertRepository budgetAlertRepository) {
        this.budgetAlertRepository = budgetAlertRepository;
    }

    /**
     * Създаване на предупредително известие
     */
    public BudgetAlert createBudgetWarningAlert(Budget budget, Integer thresholdPercentage) {
        logger.info("Creating warning alert for budget ID: {} at {}% threshold", budget.getId(), thresholdPercentage);

        // Проверка дали вече има активно предупреждение за този бюджет
        List<BudgetAlert> existingAlerts = budgetAlertRepository.findByUserIdAndIsRead(budget.getUser().getId(), false);
        boolean hasActiveWarning = existingAlerts.stream()
                .anyMatch(alert -> alert.getBudget().getId().equals(budget.getId()) &&
                        alert.getAlertType() == AlertType.WARNING);

        if (hasActiveWarning) {
            logger.debug("Warning alert already exists for budget ID: {}", budget.getId());
            return null; // Не създаваме дублиращо се известие
        }

        String categoryName = budget.getCategory() != null ? budget.getCategory().getName() : "Общ бюджет";
        BigDecimal spentPercentage = budget.getSpentPercentage();

        String message = String.format("Внимание! Приближавате се към лимита на бюджета за '%s'. " +
                        "Изразходили сте %.1f%% (%.2f лв.) от планираните %.2f лв. за %s.",
                categoryName,
                spentPercentage.doubleValue(),
                budget.getSpentAmount().doubleValue(),
                budget.getPlannedAmount().doubleValue(),
                budget.getBudgetPeriod());

        BudgetAlert alert = new BudgetAlert();
        alert.setBudget(budget);
        alert.setUser(budget.getUser());
        alert.setMessage(message);
        alert.setAlertType(AlertType.WARNING);
        alert.setThresholdPercentage(thresholdPercentage);
        alert.setIsRead(false);

        BudgetAlert savedAlert = budgetAlertRepository.save(alert);
        logger.info("Successfully created warning alert with ID: {}", savedAlert.getId());

        return savedAlert;
    }

    /**
     * Създаване на известие за превишен бюджет
     */
    public BudgetAlert createBudgetExceededAlert(Budget budget) {
        logger.info("Creating exceeded alert for budget ID: {}", budget.getId());

        // Проверка дали вече има активно известие за превишен бюджет
        List<BudgetAlert> existingAlerts = budgetAlertRepository.findByUserIdAndIsRead(budget.getUser().getId(), false);
        boolean hasActiveExceeded = existingAlerts.stream()
                .anyMatch(alert -> alert.getBudget().getId().equals(budget.getId()) &&
                        alert.getAlertType() == AlertType.EXCEEDED);

        if (hasActiveExceeded) {
            logger.debug("Exceeded alert already exists for budget ID: {}", budget.getId());
            return null; // Не създаваме дублиращо се известие
        }

        String categoryName = budget.getCategory() != null ? budget.getCategory().getName() : "Общ бюджет";
        BigDecimal overAmount = budget.getSpentAmount().subtract(budget.getPlannedAmount());

        String message = String.format("⚠️ ПРЕВИШЕН БЮДЖЕТ! Превишихте бюджета за '%s' с %.2f лв. " +
                        "Изразходили сте %.2f лв. от планираните %.2f лв. за %s.",
                categoryName,
                overAmount.doubleValue(),
                budget.getSpentAmount().doubleValue(),
                budget.getPlannedAmount().doubleValue(),
                budget.getBudgetPeriod());

        BudgetAlert alert = new BudgetAlert();
        alert.setBudget(budget);
        alert.setUser(budget.getUser());
        alert.setMessage(message);
        alert.setAlertType(AlertType.EXCEEDED);
        alert.setThresholdPercentage(100);
        alert.setIsRead(false);

        BudgetAlert savedAlert = budgetAlertRepository.save(alert);
        logger.info("Successfully created exceeded alert with ID: {}", savedAlert.getId());

        return savedAlert;
    }

    /**
     * Маркиране на известие като прочетено
     */
    public void markAlertAsRead(Long userId, Long alertId) {
        logger.info("Marking alert ID: {} as read for user ID: {}", alertId, userId);

        BudgetAlert alert = findUserAlert(userId, alertId);
        alert.markAsRead();
        budgetAlertRepository.save(alert);

        logger.info("Successfully marked alert ID: {} as read", alertId);
    }

    /**
     * Маркиране на всички известия като прочетени
     */
    public void markAllAlertsAsRead(Long userId) {
        logger.info("Marking all alerts as read for user ID: {}", userId);

        List<BudgetAlert> unreadAlerts = budgetAlertRepository.findByUserIdAndIsRead(userId, false);

        for (BudgetAlert alert : unreadAlerts) {
            alert.markAsRead();
        }

        budgetAlertRepository.saveAll(unreadAlerts);
        logger.info("Successfully marked {} alerts as read for user ID: {}", unreadAlerts.size(), userId);
    }

    /**
     * Изтриване на известие
     */
    public void deleteAlert(Long userId, Long alertId) {
        logger.info("Deleting alert ID: {} for user ID: {}", alertId, userId);

        BudgetAlert alert = findUserAlert(userId, alertId);
        budgetAlertRepository.delete(alert);

        logger.info("Successfully deleted alert ID: {}", alertId);
    }

    /**
     * Намиране на всички известия на потребител
     */
    @Transactional(readOnly = true)
    public List<BudgetAlert> findUserAlerts(Long userId) {
        return budgetAlertRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Намиране на непрочетени известия
     */
    @Transactional(readOnly = true)
    public List<BudgetAlert> findUnreadAlerts(Long userId) {
        return budgetAlertRepository.findByUserIdAndIsRead(userId, false);
    }

    /**
     * Броене на непрочетени известия
     */
    @Transactional(readOnly = true)
    public long countUnreadAlerts(Long userId) {
        return findUnreadAlerts(userId).size();
    }

    /**
     * Изчистване на стари известия (по-стари от 30 дни)
     */
    public void cleanupOldAlerts(Long userId) {
        logger.info("Cleaning up old alerts for user ID: {}", userId);

        List<BudgetAlert> allAlerts = findUserAlerts(userId);
        long thirtyDaysAgo = System.currentTimeMillis() - (30L * 24L * 60L * 60L * 1000L);

        List<BudgetAlert> oldAlerts = allAlerts.stream()
                .filter(alert -> alert.getCreatedAt().isBefore(
                        java.time.LocalDateTime.ofInstant(
                                java.time.Instant.ofEpochMilli(thirtyDaysAgo),
                                java.time.ZoneId.systemDefault())))
                .filter(BudgetAlert::getIsRead) // Изтриваме само прочетените
                .toList();

        budgetAlertRepository.deleteAll(oldAlerts);
        logger.info("Successfully cleaned up {} old alerts for user ID: {}", oldAlerts.size(), userId);
    }

    // Private helper methods
    private BudgetAlert findUserAlert(Long userId, Long alertId) {
        if (alertId == null || alertId <= 0) {
            throw new IllegalArgumentException("Alert ID must be a positive number");
        }

        return budgetAlertRepository.findById(alertId)
                .filter(alert -> alert.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Alert not found or access denied"));
    }
}