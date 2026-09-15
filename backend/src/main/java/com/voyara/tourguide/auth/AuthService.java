package com.voyara.tourguide.auth;

import com.voyara.tourguide.profiles.TouristProfile;
import com.voyara.tourguide.profiles.TouristProfileRepository;
import com.voyara.tourguide.bookings.BookingService;
import com.voyara.tourguide.security.JwtService;
import com.voyara.tourguide.users.AppRole;
import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
import com.voyara.tourguide.users.Role;
import com.voyara.tourguide.users.RoleRepository;
import java.util.Comparator;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final AppUserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TouristProfileRepository touristProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailVerificationOtpRepository otpRepository;
    private final EmailVerificationService emailVerificationService;
    private final BookingService bookingService;

    public AuthService(
            AppUserRepository userRepository,
            RoleRepository roleRepository,
            TouristProfileRepository touristProfileRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            EmailVerificationOtpRepository otpRepository,
            EmailVerificationService emailVerificationService,
            BookingService bookingService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.touristProfileRepository = touristProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.otpRepository = otpRepository;
        this.emailVerificationService = emailVerificationService;
        this.bookingService = bookingService;
    }

    @Transactional
    public PendingRegistrationResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        Role touristRole = roleRepository.findByRoleName(AppRole.TOURIST.name())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "TOURIST role is not configured"));

        AppUser user = new AppUser();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhone(request.phone());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setActive(false);
        user.setEmailVerified(false);
        user.getRoles().add(touristRole);
        AppUser saved = userRepository.save(user);

        TouristProfile profile = new TouristProfile();
        profile.setUser(saved);
        profile.setNationality(request.nationality());
        profile.setPassportNumber(request.passportNumber());
        profile.setPreferences(request.preferences());
        touristProfileRepository.save(profile);

        emailVerificationService.issueOtp(saved);
        return new PendingRegistrationResponse(saved.getEmail(), "Verification code sent. Please check your email.");
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email is not verified");
        }
        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is inactive");
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (DisabledException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User account is inactive");
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return responseFor(user);
    }

    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        String email = normalizeEmail(request.email());
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.isEmailVerified() && user.isActive()) {
            return responseFor(user);
        }

        EmailVerificationOtp otp = otpRepository.findTopByUserEmailIgnoreCaseAndUsedAtIsNullOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code not found"));

        if (otp.isExpired()) {
            otp.setUsedAt(Instant.now());
            otpRepository.save(otp);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code has expired");
        }

        if (!emailVerificationService.matches(otp, request.code())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }

        otp.setUsedAt(Instant.now());
        otpRepository.save(otp);
        user.setEmailVerified(true);
        user.setActive(true);
        AppUser saved = userRepository.save(user);
        bookingService.backfillTouristOwnershipFor(saved);
        return responseFor(saved);
    }

    @Transactional
    public PendingRegistrationResponse resendVerificationCode(ResendVerificationRequest request) {
        String email = normalizeEmail(request.email());
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.isEmailVerified()) {
            return new PendingRegistrationResponse(user.getEmail(), "Email is already verified.");
        }
        emailVerificationService.issueOtp(user);
        return new PendingRegistrationResponse(user.getEmail(), "A new verification code has been sent.");
    }

    @Transactional(readOnly = true)
    public UserSummary me(String email) {
        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        return toSummary(user);
    }

    public AuthResponse responseFor(AppUser user) {
        UserSummary summary = toSummary(user);
        return new AuthResponse(summary, jwtService.generateToken(user));
    }

    public UserSummary toSummary(AppUser user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getRoleName)
                .sorted(Comparator.naturalOrder())
                .toList();
        return new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), roles);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
