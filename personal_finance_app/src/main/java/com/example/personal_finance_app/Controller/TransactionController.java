package com.example.personal_finance_app.Controller;

import com.example.personal_finance_app.Entity.Transaction;
import com.example.personal_finance_app.Enum.TransactionType;
import com.example.personal_finance_app.Service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")

public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    /**
     * Всички транзакции на потребителя
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getUserTransactions() {
        try {
            Long userId = getCurrentUserId();
            List<Transaction> transactions = transactionService.findUserTransactions(userId);

            List<Map<String, Object>> response = transactions.stream()
                    .map(this::transactionToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Транзакции по тип
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Map<String, Object>>> getTransactionsByType(@PathVariable String type) {
        try {
            Long userId = getCurrentUserId();
            TransactionType transactionType = TransactionType.valueOf(type.toUpperCase());
            List<Transaction> transactions = transactionService.findUserTransactionsByType(userId, transactionType);

            List<Map<String, Object>> response = transactions.stream()
                    .map(this::transactionToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Транзакции за период
     */
    @GetMapping("/period")
    public ResponseEntity<List<Map<String, Object>>> getTransactionsByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            Long userId = getCurrentUserId();
            List<Transaction> transactions = transactionService.findUserTransactionsByDateRange(userId, startDate, endDate);

            List<Map<String, Object>> response = transactions.stream()
                    .map(this::transactionToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Транзакции за конкретен месец
     */
    @GetMapping("/month/{year}/{month}")
    public ResponseEntity<List<Map<String, Object>>> getTransactionsByMonth(@PathVariable int year, @PathVariable int month) {
        try {
            Long userId = getCurrentUserId();
            List<Transaction> transactions = transactionService.findUserTransactionsByMonth(userId, year, month);

            List<Map<String, Object>> response = transactions.stream()
                    .map(this::transactionToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Транзакции за текущия месец
     */
    @GetMapping("/current-month")
    public ResponseEntity<List<Map<String, Object>>> getCurrentMonthTransactions() {
        try {
            Long userId = getCurrentUserId();
            List<Transaction> transactions = transactionService.findCurrentMonthTransactions(userId);

            List<Map<String, Object>> response = transactions.stream()
                    .map(this::transactionToMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Получаване на конкретна транзакция
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTransactionById(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            Transaction transaction = transactionService.findUserTransaction(userId, id);
            return ResponseEntity.ok(transactionToMap(transaction));
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Създаване на нова транзакция
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTransaction(@RequestBody Map<String, Object> request) {
        try {
            Long userId = getCurrentUserId();
            TransactionType type = TransactionType.valueOf(request.get("type").toString().toUpperCase());

            Transaction transaction = transactionService.createTransaction(
                    userId,
                    Long.valueOf(request.get("categoryId").toString()),
                    new BigDecimal(request.get("amount").toString()),
                    (String) request.get("description"),
                    type,
                    request.get("transactionDate") != null ?
                            LocalDate.parse(request.get("transactionDate").toString()) : null
            );

            Map<String, Object> response = transactionToMap(transaction);
            response.put("success", true);
            response.put("message", "Транзакцията беше създадена успешно");

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Обновяване на транзакция
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateTransaction(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Long userId = getCurrentUserId();

            Transaction transaction = transactionService.updateTransaction(
                    userId,
                    id,
                    Long.valueOf(request.get("categoryId").toString()),
                    new BigDecimal(request.get("amount").toString()),
                    (String) request.get("description"),
                    request.get("transactionDate") != null ?
                            LocalDate.parse(request.get("transactionDate").toString()) : null
            );

            Map<String, Object> response = transactionToMap(transaction);
            response.put("success", true);
            response.put("message", "Транзакцията беше обновена успешно");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Изтриване на транзакция
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteTransaction(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            transactionService.deleteTransaction(userId, id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Транзакцията беше изтрита успешно");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Общ баланс
     */
    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getUserBalance() {
        try {
            Long userId = getCurrentUserId();
            BigDecimal balance = transactionService.calculateUserBalance(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("balance", balance);
            response.put("formatted", (balance.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + balance.toString() + " лв.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Баланс за месец
     */
    @GetMapping("/balance/{year}/{month}")
    public ResponseEntity<Map<String, Object>> getMonthlyBalance(@PathVariable int year, @PathVariable int month) {
        try {
            Long userId = getCurrentUserId();
            BigDecimal balance = transactionService.calculateMonthlyBalance(userId, year, month);

            Map<String, Object> response = new HashMap<>();
            response.put("balance", balance);
            response.put("formatted", (balance.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "") + balance.toString() + " лв.");
            response.put("year", year);
            response.put("month", month);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Helper methods
    private Long getCurrentUserId() {
        return AuthController.getCurrentUserId();
    }

    private Map<String, Object> transactionToMap(Transaction transaction) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", transaction.getId());
        map.put("categoryId", transaction.getCategory().getId());
        map.put("categoryName", transaction.getCategory().getName());
        map.put("categoryColor", transaction.getCategory().getColor());
        map.put("amount", transaction.getAmount());
        map.put("description", transaction.getDescription());
        map.put("type", transaction.getType().name());
        map.put("transactionDate", transaction.getTransactionDate());
        map.put("formattedAmount", transaction.getFormattedAmount());
        map.put("isIncome", transaction.isIncome());
        map.put("isExpense", transaction.isExpense());
        map.put("year", transaction.getYear());
        map.put("month", transaction.getMonth());
        return map;
    }
}