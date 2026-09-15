package com.voyara.tourguide.reviews;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByTouristIdOrderByCreatedAtDesc(Long touristId);
    boolean existsByTouristIdAndBookingIdAndTargetType(Long touristId, String bookingId, String targetType);
}
