package com.example.personal_finance_app.Repository;

import com.example.personal_finance_app.Entity.EmailConfirmationToken;
import com.example.personal_finance_app.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailConfirmationTokenRepository extends JpaRepository<EmailConfirmationToken, Long> {

    /**
     * Намери token по стойност
     */
    Optional<EmailConfirmationToken> findByToken(String token);

    /**
     * Намери валиден token по стойност (не е използван и не е изтекъл)
     */
    @Query("SELECT t FROM EmailConfirmationToken t WHERE t.token = :token AND t.isUsed = false AND t.expiryDate > :now")
    Optional<EmailConfirmationToken> findValidTokenByToken(@Param("token") String token, @Param("now") LocalDateTime now);

    /**
     * Намери всички tokens за потребител
     */
    List<EmailConfirmationToken> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Намери последния token за потребител
     */
    Optional<EmailConfirmationToken> findFirstByUserOrderByCreatedAtDesc(User user);

    /**
     * Намери tokens по email
     */
    List<EmailConfirmationToken> findByEmailOrderByCreatedAtDesc(String email);

    /**
     * Намери валидни tokens за потребител
     */
    @Query("SELECT t FROM EmailConfirmationToken t WHERE t.user = :user AND t.isUsed = false AND t.expiryDate > :now ORDER BY t.createdAt DESC")
    List<EmailConfirmationToken> findValidTokensByUser(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Намери просрочени tokens
     */
    @Query("SELECT t FROM EmailConfirmationToken t WHERE t.expiryDate < :now AND t.isUsed = false")
    List<EmailConfirmationToken> findExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Провери дали има валиден token за email
     */
    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM EmailConfirmationToken t WHERE t.email = :email AND t.isUsed = false AND t.expiryDate > :now")
    boolean hasValidTokenForEmail(@Param("email") String email, @Param("now") LocalDateTime now);

    /**
     * Изтрий просрочени tokens
     */
    void deleteByExpiryDateBefore(LocalDateTime cutoffDate);

    /**
     * Изтрий използвани tokens по-стари от определена дата
     */
    void deleteByIsUsedTrueAndCreatedAtBefore(LocalDateTime cutoffDate);

    /**
     * Намери tokens които изтичат скоро (за reminder emails)
     */
    @Query("SELECT t FROM EmailConfirmationToken t WHERE t.isUsed = false AND t.expiryDate BETWEEN :now AND :soonDate")
    List<EmailConfirmationToken> findTokensExpiringSoon(@Param("now") LocalDateTime now, @Param("soonDate") LocalDateTime soonDate);

    /**
     * Брой активни tokens за потребител
     */
    @Query("SELECT COUNT(t) FROM EmailConfirmationToken t WHERE t.user = :user AND t.isUsed = false AND t.expiryDate > :now")
    long countActiveTokensForUser(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Провери дали token съществува
     */
    boolean existsByToken(String token);
}