package com.voyara.tourguide.config;

import com.voyara.tourguide.users.AppRole;
import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
import com.voyara.tourguide.users.Role;
import com.voyara.tourguide.users.RoleRepository;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AuthDataSeeder implements CommandLineRunner {
    private final RoleRepository roleRepository;
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminFullName;

    public AuthDataSeeder(
            RoleRepository roleRepository,
            AppUserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap.admin-email}") String adminEmail,
            @Value("${app.bootstrap.admin-password}") String adminPassword,
            @Value("${app.bootstrap.admin-full-name}") String adminFullName
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminFullName = adminFullName;
    }

    @Override
    public void run(String... args) {
        Arrays.stream(AppRole.values()).forEach(roleName ->
                roleRepository.findByRoleName(roleName.name()).orElseGet(() -> {
                    Role role = new Role();
                    role.setRoleName(roleName.name());
                    return roleRepository.save(role);
                })
        );

        if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
            return;
        }

        String normalizedEmail = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            return;
        }

        Role adminRole = roleRepository.findByRoleName(AppRole.ADMIN.name()).orElseThrow();
        AppUser admin = new AppUser();
        admin.setFullName(adminFullName == null || adminFullName.isBlank() ? "Voyara Admin" : adminFullName.trim());
        admin.setEmail(normalizedEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setEmailVerified(true);
        admin.getRoles().add(adminRole);
        userRepository.save(admin);
    }
}
