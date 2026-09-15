package com.voyara.tourguide.bookings;

import com.voyara.tourguide.common.ResourceNotFoundException;
import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookingService {
    private final BookingRepository repository;
    private final AppUserRepository userRepository;

    public BookingService(BookingRepository repository, AppUserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    public List<Booking> findAll() {
        return repository.findAll();
    }

    public List<Booking> findByGuestEmail(String email) {
        return repository.findByEmailIgnoreCaseOrderByCreatedAtDesc(email);
    }

    @Transactional(readOnly = true)
    public List<Booking> findTouristBookings(String email) {
        AppUser tourist = findUser(email);
        return repository.findByTouristIdOrderByCreatedAtDesc(tourist.getId());
    }

    @Transactional(readOnly = true)
    public Booking findTouristBooking(String email, String id) {
        AppUser tourist = findUser(email);
        Booking booking = findById(id);
        if (booking.getTourist() == null || !booking.getTourist().getId().equals(tourist.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        return booking;
    }

    @Transactional
    public Booking cancelTouristBooking(String email, String id) {
        Booking booking = findTouristBooking(email, id);
        return cancelBookingRecord(booking, "Cancelled by tourist on " + LocalDate.now());
    }

    @Transactional
    public Booking cancelBooking(String id) {
        Booking booking = findById(id);
        return cancelBookingRecord(booking, "Cancelled on " + LocalDate.now());
    }

    private Booking cancelBookingRecord(Booking booking, String note) {
        if (!"Pending".equals(booking.getStatus()) && !"Confirmed".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This booking cannot be cancelled");
        }
        if ("Paid".equalsIgnoreCase(booking.getPayment())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Paid bookings cannot be cancelled without a refund process");
        }
        booking.setStatus("Cancelled");
        booking.setNotes(appendNote(booking.getNotes(), note));
        return repository.save(booking);
    }

    @Transactional
    public Booking createTouristBooking(String email, Booking booking) {
        AppUser tourist = findUser(email);
        booking.setTourist(tourist);
        booking.setGuest(tourist.getFullName());
        booking.setEmail(tourist.getEmail());
        booking.setStatus("Pending");
        booking.setPayment("Pending");
        return create(booking);
    }

    public Booking findById(String id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking", id));
    }

    @Transactional
    public Booking saveExisting(Booking booking) {
        return repository.save(booking);
    }

    public Booking create(Booking booking) {
        if (booking.getId() == null || booking.getId().isBlank()) {
            booking.setId("BK-" + System.currentTimeMillis());
        }
        if (booking.getBookingType() == null || booking.getBookingType().isBlank()) {
            booking.setBookingType("PACKAGE");
        }
        if (booking.getCreatedAt() == null) {
            booking.setCreatedAt(LocalDate.now());
        }
        validateDatesAndAvailability(booking, null);
        assignTouristByEmailIfPossible(booking);
        return repository.save(booking);
    }

    public Booking update(String id, Booking booking) {
        Booking existing = findById(id);
        booking.setId(id);
        if (booking.getBookingType() == null || booking.getBookingType().isBlank()) {
            booking.setBookingType(existing.getBookingType() == null || existing.getBookingType().isBlank() ? "PACKAGE" : existing.getBookingType());
        }
        if (booking.getTourist() == null) {
            booking.setTourist(existing.getTourist());
        }
        validateDatesAndAvailability(booking, id);
        assignTouristByEmailIfPossible(booking);
        return repository.save(booking);
    }

    public void delete(String id) {
        repository.delete(findById(id));
    }

    @Transactional
    public void backfillTouristOwnershipFor(AppUser user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }
        List<Booking> bookings = repository.findByTouristIsNullAndEmailIgnoreCase(user.getEmail());
        bookings.forEach(booking -> booking.setTourist(user));
        repository.saveAll(bookings);
    }

    private AppUser findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private void assignTouristByEmailIfPossible(Booking booking) {
        if (booking.getTourist() != null || booking.getEmail() == null || booking.getEmail().isBlank()) {
            return;
        }
        userRepository.findByEmailIgnoreCase(booking.getEmail()).ifPresent(booking::setTourist);
    }

    private String appendNote(String existing, String note) {
        if (existing == null || existing.isBlank()) {
            return note;
        }
        return existing + "\n" + note;
    }

    private void validateDatesAndAvailability(Booking candidate, String updatingId) {
        if (candidate.getCheckIn() == null || candidate.getCheckOut() == null) {
            return;
        }
        if (candidate.getCheckOut().isBefore(candidate.getCheckIn())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Check-out date cannot be before check-in date");
        }
        if ("Cancelled".equalsIgnoreCase(candidate.getStatus())) {
            return;
        }

        List<Booking> existingBookings = repository.findAll();
        boolean conflict = existingBookings.stream()
                .filter(existing -> !Objects.equals(existing.getId(), updatingId))
                .filter(existing -> !"Cancelled".equalsIgnoreCase(existing.getStatus()))
                .filter(existing -> existing.getCheckIn() != null && existing.getCheckOut() != null)
                .filter(existing -> candidate.getCheckIn().isBefore(existing.getCheckOut())
                        && candidate.getCheckOut().isAfter(existing.getCheckIn()))
                .anyMatch(existing -> sameResource(
                                candidate.getGuideSelectionType(), candidate.getGuideResourceId(), candidate.getGuide(),
                                existing.getGuideSelectionType(), existing.getGuideResourceId(), existing.getGuide())
                        || sameResource(
                                candidate.getAccommodationSelectionType(), candidate.getAccommodationResourceId(), candidate.getAccommodation(),
                                existing.getAccommodationSelectionType(), existing.getAccommodationResourceId(), existing.getAccommodation())
                        || sameResource(
                                candidate.getVehicleSelectionType(), candidate.getVehicleResourceId(), candidate.getVehicle(),
                                existing.getVehicleSelectionType(), existing.getVehicleResourceId(), existing.getVehicle()));

        if (conflict) {
            String message = "VEHICLE".equalsIgnoreCase(candidate.getBookingType())
                    ? "The selected vehicle is unavailable for these dates"
                    : "One of the selected guide, accommodation, or vehicle is unavailable for these dates";
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    message);
        }
    }

    private boolean sameResource(
            String candidateType,
            Long candidateResourceId,
            String candidate,
            String existingType,
            Long existingResourceId,
            String existing
    ) {
        if ("OWN".equalsIgnoreCase(candidateType) || "OWN".equalsIgnoreCase(existingType)) {
            return false;
        }
        // Once either record has a resource ID, compare the canonical IDs only.
        // Falling back to display names here makes legacy bookings with missing
        // IDs collide with a newly selected resource by accident.
        if (candidateResourceId != null || existingResourceId != null) {
            return candidateResourceId != null && existingResourceId != null
                    && candidateResourceId.equals(existingResourceId);
        }
        return candidate != null && !candidate.isBlank() && existing != null
                && !existing.isBlank() && candidate.trim().equalsIgnoreCase(existing.trim());
    }
}
