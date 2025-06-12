package com.example.personal_finance_app.Entity;

import jakarta.persistence.*;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "budgets")
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id") // Може да е null за общ месечен бюджет
    private Category category;

    @NotNull
    @DecimalMin(value = "0.01", message = "Planned amount must be greater than 0")
    @Column(name = "planned_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal plannedAmount;

    @Column(name = "spent_amount", precision = 12, scale = 2)
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @NotNull
    @Min(value = 2020, message = "Budget year must be valid")
    @Max(value = 2050, message = "Budget year must be valid")
    @Column(name = "budget_year", nullable = false)
    private Integer budgetYear;

    @NotNull
    @Min(value = 1, message = "Budget month must be between 1 and 12")
    @Max(value = 12, message = "Budget month must be between 1 and 12")
    @Column(name = "budget_month", nullable = false)
    private Integer budgetMonth;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @OneToMany(mappedBy = "budget", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BudgetAlert> alerts;

    // Constructors
    public Budget() {}

    public Budget(BigDecimal plannedAmount, Integer budgetYear, Integer budgetMonth) {
        this.plannedAmount = plannedAmount;
        this.budgetYear = budgetYear;
        this.budgetMonth = budgetMonth;
    }

    public Budget(User user, BigDecimal plannedAmount, Integer budgetYear, Integer budgetMonth) {
        this.user = user;
        this.plannedAmount = plannedAmount;
        this.budgetYear = budgetYear;
        this.budgetMonth = budgetMonth;
    }

    public Budget(User user, Category category, BigDecimal plannedAmount, Integer budgetYear, Integer budgetMonth) {
        this.user = user;
        this.category = category;
        this.plannedAmount = plannedAmount;
        this.budgetYear = budgetYear;
        this.budgetMonth = budgetMonth;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public BigDecimal getPlannedAmount() {
        return plannedAmount;
    }

    public void setPlannedAmount(BigDecimal plannedAmount) {
        this.plannedAmount = plannedAmount;
    }

    public BigDecimal getSpentAmount() {
        return spentAmount;
    }

    public void setSpentAmount(BigDecimal spentAmount) {
        this.spentAmount = spentAmount;
    }

    public Integer getBudgetYear() {
        return budgetYear;
    }

    public void setBudgetYear(Integer budgetYear) {
        this.budgetYear = budgetYear;
    }

    public Integer getBudgetMonth() {
        return budgetMonth;
    }

    public void setBudgetMonth(Integer budgetMonth) {
        this.budgetMonth = budgetMonth;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<BudgetAlert> getAlerts() {
        return alerts;
    }

    public void setAlerts(List<BudgetAlert> alerts) {
        this.alerts = alerts;
    }

    // Helper methods
    public BigDecimal getRemainingAmount() {
        return plannedAmount.subtract(spentAmount);
    }

    public BigDecimal getSpentPercentage() {
        if (plannedAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return spentAmount.divide(plannedAmount, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    public boolean isOverBudget() {
        return spentAmount.compareTo(plannedAmount) > 0;
    }

    public boolean isNearLimit(int percentage) {
        BigDecimal threshold = plannedAmount.multiply(BigDecimal.valueOf(percentage))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return spentAmount.compareTo(threshold) >= 0;
    }

    public boolean isGeneralBudget() {
        return category == null;
    }

    public boolean isCategoryBudget() {
        return category != null;
    }

    public String getBudgetPeriod() {
        return budgetYear + "-" + String.format("%02d", budgetMonth);
    }

    @Override
    public String toString() {
        return "Budget{" +
                "id=" + id +
                ", category=" + (category != null ? category.getName() : "General") +
                ", plannedAmount=" + plannedAmount +
                ", spentAmount=" + spentAmount +
                ", budgetYear=" + budgetYear +
                ", budgetMonth=" + budgetMonth +
                '}';
    }
}