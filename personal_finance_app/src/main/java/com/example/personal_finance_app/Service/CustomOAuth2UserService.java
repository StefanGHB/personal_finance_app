package com.example.personal_finance_app.Service;

import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Enum.AuthProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    @Autowired
    @Lazy
    private UserService userService;

    @Autowired
    @Lazy
    private CategoryService categoryService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        try {
            return processOAuth2User(userRequest, oAuth2User);
        } catch (Exception ex) {
            logger.error("Error processing OAuth2 user", ex);
            throw new OAuth2AuthenticationException("Error processing OAuth2 user: " + ex.getMessage());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        AuthProvider provider = AuthProvider.valueOf(registrationId.toUpperCase());

        // Извличане на данни от Google
        String email = oAuth2User.getAttribute("email");
        String firstName = oAuth2User.getAttribute("given_name");
        String lastName = oAuth2User.getAttribute("family_name");
        String providerId = oAuth2User.getAttribute("sub"); // Google user ID

        logger.info("Processing OAuth2 user: email={}, provider={}", email, provider);

        if (email == null || firstName == null || lastName == null) {
            throw new OAuth2AuthenticationException("Missing required user information from OAuth provider");
        }

        User user;
        boolean isNewUser = false;

        try {
            // Опит за намиране на съществуващ потребител
            user = userService.findByEmail(email);

            // Ако потребителят съществува но с различен provider
            if (!user.getProvider().equals(provider)) {
                throw new OAuth2AuthenticationException(
                        "User already exists with different authentication method. Please use email/password login."
                );
            }
        } catch (Exception e) {
            // Потребителят не съществува - създаваме нов
            user = userService.processOAuthUser(email, firstName, lastName, provider, providerId);
            isNewUser = true;
            logger.info("Created new OAuth user with ID: {}", user.getId());
        }

        // Създаване на default категории за нов потребител
        if (isNewUser) {
            try {
                categoryService.createDefaultCategoriesForUser(user);
                logger.info("Created default categories for new OAuth user ID: {}", user.getId());
            } catch (Exception e) {
                logger.error("Failed to create default categories for user ID: {}", user.getId(), e);
                // Не прекъсваме процеса, но логваме грешката
            }
        }

        return new CustomOAuth2User(oAuth2User, user);
    }
}