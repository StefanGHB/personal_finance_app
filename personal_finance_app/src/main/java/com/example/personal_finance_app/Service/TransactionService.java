package com.example.personal_finance_app.Service;

import com.example.personal_finance_app.Entity.Category;
import com.example.personal_finance_app.Entity.Transaction;
import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Enum.TransactionType;
import com.example.personal_finance_app.Exeption.TransactionNotFoundException;
import com.example.personal_finance_app.Repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@Transactional
public class TransactionService {

    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final UserService userService;
    private final CategoryService categoryService;

    // ===== ИЗПОЛЗВАМЕ ApplicationContext ЗА LAZY LOADING =====
    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    public TransactionService(TransactionRepository transactionRepository,
                              UserService userService,
                              CategoryService categoryService) {
        this.transactionRepository = transactionRepository;
        this.userService = userService;
        this.categoryService = categoryService;
    }

    /**
     * Lazy injection на BudgetService за избягване на circular dependency
     */
    private BudgetService getBudgetService() {
        return applicationContext.getBean(BudgetService.class);
    }

    /**
     * Създаване на нова транзакция - ОБНОВЕНА С AUTO-UPDATE
     */
    public Transaction createTransaction(Long userId, Long categoryId, BigDecimal amount,
                                         String description, TransactionType type, LocalDate transactionDate) {
        logger.info("Creating transaction for user ID: {} with amount: {}", userId, amount);

        User user = userService.findById(userId);
        Category category = categoryService.findUserCategory(userId, categoryId);

        validateTransactionInput(amount, type, transactionDate);
        validateCategoryType(category, type);

        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setCategory(category);
        transaction.setAmount(amount);
        transaction.setDescription(StringUtils.hasText(description) ? description.trim() : null);
        transaction.setType(type);
        transaction.setTransactionDate(transactionDate != null ? transactionDate : LocalDate.now());

        Transaction savedTransaction = transactionRepository.save(transaction);
        logger.info("Successfully created transaction with ID: {}", savedTransaction.getId());

        // ===== АВТОМАТИЧНО ОБНОВЯВАНЕ НА БЮДЖЕТИ =====
        if (TransactionType.EXPENSE.equals(type)) {
            updateBudgetsAsync(userId, savedTransaction.getTransactionDate());
        }

        return savedTransaction;
    }

    /**
     * Обновяване на транзакция - ОБНОВЕНА С AUTO-UPDATE
     */
    public Transaction updateTransaction(Long userId, Long transactionId, Long categoryId,
                                         BigDecimal amount, String description, LocalDate transactionDate) {
        logger.info("Updating transaction ID: {} for user ID: {}", transactionId, userId);

        Transaction transaction = findUserTransaction(userId, transactionId);
        Category category = categoryService.findUserCategory(userId, categoryId);

        validateTransactionInput(amount, transaction.getType(), transactionDate);
        validateCategoryType(category, transaction.getType());

        // ===== ЗАПАЗВАНЕ НА СТАРИ СТОЙНОСТИ ЗА BUDGET UPDATE =====
        Long oldCategoryId = transaction.getCategory().getId();
        LocalDate oldTransactionDate = transaction.getTransactionDate();
        TransactionType transactionType = transaction.getType();

        transaction.setCategory(category);
        transaction.setAmount(amount);
        transaction.setDescription(StringUtils.hasText(description) ? description.trim() : null);
        transaction.setTransactionDate(transactionDate != null ? transactionDate : transaction.getTransactionDate());

        Transaction updatedTransaction = transactionRepository.save(transaction);
        logger.info("Successfully updated transaction ID: {}", transactionId);

        // ===== АВТОМАТИЧНО ОБНОВЯВАНЕ НА БЮДЖЕТИ =====
        if (TransactionType.EXPENSE.equals(transactionType)) {
            updateBudgetsForModifiedTransaction(userId, oldTransactionDate, updatedTransaction.getTransactionDate());
        }

        return updatedTransaction;
    }

    /**
     * Изтриване на транзакция - ОБНОВЕНА С AUTO-UPDATE
     */
    public void deleteTransaction(Long userId, Long transactionId) {
        logger.info("Deleting transaction ID: {} for user ID: {}", transactionId, userId);

        Transaction transaction = findUserTransaction(userId, transactionId);

        // ===== ЗАПАЗВАНЕ НА СТОЙНОСТИ ЗА BUDGET UPDATE =====
        LocalDate transactionDate = transaction.getTransactionDate();
        TransactionType type = transaction.getType();

        transactionRepository.delete(transaction);
        logger.info("Successfully deleted transaction ID: {}", transactionId);

        // ===== АВТОМАТИЧНО ОБНОВЯВАНЕ НА БЮДЖЕТИ =====
        if (TransactionType.EXPENSE.equals(type)) {
            updateBudgetsAsync(userId, transactionDate);
        }
    }

    /**
     * Асинхронно обновяване на бюджети за да избегнем блокиране
     */
    private void updateBudgetsAsync(Long userId, LocalDate transactionDate) {
        try {
            BudgetService budgetService = getBudgetService();
            budgetService.updateSpentAmounts(userId,
                    transactionDate.getYear(),
                    transactionDate.getMonthValue());
            logger.info("Auto-updated budgets for period {}-{}",
                    transactionDate.getYear(), transactionDate.getMonthValue());
        } catch (Exception e) {
            logger.warn("Failed to auto-update budgets for date {}: {}", transactionDate, e.getMessage());
        }
    }

