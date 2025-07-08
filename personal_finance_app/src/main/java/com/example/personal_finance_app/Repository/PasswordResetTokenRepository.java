package com.example.personal_finance_app.Repository;

import com.example.personal_finance_app.Entity.PasswordResetToken;
import com.example.personal_finance_app.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    // ===== ОСНОВНИ QUERIES =====

    /**
     * Намира токен по token string
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Намира всички токени за потребител
     */
    List<PasswordResetToken> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Намира всички валидни (неизползвани и неизтекли) токени за потребител
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user = :user AND t.isUsed = false AND t.expiresAt > :now ORDER BY t.createdAt DESC")
    List<PasswordResetToken> findValidTokensByUser(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Намира най-новия валиден токен за потребител
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user = :user AND t.isUsed = false AND t.expiresAt > :now ORDER BY t.createdAt DESC LIMIT 1")
    Optional<PasswordResetToken> findLatestValidTokenByUser(@Param("user") User user, @Param("now") LocalDateTime now);

    // ===== VALIDATION QUERIES =====

    /**
     * Проверява дали токенът съществува и е валиден
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.token = :token AND t.isUsed = false AND t.expiresAt > :now")
    Optional<PasswordResetToken> findValidToken(@Param("token") String token, @Param("now") LocalDateTime now);

    /**
     * Проверява дали потребителят има валидни токени
     */
    @Query("SELECT COUNT(t) > 0 FROM PasswordResetToken t WHERE t.user = :user AND t.isUsed = false AND t.expiresAt > :now")
    boolean hasValidTokens(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Брои колко токена е създал потребителят за последния час
     */
    @Query("SELECT COUNT(t) FROM PasswordResetToken t WHERE t.user = :user AND t.createdAt > :since")
    long countTokensCreatedSince(@Param("user") User user, @Param("since") LocalDateTime since);

    // ===== SECURITY QUERIES =====

    /**
     * Намира токени по IP адрес за последните 24 часа
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.ipAddress = :ipAddress AND t.createdAt > :since ORDER BY t.createdAt DESC")
    List<PasswordResetToken> findRecentTokensByIpAddress(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Брои заявки от IP адрес за последния час
     */
    @Query("SELECT COUNT(t) FROM PasswordResetToken t WHERE t.ipAddress = :ipAddress AND t.createdAt > :since")
    long countTokensByIpAddressSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Намира всички изтекли токени
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.expiresAt < :now AND t.isUsed = false")
    List<PasswordResetToken> findExpiredTokens(@Param("now") LocalDateTime now);

    // ===== CLEANUP OPERATIONS =====

    /**
     * Маркира всички стари токени за потребител като използвани (security measure)
     */
    @Modifying
    @Transactional
    @Query("UPDATE PasswordResetToken t SET t.isUsed = true, t.usedAt = :now WHERE t.user = :user AND t.isUsed = false")
    int invalidateAllUserTokens(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Изтрива стари токени (cleanup)
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken t WHERE t.createdAt < :cutoffDate")
    int deleteOldTokens(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Изтрива всички изтекли токени
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :now")
    int deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Изтрива всички използвани токени по-стари от X дни
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken t WHERE t.isUsed = true AND t.usedAt < :cutoffDate")
    int deleteUsedTokensOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    // ===== STATISTICS QUERIES =====

    /**
     * Брои общо активни токени в системата
     */
    @Query("SELECT COUNT(t) FROM PasswordResetToken t WHERE t.isUsed = false AND t.expiresAt > :now")
    long countActiveTokens(@Param("now") LocalDateTime now);

    /**
     * Брои успешно използвани токени за последните 30 дни
     */
    @Query("SELECT COUNT(t) FROM PasswordResetToken t WHERE t.isUsed = true AND t.usedAt > :since")
    long countUsedTokensSince(@Param("since") LocalDateTime since);

    /**
     * Намира токени създадени преди определено време
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.createdAt < :cutoffDate ORDER BY t.createdAt ASC")
    List<PasswordResetToken> findTokensCreatedBefore(@Param("cutoffDate") LocalDateTime cutoffDate);

    // ===== CUSTOM FINDER METHODS =====

    /**
     * Намира всички токени за потребител (включително използвани)
     */
    List<PasswordResetToken> findByUserEmailOrderByCreatedAtDesc(String email);

    /**
     * Проверява дали съществува неизползван токен
     */
    boolean existsByTokenAndIsUsedFalse(String token);

    /**
     * Намира токени по User ID
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user.id = :userId ORDER BY t.createdAt DESC")
    List<PasswordResetToken> findByUserId(@Param("userId") Long userId);

    /**
     * Намира изтекли но неизползвани токени за cleanup
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.isUsed = false AND t.expiresAt < :now")
    List<PasswordResetToken> findUnusedExpiredTokens(@Param("now") LocalDateTime now);
}