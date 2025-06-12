package com.example.personal_finance_app.Entity;

import com.example.personal_finance_app.Enum.AlertType;
import jakarta.persistence.*;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "budget_alerts")
public class BudgetAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_id", nullable = false)
    private Budget budget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Size(max = 1000)
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type")
    private AlertType alertType = AlertType.WARNING;

    @Min(value = 50, message = "Threshold percentage must be at least 50%")
    @Max(value = 100, message = "Threshold percentage cannot exceed 100%")
    @Column(name = "threshold_percentage")
    private Integer thresholdPercentage = 90;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public BudgetAlert() {}

    public BudgetAlert(String message) {
        this.message = message;
    }

    public BudgetAlert(Budget budget, User user, String message) {
        this.budget = budget;
        this.user = user;
        this.message = message;
    }

    public BudgetAlert(Budget budget, User user, String message, AlertType alertType) {
        this.budget = budget;
        this.user = user;
        this.message = message;
        this.alertType = alertType;
    }

    public BudgetAlert(Budget budget, User user, String message, AlertType alertType, Integer thresholdPercentage) {
        this.budget = budget;
        this.user = user;
        this.message = message;
        this.alertType = alertType;
        this.thresholdPercentage = thresholdPercentage;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Budget getBudget() {
        return budget;
    }

    public void setBudget(Budget budget) {
        this.budget = budget;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public AlertType getAlertType() {
        return alertType;
    }

    public void setAlertType(AlertType alertType) {
        this.alertType = alertType;
    }

    public Integer getThresholdPercentage() {
        return thresholdPercentage;
    }

    public void setThresholdPercentage(Integer thresholdPercentage) {
        this.thresholdPercentage = thresholdPercentage;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // Helper methods
    public void markAsRead() {
        this.isRead = true;
    }

    public void markAsUnread() {
        this.isRead = false;
    }

    public boolean isWarning() {
        return AlertType.WARNING.equals(this.alertType);
    }

    public boolean isExceeded() {
        return AlertType.EXCEEDED.equals(this.alertType);
    }

    public String getCategoryName() {
        if (budget != null && budget.getCategory() != null) {
            return budget.getCategory().getName();
        }
        return "Общ бюджет";
    }

    public String getBudgetPeriod() {
        if (budget != null) {
            return budget.getBudgetPeriod();
        }
        return "";
    }

    @Override
    public String toString() {
        return "BudgetAlert{" +
                "id=" + id +
                ", message='" + message + '\'' +
                ", alertType=" + alertType +
                ", thresholdPercentage=" + thresholdPercentage +
                ", isRead=" + isRead +
                ", createdAt=" + createdAt +
                '}';
    }
}