    /**
     * Обновяване на бюджети за модифицирана транзакция
     */
    private void updateBudgetsForModifiedTransaction(Long userId, LocalDate oldDate, LocalDate newDate) {
        try {
            BudgetService budgetService = getBudgetService();

            // Обновяване на старият период
            budgetService.updateSpentAmounts(userId, oldDate.getYear(), oldDate.getMonthValue());

            // Обновяване на новият период (ако е различен)
            if (oldDate.getYear() != newDate.getYear() || oldDate.getMonthValue() != newDate.getMonthValue()) {
                budgetService.updateSpentAmounts(userId, newDate.getYear(), newDate.getMonthValue());
            }

            logger.info("Auto-updated budgets for modified transaction periods");
        } catch (Exception e) {
            logger.warn("Failed to auto-update budgets for modified transaction: {}", e.getMessage());
        }
    }

    // ===== ВСИЧКИ ОСТАНАЛИ МЕТОДИ ОСТАВАТ НЕПРОМЕНЕНИ =====

    /**
     * Намиране на транзакция по ID
     */
    @Transactional(readOnly = true)
    public Transaction findById(Long transactionId) {
        if (transactionId == null || transactionId <= 0) {
            throw new IllegalArgumentException("Transaction ID must be a positive number");
        }

        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with ID: " + transactionId));
    }

    /**
     * Намиране на транзакция принадлежаща на потребител
     */
    @Transactional(readOnly = true)
    public Transaction findUserTransaction(Long userId, Long transactionId) {
        Transaction transaction = findById(transactionId);

        if (!transaction.getUser().getId().equals(userId)) {
            throw new TransactionNotFoundException("Transaction not found or access denied");
        }

        return transaction;
    }

    /**
     * Всички транзакции на потребител (сортирани по дата)
     */
    @Transactional(readOnly = true)
    public List<Transaction> findUserTransactions(Long userId) {
        userService.findById(userId); // Валидиране че потребителят съществува
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(userId);
    }

    /**
     * Транзакции по тип
     */
    @Transactional(readOnly = true)
    public List<Transaction> findUserTransactionsByType(Long userId, TransactionType type) {
        if (type == null) {
            throw new IllegalArgumentException("Transaction type is required");
        }

        userService.findById(userId);
        return transactionRepository.findByUserIdAndType(userId, type);
    }

    /**
     * Транзакции за определен период
     */
    @Transactional(readOnly = true)
    public List<Transaction> findUserTransactionsByDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }

        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        userService.findById(userId);
        return transactionRepository.findByUserIdAndTransactionDateBetween(userId, startDate, endDate);
    }

    /**
     * Транзакции за конкретен месец
     */
    @Transactional(readOnly = true)
    public List<Transaction> findUserTransactionsByMonth(Long userId, int year, int month) {
        validateYearMonth(year, month);

        userService.findById(userId);
        return transactionRepository.findByUserIdAndYearAndMonth(userId, year, month);
    }

    /**
     * Транзакции за текущия месец
     */
    @Transactional(readOnly = true)
    public List<Transaction> findCurrentMonthTransactions(Long userId) {
        LocalDate now = LocalDate.now();
        return findUserTransactionsByMonth(userId, now.getYear(), now.getMonthValue());
    }

    /**
     * Общ баланс на потребител
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateUserBalance(Long userId) {
        List<Transaction> transactions = findUserTransactions(userId);

        BigDecimal totalIncome = transactions.stream()
                .filter(Transaction::isIncome)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = transactions.stream()
                .filter(Transaction::isExpense)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return totalIncome.subtract(totalExpenses);
    }

    /**
     * Баланс за конкретен месец
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateMonthlyBalance(Long userId, int year, int month) {
        List<Transaction> transactions = findUserTransactionsByMonth(userId, year, month);

        BigDecimal monthlyIncome = transactions.stream()
                .filter(Transaction::isIncome)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthlyExpenses = transactions.stream()
                .filter(Transaction::isExpense)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return monthlyIncome.subtract(monthlyExpenses);
    }

    /**
     * Общо приходи за период
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateTotalIncome(Long userId, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = findUserTransactionsByDateRange(userId, startDate, endDate);

        return transactions.stream()
                .filter(Transaction::isIncome)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Общо разходи за период
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateTotalExpenses(Long userId, LocalDate startDate, LocalDate endDate) {
        List<Transaction> transactions = findUserTransactionsByDateRange(userId, startDate, endDate);

        return transactions.stream()
                .filter(Transaction::isExpense)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Private helper methods
    private void validateTransactionInput(BigDecimal amount, TransactionType type, LocalDate transactionDate) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        if (type == null) {
            throw new IllegalArgumentException("Transaction type is required");
        }

        if (transactionDate != null && transactionDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Transaction date cannot be in the future");
        }
    }

    private void validateCategoryType(Category category, TransactionType transactionType) {
        if (!category.getType().equals(transactionType)) {
            throw new IllegalArgumentException("Category type must match transaction type");
        }
    }

    private void validateYearMonth(int year, int month) {
        if (year < 2020 || year > 2050) {
            throw new IllegalArgumentException("Year must be between 2020 and 2050");
        }

        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12");
        }

        YearMonth requestedMonth = YearMonth.of(year, month);
        YearMonth currentMonth = YearMonth.now();

        if (requestedMonth.isAfter(currentMonth)) {
            throw new IllegalArgumentException("Cannot retrieve transactions for future months");
        }
    }
}