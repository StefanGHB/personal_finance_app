package com.example.personal_finance_app.Entity;

import com.example.personal_finance_app.Enum.AuthProvider;
import jakarta.persistence.*;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Email
    @NotBlank
    @Column(unique = true, nullable = false)
    private String email;

    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password; // Може да е null за OAuth потребители

    @NotBlank
    @Size(max = 100)
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "provider_id")
    private String providerId; // Google ID за OAuth

    @Column(name = "is_enabled")
    private Boolean isEnabled = true;

    // ===== НОВИ ПОЛЕТА ЗА EMAIL VERIFICATION =====
    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;
    // ============================================

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships (ВСИЧКИ ОСТАВАТ СЪЩИТЕ)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Category> categories;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> transactions;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Budget> budgets;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BudgetAlert> budgetAlerts;

    // ===== НОВА RELATIONSHIP =====
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EmailConfirmationToken> emailConfirmationTokens;
    // =============================

    // Constructors (ВСИЧКИ ОСТАВАТ СЪЩИТЕ)
    public User() {}

    public User(String email, String firstName, String lastName) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public User(String email, String password, String firstName, String lastName) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.provider = AuthProvider.LOCAL;
    }

    // OAuth constructor
    public User(String email, String firstName, String lastName, AuthProvider provider, String providerId) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.provider = provider;
        this.providerId = providerId;
        // OAuth users са automatically verified
        this.emailVerified = true;
        this.emailVerifiedAt = LocalDateTime.now();
    }

    // Getters and Setters (ВСИЧКИ СТАРИТЕ + НОВИТЕ)
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public AuthProvider getProvider() {
        return provider;
    }

    public void setProvider(AuthProvider provider) {
        this.provider = provider;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public Boolean getIsEnabled() {
        return isEnabled;
    }

    public void setIsEnabled(Boolean isEnabled) {
        this.isEnabled = isEnabled;
    }

    // ===== НОВИ GETTERS/SETTERS =====
    public Boolean getEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(Boolean emailVerified) {
        this.emailVerified = emailVerified;
        if (emailVerified && this.emailVerifiedAt == null) {
            this.emailVerifiedAt = LocalDateTime.now();
        }
    }

    public LocalDateTime getEmailVerifiedAt() {
        return emailVerifiedAt;
    }

    public void setEmailVerifiedAt(LocalDateTime emailVerifiedAt) {
        this.emailVerifiedAt = emailVerifiedAt;
    }

    public List<EmailConfirmationToken> getEmailConfirmationTokens() {
        return emailConfirmationTokens;
    }

    public void setEmailConfirmationTokens(List<EmailConfirmationToken> emailConfirmationTokens) {
        this.emailConfirmationTokens = emailConfirmationTokens;
    }
    // ================================

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

    public List<Category> getCategories() {
        return categories;
    }

    public void setCategories(List<Category> categories) {
        this.categories = categories;
    }

    public List<Transaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
    }

    public List<Budget> getBudgets() {
        return budgets;
    }

    public void setBudgets(List<Budget> budgets) {
        this.budgets = budgets;
    }

    public List<BudgetAlert> getBudgetAlerts() {
        return budgetAlerts;
    }

    public void setBudgetAlerts(List<BudgetAlert> budgetAlerts) {
        this.budgetAlerts = budgetAlerts;
    }

    // Helper methods (ВСИЧКИ СТАРИТЕ + НОВИ)
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public boolean isOAuthUser() {
        return provider != AuthProvider.LOCAL;
    }

    // ===== НОВИ HELPER METHODS =====
    public boolean isEmailVerified() {
        return Boolean.TRUE.equals(emailVerified);
    }

    public boolean needsEmailVerification() {
        return !isOAuthUser() && !isEmailVerified();
    }

    public void verifyEmail() {
        this.emailVerified = true;
        this.emailVerifiedAt = LocalDateTime.now();
    }

    public String getVerificationStatus() {
        if (isOAuthUser()) {
            return "OAuth Verified";
        } else if (isEmailVerified()) {
            return "Email Verified";
        } else {
            return "Pending Verification";
        }
    }
    // ===============================

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", provider=" + provider +
                ", isEnabled=" + isEnabled +
                ", emailVerified=" + emailVerified +
                '}';
    }
}