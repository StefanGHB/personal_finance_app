package com.example.personal_finance_app.Service;

import com.example.personal_finance_app.Entity.EmailConfirmationToken;
import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Enum.AuthProvider;
import com.example.personal_finance_app.Repository.EmailConfirmationTokenRepository;
import com.example.personal_finance_app.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailConfirmationTokenRepository emailConfirmationTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ===== ОРИГИНАЛНИ МЕТОДИ (ОСТАВАТ СЪЩИТЕ) =====

    public User registerUser(String email, String password, String firstName, String lastName) {
        // Проверка дали email съществува
        if (emailExists(email)) {
            throw new RuntimeException("User with email " + email + " already exists");
        }

        // Създаване на нов потребител
        User user = new User();
        user.setEmail(email.toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName.trim());
        user.setLastName(lastName.trim());
        user.setProvider(AuthProvider.LOCAL);
        user.setIsEnabled(true);

        // ===== НОВА ЛОГИКА - Email не е verified при регистрация =====
        user.setEmailVerified(false);
        // ============================================================

        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email.toLowerCase().trim());
    }

    public User updateUserInfo(Long userId, String firstName, String lastName) {
        User user = findById(userId);
        user.setFirstName(firstName.trim());
        user.setLastName(lastName.trim());
        return userRepository.save(user);
    }

    public void updatePassword(Long userId, String currentPassword, String newPassword) {
        User user = findById(userId);

        if (user.getPassword() == null) {
            throw new RuntimeException("Cannot change password for OAuth users");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    // ===== НОВИ МЕТОДИ ЗА EMAIL CONFIRMATION =====

    /**
     * Създава и запазва email confirmation token
     */
    public EmailConfirmationToken createEmailConfirmationToken(User user) {
        // Генерира уникален token
        String token = generateUniqueToken();

        // Създава token с 24 часа валидност
        EmailConfirmationToken confirmationToken = new EmailConfirmationToken(
                token,
                user.getEmail(),
                user,
                LocalDateTime.now().plusHours(24)
        );

        return emailConfirmationTokenRepository.save(confirmationToken);
    }

    /**
     * Потвърждава email чрез token
     */
    public boolean confirmEmailWithToken(String token) {
        Optional<EmailConfirmationToken> tokenOpt = emailConfirmationTokenRepository
                .findValidTokenByToken(token, LocalDateTime.now());

        if (tokenOpt.isEmpty()) {
            return false; // Token не съществува, използван е или е изтекъл
        }

        EmailConfirmationToken confirmationToken = tokenOpt.get();
        User user = confirmationToken.getUser();

        // Маркира token като използван
        confirmationToken.markAsUsed();
        emailConfirmationTokenRepository.save(confirmationToken);

        // Потвърждава email на потребителя
        user.verifyEmail();
        userRepository.save(user);

        return true;
    }

    /**
     * Намира последния token за потребител
     */
    public Optional<EmailConfirmationToken> getLastConfirmationTokenForUser(Long userId) {
        User user = findById(userId);
        return emailConfirmationTokenRepository.findFirstByUserOrderByCreatedAtDesc(user);
    }

    /**
     * Проверява дали потребителят има валиден token
     */
    public boolean hasValidConfirmationToken(String email) {
        return emailConfirmationTokenRepository.hasValidTokenForEmail(email, LocalDateTime.now());
    }

    /**
     * Намира token по стойност
     */
    public Optional<EmailConfirmationToken> findConfirmationToken(String token) {
        return emailConfirmationTokenRepository.findByToken(token);
    }

    /**
     * Изтрива просрочени tokens (cleanup task)
     */
    public void cleanupExpiredTokens() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7); // Изтрий tokens по-стари от 7 дни
        emailConfirmationTokenRepository.deleteByExpiryDateBefore(cutoffDate);
        emailConfirmationTokenRepository.deleteByIsUsedTrueAndCreatedAtBefore(cutoffDate);
    }

    /**
     * Възстановяване на изпратени tokens за потребител
     */
    public List<EmailConfirmationToken> getUserConfirmationTokens(Long userId) {
        User user = findById(userId);
        return emailConfirmationTokenRepository.findByUserOrderByCreatedAtDesc(user);
    }

    /**
     * Провери дали потребителят може да получи нов token
     */
    public boolean canReceiveNewConfirmationToken(String email) {
        // Ограничение: максимум 1 валиден token на email в момента
        return !hasValidConfirmationToken(email);
    }

    /**
     * Потвърди email директно (за OAuth users или admin операции)
     */
    public void verifyEmailDirectly(Long userId) {
        User user = findById(userId);
        user.verifyEmail();
        userRepository.save(user);
    }

    /**
     * Създава OAuth потребител (automatically verified)
     */
    public User createOAuthUser(String email, String firstName, String lastName,
                                AuthProvider provider, String providerId) {
        User user = new User(email, firstName, lastName, provider, providerId);
        // OAuth users са автоматично verified
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    // ===== НОВ МЕТОД ЗА PASSWORD RESET FUNCTIONALITY =====

    /**
     * Обновява паролата на потребител (за password reset functionality)
     * ВНИМАНИЕ: Този метод НЕ проверява стара парола - използва се само за password reset!
     */
    public void updateUserPassword(Long userId, String encodedPassword) {
        try {
            User user = findById(userId);

            // Security check: cannot update password for OAuth users
            if (user.isOAuthUser()) {
                throw new RuntimeException("Cannot update password for OAuth users");
            }

            // Security check: user must be enabled
            if (!user.getIsEnabled()) {
                throw new RuntimeException("Cannot update password for disabled user");
            }

            // Update the password (already encoded by PasswordResetService)
            user.setPassword(encodedPassword);
            userRepository.save(user);

            System.out.println("✅ Password updated successfully for user: " + user.getEmail());

        } catch (Exception e) {
            System.err.println("❌ Failed to update password for user ID: " + userId);
            throw new RuntimeException("Failed to update user password: " + e.getMessage());
        }
    }

    // ===== HELPER METHODS =====

    /**
     * Генерира уникален token
     */
    private String generateUniqueToken() {
        String token;
        do {
            token = UUID.randomUUID().toString().replace("-", "");
        } while (emailConfirmationTokenRepository.existsByToken(token));

        return token;
    }

    /**
     * Статистики за email verification
     */
    public long getVerifiedUsersCount() {
        return userRepository.countByEmailVerifiedTrue();
    }

    public long getUnverifiedUsersCount() {
        return userRepository.countByEmailVerifiedFalse();
    }

    public long getPendingTokensCount() {
        return emailConfirmationTokenRepository.countActiveTokensForUser(null, LocalDateTime.now());
    }

    /**
     * OAuth user processing (compatibility method)
     * Създава или обновява OAuth потребител
     */
    public User processOAuthUser(String email, String firstName, String lastName,
                                 AuthProvider provider, String providerId) {
        try {
            // Провери дали потребителят вече съществува
            User existingUser = userRepository.findByEmail(email.toLowerCase().trim()).orElse(null);

            if (existingUser != null) {
                // Обнови съществуващия потребител с OAuth данни
                existingUser.setProvider(provider);
                existingUser.setProviderId(providerId);
                existingUser.setFirstName(firstName.trim());
                existingUser.setLastName(lastName.trim());

                // OAuth users са автоматично verified
                if (!existingUser.isEmailVerified()) {
                    existingUser.verifyEmail();
                }

                return userRepository.save(existingUser);
            } else {
                // Създай нов OAuth потребител
                return createOAuthUser(email, firstName, lastName, provider, providerId);
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to process OAuth user: " + e.getMessage());
        }
    }
}