package com.voyara.tourguide.accommodations;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccommodationRepository extends JpaRepository<Accommodation, Long> {
    List<Accommodation> findByDestinationId(Long destinationId);

    List<Accommodation> findByLocationContainingIgnoreCase(String location);
}
