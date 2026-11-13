package com.urbanheat.auth;

import com.urbanheat.model.AppUser;
import com.urbanheat.repository.AppUserRepository;
import com.urbanheat.security.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final TokenService tokens;
    public AuthController(AppUserRepository users, PasswordEncoder encoder, TokenService tokens) {
        this.users = users; this.encoder = encoder; this.tokens = tokens;
    }
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request) {
        if (request.username() == null || request.password() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and password are required");
        AppUser user = users.findByUsername(request.username().trim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));
        if (!encoder.matches(request.password(), user.getPassword())) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        return Map.of("token", tokens.createToken(user.getUsername(), user.getRole()), "username", user.getUsername(), "displayName", user.getDisplayName(), "role", user.getRole());
    }
    @GetMapping("/me")
    public Map<String, Object> me(org.springframework.security.core.Authentication authentication) {
        AppUser user = users.findByUsername(authentication.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return Map.of("username", user.getUsername(), "displayName", user.getDisplayName(), "role", user.getRole());
    }
    public record LoginRequest(String username, String password) {}
}
