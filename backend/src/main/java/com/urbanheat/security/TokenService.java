package com.urbanheat.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class TokenService {
    @Value("${urbanheat.jwt.secret:UrbanHeat-Development-Secret-Change-This-At-Deployment-2026}")
    private String secret;
    private static final long TOKEN_LIFETIME_MS = 8 * 60 * 60 * 1000L;

    public String createToken(String username, String role) {
        long expires = System.currentTimeMillis() + TOKEN_LIFETIME_MS;
        String payload = username + "|" + role + "|" + expires;
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encoded + "." + sign(encoded);
    }
    public TokenData validate(String token) {
        try {
            String[] parts = token.split("\\.", 2);
            if (parts.length != 2 || !constantTimeEquals(sign(parts[0]), parts[1])) return null;
            String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            String[] values = payload.split("\\|", 3);
            if (values.length != 3 || Long.parseLong(values[2]) < System.currentTimeMillis()) return null;
            return new TokenData(values[0], values[1]);
        } catch (Exception ex) { return null; }
    }
    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) { throw new IllegalStateException("Could not sign token", ex); }
    }
    private boolean constantTimeEquals(String a, String b) {
        return java.security.MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
    public record TokenData(String username, String role) {}
}
