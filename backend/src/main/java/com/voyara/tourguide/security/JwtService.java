package com.voyara.tourguide.security;

import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private static final String DEVELOPMENT_SECRET = "voyara-development-only-jwt-secret-change-later";

    private final Key signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        String effectiveSecret = secret;
        if (effectiveSecret == null || effectiveSecret.isBlank()) {
            effectiveSecret = DEVELOPMENT_SECRET;
        }
        if (effectiveSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            effectiveSecret = DEVELOPMENT_SECRET;
        }
        this.signingKey = Keys.hmacShaKeyFor(effectiveSecret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(AppUser user) {
        Instant now = Instant.now();
        List<String> roles = user.getRoles().stream().map(Role::getRoleName).sorted().toList();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("roles", roles)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(signingKey)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String email = extractEmail(token);
        return email.equalsIgnoreCase(userDetails.getUsername()) && extractClaims(token).getExpiration().after(new Date());
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
