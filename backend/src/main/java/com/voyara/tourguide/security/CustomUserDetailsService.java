package com.voyara.tourguide.security;

import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
import com.voyara.tourguide.users.Role;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final AppUserRepository userRepository;

    public CustomUserDetailsService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(Role::getRoleName)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
        return User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .disabled(!user.isActive())
                .authorities(authorities)
                .build();
    }
}
