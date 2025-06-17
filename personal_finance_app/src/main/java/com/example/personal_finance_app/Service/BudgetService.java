package com.example.personal_finance_app.Service;

import com.example.personal_finance_app.Entity.Budget;
import com.example.personal_finance_app.Entity.Category;
import com.example.personal_finance_app.Entity.Transaction;
import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Enum.TransactionType;
import com.example.personal_finance_app.Exeption.BudgetNotFoundException;
import com.example.personal_finance_app.Repository.BudgetRepository;
import com.example.personal_finance_app.Repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BudgetService {

    private static final Logger logger = LoggerFactory.getLogger(BudgetService.class);

    private final BudgetRepository budgetRepository;
    private final UserService userService;
    private final CategoryService categoryService;
    private final BudgetAlertService budgetAlertService;

    // ===== ДИРЕКТЕН ДОСТЪП ДО TRANSACTION REPOSITORY ЗА ИЗБЯГВАНЕ НА CIRCULAR DEPENDENCY =====
    private final TransactionRepository transactionRepository;

    @Autowired
    public BudgetService(BudgetRepository budgetRepository,
                         UserService userService,
                         CategoryService categoryService,
                         BudgetAlertService budgetAlertService,
                         TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.userService = userService;
        this.categoryService = categoryService;
        this.budgetAlertService = budgetAlertService;
        this.transactionRepository = transactionRepository;
    }

    /**
     * Създаване на общ месечен бюджет
     */
    public Budget createGeneralBudget(Long userId, BigDecimal plannedAmount, Integer year, Integer month) {
        logger.info("Creating general budget for user ID: {} for period {}-{}", userId, year, month);

        User user = userService.findById(userId);
        validateBudgetInput(plannedAmount, year, month);

        // Проверка дали вече съществува общ бюджет за този период
        Optional<Budget> existingBudget = budgetRepository
                .findByUserIdAndCategoryIsNullAndBudgetYearAndBudgetMonth(userId, year, month);

        if (existingBudget.isPresent()) {
            throw new IllegalArgumentException("General budget already exists for period " + year + "-" +
                    String.format("%02d", month));
        }

        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(null); // Общ бюджет
        budget.setPlannedAmount(plannedAmount);
        budget.setSpentAmount(calculateCurrentSpentAmount(userId, null, year, month));
        budget.setBudgetYear(year);
        budget.setBudgetMonth(month);

        Budget savedBudget = budgetRepository.save(budget);
        logger.info("Successfully created general budget with ID: {}", savedBudget.getId());

        // Проверка за алерти
        checkBudgetAlerts(savedBudget);

        return savedBudget;
    }

    /**
     * Създаване на бюджет по категория
     */
    public Budget createCategoryBudget(Long userId, Long categoryId, BigDecimal plannedAmount,
                                       Integer year, Integer month) {
        logger.info("Creating category budget for user ID: {} and category ID: {} for period {}-{}",
                userId, categoryId, year, month);

        User user = userService.findById(userId);
        Category category = categoryService.findUserCategory(userId, categoryId);
        validateBudgetInput(plannedAmount, year, month);

        // Проверка че категорията е за разходи
        if (category.getType() != TransactionType.EXPENSE) {
            throw new IllegalArgumentException("Budgets can only be created for expense categories");
        }

        // Проверка дали вече съществува бюджет за тази категория и период
        Optional<Budget> existingBudget = budgetRepository
                .findByUserIdAndCategoryIdAndBudgetYearAndBudgetMonth(userId, categoryId, year, month);

        if (existingBudget.isPresent()) {
            throw new IllegalArgumentException("Budget already exists for this category and period");
        }

        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(category);
        budget.setPlannedAmount(plannedAmount);
        budget.setSpentAmount(calculateCurrentSpentAmount(userId, categoryId, year, month));
        budget.setBudgetYear(year);
        budget.setBudgetMonth(month);

        Budget savedBudget = budgetRepository.save(budget);
        logger.info("Successfully created category budget with ID: {}", savedBudget.getId());

        // Проверка за алерти
        checkBudgetAlerts(savedBudget);

        return savedBudget;
    }

    /**
     * Обновяване на бюджет
     */
    public Budget updateBudget(Long userId, Long budgetId, BigDecimal plannedAmount) {
        logger.info("Updating budget ID: {} for user ID: {}", budgetId, userId);

        Budget budget = findUserBudget(userId, budgetId);
        validatePlannedAmount(plannedAmount);

        budget.setPlannedAmount(plannedAmount);
        Budget updatedBudget = budgetRepository.save(budget);

        logger.info("Successfully updated budget ID: {}", budgetId);

        // Проверка за алерти след обновяване
        checkBudgetAlerts(updatedBudget);

        return updatedBudget;
    }

    /**
     * Изтриване на бюджет
     */
    public void deleteBudget(Long userId, Long budgetId) {
        logger.info("Deleting budget ID: {} for user ID: {}", budgetId, userId);

        Budget budget = findUserBudget(userId, budgetId);
        budgetRepository.delete(budget);

        logger.info("Successfully deleted budget ID: {}", budgetId);
    }

    /**
     * Намиране на бюджет по ID
     */
    @Transactional(readOnly = true)
    public Budget findById(Long budgetId) {
        if (budgetId == null || budgetId <= 0) {
            throw new IllegalArgumentException("Budget ID must be a positive number");
        }

        return budgetRepository.findById(budgetId)
                .orElseThrow(() -> new BudgetNotFoundException("Budget not found with ID: " + budgetId));
    }

    /**
     * Намиране на бюджет принадлежащ на потребител
     */
    @Transactional(readOnly = true)
    public Budget findUserBudget(Long userId, Long budgetId) {
        Budget budget = findById(budgetId);

        if (!budget.getUser().getId().equals(userId)) {
            throw new BudgetNotFoundException("Budget not found or access denied");
        }

        return budget;
    }

    /**
     * Всички бюджети на потребител
     */
    @Transactional(readOnly = true)
    public List<Budget> findUserBudgets(Long userId) {
        userService.findById(userId);
        return budgetRepository.findByUserId(userId);
    }

    /**
     * Бюджети за конкретен период
     */
    @Transactional(readOnly = true)
    public List<Budget> findUserBudgetsByPeriod(Long userId, Integer year, Integer month) {
        validateYearMonth(year, month);
        userService.findById(userId);
        return budgetRepository.findByUserIdAndBudgetYearAndBudgetMonth(userId, year, month);
    }

    /**
     * Бюджети за текущия месец
     */
    @Transactional(readOnly = true)
    public List<Budget> findCurrentMonthBudgets(Long userId) {
        LocalDate now = LocalDate.now();
        return findUserBudgetsByPeriod(userId, now.getYear(), now.getMonthValue());
    }

    /**
     * Общ месечен бюджет
     */
    @Transactional(readOnly = true)
    public Optional<Budget> findGeneralBudget(Long userId, Integer year, Integer month) {
        validateYearMonth(year, month);
        userService.findById(userId);
        return budgetRepository.findByUserIdAndCategoryIsNullAndBudgetYearAndBudgetMonth(userId, year, month);
    }

    /**
     * Обновяване на изразходваните суми за всички бюджети на потребител - ОБНОВЕНА
     */
    public void updateSpentAmounts(Long userId, Integer year, Integer month) {
        logger.info("Updating spent amounts for user ID: {} for period {}-{}", userId, year, month);

        List<Budget> budgets = findUserBudgetsByPeriod(userId, year, month);

        for (Budget budget : budgets) {
            BigDecimal currentSpent = calculateCurrentSpentAmount(userId,
                    budget.getCategory() != null ? budget.getCategory().getId() : null, year, month);

            // ===== ПРОВЕРКА ДАЛИ СУМАТА СЕ Е ПРОМЕНИЛА =====
            if (budget.getSpentAmount().compareTo(currentSpent) != 0) {
                budget.setSpentAmount(currentSpent);
                budgetRepository.save(budget);

                // Проверка за алерти само ако сумата се е променила
                checkBudgetAlerts(budget);

                logger.debug("Updated spent amount for budget ID: {} from {} to {}",
                        budget.getId(), budget.getSpentAmount(), currentSpent);
            }
        }

        logger.info("Successfully updated spent amounts for {} budgets", budgets.size());
    }

    /**
     * Проверка и генериране на алерти за бюджет
     */
    public void checkBudgetAlerts(Budget budget) {
        // Проверка дали бюджетът е превишен
        if (budget.isOverBudget()) {
            budgetAlertService.createBudgetExceededAlert(budget);
        }
        // Проверка дали се приближава към лимита (90%)
        else if (budget.isNearLimit(90)) {
            budgetAlertService.createBudgetWarningAlert(budget, 90);
        }
    }

    // ===== PRIVATE HELPER METHODS - ОБНОВЕНИ ЗА ИЗБЯГВАНЕ НА CIRCULAR DEPENDENCY =====

    /**
     * Изчисляване на текуща изразходвана сума - ИЗПОЛЗВА ДИРЕКТНО TRANSACTION REPOSITORY
     */
    private BigDecimal calculateCurrentSpentAmount(Long userId, Long categoryId, Integer year, Integer month) {
        // Използваме директно TransactionRepository вместо TransactionService
        List<Transaction> transactions = transactionRepository.findByUserIdAndYearAndMonth(userId, year, month);

        return transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .filter(t -> categoryId == null || t.getCategory().getId().equals(categoryId))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void validateBudgetInput(BigDecimal plannedAmount, Integer year, Integer month) {
        validatePlannedAmount(plannedAmount);
        validateYearMonth(year, month);
    }

    private void validatePlannedAmount(BigDecimal plannedAmount) {
        if (plannedAmount == null || plannedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Planned amount must be greater than zero");
        }
    }

    private void validateYearMonth(Integer year, Integer month) {
        if (year == null || year < 2020 || year > 2050) {
            throw new IllegalArgumentException("Year must be between 2020 and 2050");
        }

        if (month == null || month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12");
        }
    }
}