package com.example.personal_finance_app.Service;


import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Enum.AuthProvider;
import com.example.personal_finance_app.Exeption.UserAlreadyExistsException;
import com.example.personal_finance_app.Exeption.UserNotFoundException;
import com.example.personal_finance_app.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;

@Service
@Transactional
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Регистрация на нов потребител с email и парола
     */
    public User registerUser(String email, String password, String firstName, String lastName) {
        logger.info("Attempting to register user with email: {}", email);

        validateUserInput(email, firstName, lastName);
        validatePassword(password);

        if (userRepository.existsByEmail(email)) {
            logger.warn("Registration failed - email already exists: {}", email);
            throw new UserAlreadyExistsException("User with email " + email + " already exists");
        }

        User user = new User();
        user.setEmail(email.toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName.trim());
        user.setLastName(lastName.trim());
        user.setProvider(AuthProvider.LOCAL);
        user.setIsEnabled(true);

        User savedUser = userRepository.save(user);
        logger.info("Successfully registered user with ID: {}", savedUser.getId());

        return savedUser;
    }

    /**
     * OAuth регистрация/автентикация
     */
    public User processOAuthUser(String email, String firstName, String lastName,
                                 AuthProvider provider, String providerId) {
        logger.info("Processing OAuth user with email: {} and provider: {}", email, provider);

        validateUserInput(email, firstName, lastName);

        if (provider == null || !StringUtils.hasText(providerId)) {
            throw new IllegalArgumentException("Provider and provider ID are required for OAuth users");
        }

        // Проверка дали потребителят съществува по provider ID
        Optional<User> existingUser = userRepository.findByProviderAndProviderId(provider, providerId);
        if (existingUser.isPresent()) {
            logger.info("Found existing OAuth user with ID: {}", existingUser.get().getId());
            return updateUserInfo(existingUser.get(), email, firstName, lastName);
        }

        // Проверка дали има потребител с този email
        Optional<User> userByEmail = userRepository.findByEmail(email.toLowerCase().trim());
        if (userByEmail.isPresent()) {
            logger.warn("Email {} already exists for different authentication method", email);
            throw new UserAlreadyExistsException("User with email " + email + " already exists with different authentication method");
        }

        // Създаване на нов OAuth потребител
        User newUser = new User();
        newUser.setEmail(email.toLowerCase().trim());
        newUser.setFirstName(firstName.trim());
        newUser.setLastName(lastName.trim());
        newUser.setProvider(provider);
        newUser.setProviderId(providerId);
        newUser.setIsEnabled(true);

        User savedUser = userRepository.save(newUser);
        logger.info("Successfully created OAuth user with ID: {}", savedUser.getId());

        return savedUser;
    }

    /**
     * Намиране на потребител по email
     */
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Email cannot be empty");
        }

        return userRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
    }

    /**
     * Намиране на потребител по ID
     */
    @Transactional(readOnly = true)
    public User findById(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("User ID must be a positive number");
        }

        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));
    }

    /**
     * Обновяване на потребителска информация
     */
    public User updateUserInfo(Long userId, String firstName, String lastName) {
        User user = findById(userId);
        return updateUserInfo(user, user.getEmail(), firstName, lastName);
    }

    /**
     * Обновяване на парола
     */
    public void updatePassword(Long userId, String currentPassword, String newPassword) {
        User user = findById(userId);

        if (user.isOAuthUser()) {
            throw new IllegalArgumentException("Cannot update password for OAuth users");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        validatePassword(newPassword);

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        logger.info("Password updated for user ID: {}", userId);
    }

    /**
     * Активиране/деактивиране на потребител
     */
    public void toggleUserStatus(Long userId) {
        User user = findById(userId);
        user.setIsEnabled(!user.getIsEnabled());
        userRepository.save(user);

        logger.info("User status toggled for ID: {} - now enabled: {}", userId, user.getIsEnabled());
    }

    /**
     * Проверка дали email съществува
     */
    @Transactional(readOnly = true)
    public boolean emailExists(String email) {
        if (!StringUtils.hasText(email)) {
            return false;
        }
        return userRepository.existsByEmail(email.toLowerCase().trim());
    }

    // Private helper methods
    private User updateUserInfo(User user, String email, String firstName, String lastName) {
        validateUserInput(email, firstName, lastName);

        user.setEmail(email.toLowerCase().trim());
        user.setFirstName(firstName.trim());
        user.setLastName(lastName.trim());

        User updatedUser = userRepository.save(user);
        logger.info("Updated user info for ID: {}", updatedUser.getId());

        return updatedUser;
    }

    private void validateUserInput(String email, String firstName, String lastName) {
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Email is required");
        }
        if (!StringUtils.hasText(firstName)) {
            throw new IllegalArgumentException("First name is required");
        }
        if (!StringUtils.hasText(lastName)) {
            throw new IllegalArgumentException("Last name is required");
        }

        // Базова email валидация
        if (!email.contains("@") || !email.contains(".")) {
            throw new IllegalArgumentException("Invalid email format");
        }
    }

    private void validatePassword(String password) {
        if (!StringUtils.hasText(password)) {
            throw new IllegalArgumentException("Password is required");
        }
        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }
    }
}