package com.urbanheat.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000"
        ));

        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));

        config.setAllowedHeaders(List.of(
                "Authorization", "Content-Type"
        ));

        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtFilter
    ) throws Exception {

        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(ex -> ex.authenticationEntryPoint(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
            ))
            .sessionManagement(sm -> sm.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
            ))
            .authorizeHttpRequests(auth -> auth

                // Public login, health check and Swagger documentation
                .requestMatchers(
                        "/api/auth/login",
                        "/api/health",
                        "/error",
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/v3/api-docs/**"
                ).permitAll()

                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Authenticated user information
                .requestMatchers("/api/auth/me").authenticated()

                // Read access for all three roles
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/dashboard",
                        "/api/zones/**",
                        "/api/hotspots/**",
                        "/api/cooling-centers/**"
                ).hasAnyRole("ADMINISTRATOR", "AUTHORITY", "RESIDENT")

                // Weather access for administrator and authority
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/weather/**"
                ).hasAnyRole("ADMINISTRATOR", "AUTHORITY")

                // Heat-risk classification and history
                .requestMatchers(
                        HttpMethod.POST,
                        "/api/heat-risk/classify"
                ).hasAnyRole("ADMINISTRATOR", "AUTHORITY", "RESIDENT")

                .requestMatchers(
                        HttpMethod.GET,
                        "/api/heat-risk/history"
                ).hasAnyRole("ADMINISTRATOR", "AUTHORITY", "RESIDENT")

                // Only administrator can modify these resources
                .requestMatchers(
                        "/api/zones/**",
                        "/api/hotspots/**",
                        "/api/cooling-centers/**"
                ).hasRole("ADMINISTRATOR")

                // All remaining endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(
                    jwtFilter,
                    UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}