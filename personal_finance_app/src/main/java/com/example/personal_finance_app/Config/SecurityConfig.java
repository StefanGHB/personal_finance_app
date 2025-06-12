package com.example.personal_finance_app.Config;

import com.example.personal_finance_app.Entity.User;
import com.example.personal_finance_app.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UserService userService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> {
            try {
                User user = userService.findByEmail(email);
                return org.springframework.security.core.userdetails.User.builder()
                        .username(user.getEmail())
                        .password(user.getPassword())
                        .authorities("USER")
                        .disabled(!user.getIsEnabled())
                        .build();
            } catch (Exception e) {
                throw new UsernameNotFoundException("User not found: " + email);
            }
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disabled за API calls

                .authorizeHttpRequests(auth -> auth
                        // Публични ресурси
                        .requestMatchers("/", "/login", "/register").permitAll()
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/favicon.ico").permitAll()

                        // API endpoints за регистрация
                        .requestMatchers("/api/users/register", "/api/users/check-email").permitAll()
                        .requestMatchers("/api/auth/register", "/api/auth/current-user").permitAll()

                        // Всички останали изискват автентикация
                        .requestMatchers("/api/**").authenticated()
                        .requestMatchers("/dashboard", "/app/**").authenticated()
                        .anyRequest().authenticated()
                )

                .formLogin(form -> form
                        .loginPage("/") // Landing page е login страницата
                        .loginProcessingUrl("/login") // Spring Security ще обработи POST към /login
                        .usernameParameter("email") // Използваме email field вместо username
                        .passwordParameter("password")
                        .defaultSuccessUrl("/dashboard", true) // При успешен login → dashboard
                        .failureUrl("/?error=true") // При грешка → landing page с error
                        .permitAll()
                )

                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/?logout=true") // След logout → landing page
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll()
                )

                .sessionManagement(session -> session
                        .maximumSessions(1) // Един активен сесия на потребител
                        .maxSessionsPreventsLogin(false) // Новия login изхвърля стария
                );

        return http.build();
    }
}