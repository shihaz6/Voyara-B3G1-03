package com.voyara.tourguide.bookings;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByEmailIgnoreCaseOrderByCreatedAtDesc(String email);

    List<Booking> findByTouristIdOrderByCreatedAtDesc(Long touristId);

    List<Booking> findByTouristIsNullAndEmailIgnoreCase(String email);
}
