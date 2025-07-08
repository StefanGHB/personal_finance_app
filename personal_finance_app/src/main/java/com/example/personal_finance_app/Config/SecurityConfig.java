package com.example.personal_finance_app.Config;

import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Enum.AuthProvider;
import com.example.personal_finance_app.Service.CustomOAuth2UserService;
import com.example.personal_finance_app.Service.UserService;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.session.SessionInformation;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;

    @Autowired
    @Lazy
    private UserService userService;

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService) {
        this.customOAuth2UserService = customOAuth2UserService;
    }

    @Bean
    public UserDetailsService userDetailsService(@Lazy UserService userService) {
        return email -> {
            try {
                System.out.println("🔍 LOGIN ATTEMPT: " + email);

                User user = userService.findByEmail(email);
                System.out.println("🔍 USER FOUND: " + user.getEmail());
                System.out.println("🔍 IS_ENABLED: " + user.getIsEnabled());
                System.out.println("🔍 EMAIL_VERIFIED: " + user.getEmailVerified());
                System.out.println("🔍 PROVIDER: " + user.getProvider());

                // За LOCAL users проверяваме дали email е verified
                boolean accountEnabled = user.getIsEnabled();
                if (user.getProvider() == AuthProvider.LOCAL) {
                    accountEnabled = accountEnabled && user.getEmailVerified();
                    System.out.println("🔍 LOCAL USER - ACCOUNT_ENABLED: " + accountEnabled);
                }

                UserDetails springUser = org.springframework.security.core.userdetails.User.builder()
                        .username(user.getEmail())
                        .password(user.getPassword() != null ? user.getPassword() : "")
                        .authorities("USER")
                        .disabled(!accountEnabled)
                        .accountLocked(false)
                        .accountExpired(false)
                        .credentialsExpired(false)
                        .build();

                System.out.println("🔍 SPRING USER ENABLED: " + springUser.isEnabled());
                return springUser;

            } catch (Exception e) {
                System.out.println("❌ LOGIN ERROR: " + e.getMessage());
                throw new UsernameNotFoundException("User not found: " + email);
            }
        };
    }

    /**
     * Custom Authentication Failure Handler с професионални съобщения
     */
    @Bean
    public AuthenticationFailureHandler customAuthenticationFailureHandler() {
        return (request, response, exception) -> {
            try {
                String email = request.getParameter("email");
                String password = request.getParameter("password");

                System.out.println("🚫 LOGIN FAILED for email: " + email);
                System.out.println("🚫 Exception: " + exception.getClass().getSimpleName() + " - " + exception.getMessage());

                String errorType = "login_failed";
                String errorMessage = "Invalid credentials";

                // Анализиране на типа грешка
                if (email == null || email.trim().isEmpty()) {
                    errorType = "email_required";
                    errorMessage = "Email address is required";
                } else if (password == null || password.trim().isEmpty()) {
                    errorType = "password_required";
                    errorMessage = "Password is required";
                } else {
                    try {
                        // Проверка дали потребителят съществува
                        User user = userService.findByEmail(email.trim());

                        // Потребителят съществува - проверяваме паролата
                        if (user.getPassword() == null) {
                            errorType = "oauth_user";
                            errorMessage = "This account uses Google Sign-In";
                        } else if (!passwordEncoder.matches(password, user.getPassword())) {
                            errorType = "invalid_password";
                            errorMessage = "Invalid password";
                        } else if (!user.getIsEnabled()) {
                            errorType = "account_disabled";
                            errorMessage = "Account has been disabled";
                        } else if (user.getProvider() == AuthProvider.LOCAL && !user.getEmailVerified()) {
                            errorType = "email_not_verified";
                            errorMessage = "Email address not verified";
                        } else {
                            errorType = "account_issue";
                            errorMessage = "Account access restricted";
                        }

                    } catch (RuntimeException e) {
                        // Потребителят не съществува
                        errorType = "invalid_email";
                        errorMessage = "Invalid email address";
                    }
                }

                System.out.println("🚫 Login error type: " + errorType);
                System.out.println("🚫 Error message: " + errorMessage);

                // Задаваме параметри в session за AJAX response
                HttpSession session = request.getSession();
                session.setAttribute("login_error_type", errorType);
                session.setAttribute("login_error_message", errorMessage);
                session.setAttribute("login_failed_email", email);

                // Redirect към login-error endpoint
                response.sendRedirect("/api/auth/login-error");

            } catch (Exception e) {
                System.out.println("❌ Error in failure handler: " + e.getMessage());
                e.printStackTrace();

                try {
                    response.sendRedirect("/?error=authentication_system_error");
                } catch (IOException redirectError) {
                    System.out.println("❌ Could not redirect: " + redirectError.getMessage());
                }
            }
        };
    }

    @Bean
    public SessionRegistry sessionRegistry() {
        return new SessionRegistryImpl();
    }

    @Bean
    public Filter userExistsValidationFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request,
                                            HttpServletResponse response,
                                            FilterChain filterChain) throws ServletException, IOException {

                String requestPath = request.getRequestURI();

                if (isTrulyPublicEndpoint(requestPath)) {
                    filterChain.doFilter(request, response);
                    return;
                }

                Authentication auth = SecurityContextHolder.getContext().getAuthentication();

                if (auth != null && auth.isAuthenticated() &&
                        !auth.getName().equals("anonymousUser")) {

                    try {
                        String userEmail = auth.getName();
                        System.out.println("🔍 [FILTER] Validating user existence for: " + userEmail);

                        UserService userServiceBean = applicationContext.getBean(UserService.class);
                        User user = userServiceBean.findByEmail(userEmail);

                        if (user.getProvider() == AuthProvider.LOCAL) {
                            if (!user.getIsEnabled()) {
                                System.out.println("🚫 [FILTER] User account disabled: " + userEmail);
                                forceLogoutComplete(request, response, "account_disabled");
                                return;
                            }

                            if (!user.getEmailVerified()) {
                                System.out.println("🚫 [FILTER] User email not verified: " + userEmail);
                                forceLogoutComplete(request, response, "email_not_verified");
                                return;
                            }
                        }

                        System.out.println("✅ [FILTER] User validation passed for: " + userEmail);

                    } catch (RuntimeException e) {
                        System.out.println("🚫 [FILTER] User not found in database: " + auth.getName());
                        forceLogoutComplete(request, response, "user_deleted");
                        return;
                    } catch (Exception e) {
                        System.out.println("❌ [FILTER] Error during user validation: " + e.getMessage());
                        forceLogoutComplete(request, response, "validation_error");
                        return;
                    }
                }

                filterChain.doFilter(request, response);
            }

            private boolean isTrulyPublicEndpoint(String path) {
                return path.equals("/login") ||
                        path.equals("/register") ||
                        path.startsWith("/static/") ||
                        path.startsWith("/css/") ||
                        path.startsWith("/js/") ||
                        path.startsWith("/images/") ||
                        path.startsWith("/api/auth/register") ||
                        path.startsWith("/api/auth/login-error") ||
                        path.startsWith("/api/users/register") ||
                        path.startsWith("/api/email-validation/") ||
                        path.startsWith("/api/auth/confirm-email") ||
                        path.startsWith("/confirm-email") ||
                        path.startsWith("/oauth2/") ||
                        path.equals("/favicon.ico") ||
                        path.equals("/error") ||
                        // ===== НОВИ PASSWORD RESET ENDPOINTS =====
                        path.startsWith("/api/password-reset/") ||
                        path.equals("/forgot-password") ||
                        path.equals("/reset-password") ||
                        path.startsWith("/reset-password");
                // ==========================================
            }

            private void forceLogoutComplete(HttpServletRequest request, HttpServletResponse response, String reason)
                    throws IOException {
                try {
                    String userEmail = null;
                    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null) {
                        userEmail = auth.getName();
                    }

                    System.out.println("🔄 [FILTER] FORCE LOGOUT: " + userEmail + " | Reason: " + reason);

                    // Clear sessions
                    try {
                        if (auth != null && auth.getPrincipal() instanceof UserDetails) {
                            SessionRegistry sessionRegistry = applicationContext.getBean(SessionRegistry.class);
                            List<SessionInformation> sessions = sessionRegistry.getAllSessions(auth.getPrincipal(), false);
                            for (SessionInformation session : sessions) {
                                session.expireNow();
                                sessionRegistry.removeSessionInformation(session.getSessionId());
                            }
                        }
                    } catch (Exception e) {
                        System.out.println("⚠️ [FILTER] Could not clear session registry: " + e.getMessage());
                    }

                    HttpSession session = request.getSession(false);
                    if (session != null) {
                        try {
                            session.invalidate();
                        } catch (IllegalStateException e) {
                            System.out.println("🔄 [FILTER] Session already invalidated");
                        }
                    }

                    SecurityContextHolder.clearContext();

                    Cookie[] cookies = request.getCookies();
                    if (cookies != null) {
                        for (Cookie cookie : cookies) {
                            if ("JSESSIONID".equals(cookie.getName())) {
                                Cookie clearCookie = new Cookie("JSESSIONID", null);
                                clearCookie.setMaxAge(0);
                                clearCookie.setPath("/");
                                response.addCookie(clearCookie);
                                break;
                            }
                        }
                    }

                    response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                    response.setHeader("Pragma", "no-cache");
                    response.setHeader("Expires", "0");

                    response.sendRedirect("/?error=" + reason + "&logout=forced&t=" + System.currentTimeMillis());

                } catch (Exception e) {
                    System.out.println("❌ [FILTER] Error during force logout: " + e.getMessage());
                    try {
                        response.sendRedirect("/?error=logout_failed&t=" + System.currentTimeMillis());
                    } catch (IOException redirectError) {
                        System.out.println("❌ [FILTER] Could not redirect: " + redirectError.getMessage());
                    }
                }
            }
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth
                        // Landing & Auth pages
                        .requestMatchers("/", "/login", "/register").permitAll()

                        // Static resources
                        .requestMatchers("/static/**").permitAll()
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/favicon.ico").permitAll()

                        // User registration & auth
                        .requestMatchers("/api/users/register", "/api/users/check-email").permitAll()
                        .requestMatchers("/api/auth/register", "/api/auth/current-user").permitAll()
                        .requestMatchers("/api/auth/login-error").permitAll()

                        // Email validation
                        .requestMatchers("/api/email-validation/**").permitAll()
                        .requestMatchers("/api/auth/confirm-email").permitAll()
                        .requestMatchers("/api/auth/resend-confirmation").permitAll()
                        .requestMatchers("/confirm-email").permitAll()

                        // OAuth
                        .requestMatchers("/oauth2/**").permitAll()

                        // Error handling
                        .requestMatchers("/error").permitAll()

                        // ===== НОВИ PASSWORD RESET ENDPOINTS =====
                        .requestMatchers("/api/password-reset/**").permitAll()
                        .requestMatchers("/forgot-password").permitAll()
                        .requestMatchers("/reset-password").permitAll()
                        .requestMatchers("/reset-password/**").permitAll()
                        // ==========================================

                        // Authenticated endpoints
                        .requestMatchers("/api/**").authenticated()
                        .requestMatchers("/dashboard", "/app/**").authenticated()
                        .requestMatchers("/transactions", "/budgets", "/categories", "/reports", "/settings").authenticated()
                        .anyRequest().authenticated()
                )

                .formLogin(form -> form
                        .loginPage("/")
                        .loginProcessingUrl("/login")
                        .usernameParameter("email")
                        .passwordParameter("password")
                        .defaultSuccessUrl("/dashboard", true)
                        .failureHandler(customAuthenticationFailureHandler())
                        .permitAll()
                )

                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/")
                        .defaultSuccessUrl("/dashboard", true)
                        .failureUrl("/?error=oauth")
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                )

                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/?logout=true")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .clearAuthentication(true)
                        .permitAll()
                        .addLogoutHandler((request, response, auth) -> {
                            if (auth != null) {
                                System.out.println("🔄 Manual logout for: " + auth.getName());
                                try {
                                    SessionRegistry sessionRegistry = applicationContext.getBean(SessionRegistry.class);
                                    if (auth.getPrincipal() instanceof UserDetails) {
                                        List<SessionInformation> sessions = sessionRegistry.getAllSessions(auth.getPrincipal(), false);
                                        for (SessionInformation session : sessions) {
                                            session.expireNow();
                                            sessionRegistry.removeSessionInformation(session.getSessionId());
                                        }
                                    }
                                } catch (Exception e) {
                                    System.out.println("⚠️ Could not clear sessions during logout: " + e.getMessage());
                                }
                            }
                        })
                )

                .sessionManagement(session -> session
                        .maximumSessions(1)
                        .maxSessionsPreventsLogin(false)
                        .sessionRegistry(sessionRegistry())
                        .expiredUrl("/?error=session_expired&logout=forced")
                )

                .addFilterBefore(userExistsValidationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}