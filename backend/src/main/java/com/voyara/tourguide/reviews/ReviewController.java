package com.voyara.tourguide.reviews;

import com.voyara.tourguide.bookings.Booking;
import com.voyara.tourguide.bookings.BookingService;
import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
import java.security.Principal;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/tourist")
public class ReviewController {
    private final ReviewRepository repository;
    private final BookingService bookingService;
    private final AppUserRepository userRepository;
    private final boolean securityEnabled;

    public ReviewController(ReviewRepository repository, BookingService bookingService, AppUserRepository userRepository,
                            @Value("${app.security.enabled:true}") boolean securityEnabled) {
        this.repository = repository;
        this.bookingService = bookingService;
        this.userRepository = userRepository;
        this.securityEnabled = securityEnabled;
    }

    @GetMapping("/reviews")
    public List<Review> mine(Principal principal) {
        AppUser user = currentUser(principal);
        return repository.findByTouristIdOrderByCreatedAtDesc(user.getId());
    }

    @PostMapping("/bookings/{bookingId}/reviews")
    public Review create(@PathVariable String bookingId, @RequestBody Review request, Principal principal) {
        AppUser user = currentUser(principal);
        Booking booking = securityEnabled ? bookingService.findTouristBooking(user.getEmail(), bookingId) : bookingService.findById(bookingId);
        if (!"Completed".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reviews are available after a completed booking");
        }
        if (repository.existsByTouristIdAndBookingIdAndTargetType(user.getId(), bookingId, request.getTargetType())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reviewed this booking item");
        }
        request.setId(null);
        request.setBookingId(bookingId);
        request.setTourist(user);
        return repository.save(request);
    }

    private AppUser currentUser(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            if (!securityEnabled) {
                return userRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No local user exists"));
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required");
        }
        return userRepository.findByEmailIgnoreCase(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }
}
