package com.example.personal_finance_app.Repository;

import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Enum.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ===== ОРИГИНАЛНИ МЕТОДИ (ОСТАВАТ СЪЩИТЕ) =====

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);

    // ===== НОВИ МЕТОДИ ЗА EMAIL VERIFICATION =====

    /**
     * Намери потребители по email verification статус
     */
    List<User> findByEmailVerified(Boolean emailVerified);

    /**
     * Намери неверифицирани потребители
     */
    @Query("SELECT u FROM User u WHERE u.emailVerified = false AND u.provider = 'LOCAL'")
    List<User> findUnverifiedLocalUsers();

    /**
     * Намери неверифицирани потребители създадени преди определена дата
     */
    @Query("SELECT u FROM User u WHERE u.emailVerified = false AND u.provider = 'LOCAL' AND u.createdAt < :cutoffDate")
    List<User> findUnverifiedUsersCreatedBefore(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Брой верифицирани потребители
     */
    long countByEmailVerifiedTrue();

    /**
     * Брой неверифицирани потребители
     */
    long countByEmailVerifiedFalse();

    /**
     * Брой локални потребители (не OAuth)
     */
    long countByProvider(AuthProvider provider);

    /**
     * Намери потребители които са се регистрирали но не са верифицирали email-а си за X дни
     */
    @Query("SELECT u FROM User u WHERE u.emailVerified = false AND u.provider = 'LOCAL' AND u.createdAt BETWEEN :startDate AND :endDate")
    List<User> findUsersNeedingReminder(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Статистики за регистрации по дни
     */
    @Query("SELECT DATE(u.createdAt) as registrationDate, COUNT(u) as count FROM User u WHERE u.createdAt >= :startDate GROUP BY DATE(u.createdAt) ORDER BY registrationDate DESC")
    List<Object[]> getRegistrationStatistics(@Param("startDate") LocalDateTime startDate);

    /**
     * Намери активни потребители (enabled и verified)
     */
    @Query("SELECT u FROM User u WHERE u.isEnabled = true AND (u.emailVerified = true OR u.provider != 'LOCAL')")
    List<User> findActiveUsers();

    /**
     * Проверка дали email е верифициран
     */
    @Query("SELECT u.emailVerified FROM User u WHERE u.email = :email")
    Optional<Boolean> isEmailVerified(@Param("email") String email);

    /**
     * Намери потребители по verification date range
     */
    @Query("SELECT u FROM User u WHERE u.emailVerifiedAt BETWEEN :startDate AND :endDate")
    List<User> findUsersVerifiedBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Топ неактивни потребители (регистрирани но не верифицирани)
     */
    @Query("SELECT u FROM User u WHERE u.emailVerified = false AND u.provider = 'LOCAL' ORDER BY u.createdAt ASC")
    List<User> findOldestUnverifiedUsers();
}