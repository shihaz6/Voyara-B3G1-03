package com.voyara.tourguide.accommodations;

import com.voyara.tourguide.common.ResourceNotFoundException;
import com.voyara.tourguide.destinations.Destination;
import com.voyara.tourguide.destinations.DestinationRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccommodationService {
    private final AccommodationRepository repository;
    private final DestinationRepository destinationRepository;

    public AccommodationService(AccommodationRepository repository, DestinationRepository destinationRepository) {
        this.repository = repository;
        this.destinationRepository = destinationRepository;
    }

    @Transactional(readOnly = true)
    public List<Accommodation> findAll() {
        List<Accommodation> accommodations = repository.findAll();
        accommodations.forEach(this::initializeCollections);
        return accommodations;
    }

    @Transactional(readOnly = true)
    public List<Accommodation> findByDestination(Long destinationId, String destination) {
        List<Accommodation> accommodations;
        if (destinationId != null) {
            accommodations = repository.findByDestinationId(destinationId);
        } else if (destination != null && !destination.isBlank()) {
            accommodations = findByDestinationName(destination);
        } else {
            accommodations = repository.findAll();
        }
        accommodations.forEach(this::initializeCollections);
        return accommodations;
    }

    @Transactional(readOnly = true)
    public Accommodation findById(Long id) {
        Accommodation accommodation = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Accommodation", id));
        initializeCollections(accommodation);
        return accommodation;
    }

    @Transactional
    public Accommodation save(Accommodation accommodation) {
        Accommodation saved = repository.save(accommodation);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public Accommodation update(Long id, Accommodation accommodation) {
        Accommodation existing = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Accommodation", id));

        existing.setName(accommodation.getName());
        existing.setType(accommodation.getType());
        existing.setDestinationId(accommodation.getDestinationId());
        existing.setLocation(accommodation.getLocation());
        existing.setCountry(accommodation.getCountry());
        existing.setPrice(accommodation.getPrice());
        existing.setRooms(accommodation.getRooms());
        existing.setRating(accommodation.getRating());
        existing.setReviews(accommodation.getReviews());
        existing.setStatus(accommodation.getStatus());
        existing.setImage(accommodation.getImage());
        existing.setOccupancy(accommodation.getOccupancy());
        existing.getAmenities().clear();
        if (accommodation.getAmenities() != null) {
            existing.getAmenities().addAll(new ArrayList<>(accommodation.getAmenities()));
        }

        initializeCollections(existing);
        return existing;
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void initializeCollections(Accommodation accommodation) {
        if (accommodation.getAmenities() != null) {
            accommodation.getAmenities().size();
        }
    }

    private List<Accommodation> findByDestinationName(String destination) {
        String normalized = destination.trim();
        List<Destination> destinations = destinationRepository.findAll().stream()
                .filter(item -> item.getName() != null && item.getName().equalsIgnoreCase(normalized))
                .toList();
        if (!destinations.isEmpty()) {
            List<Long> destinationIds = destinations.stream().map(Destination::getId).toList();
            List<Accommodation> byStructuredDestination = repository.findAll().stream()
                    .filter(item -> item.getDestinationId() != null && destinationIds.contains(item.getDestinationId()))
                    .toList();
            if (!byStructuredDestination.isEmpty()) {
                return byStructuredDestination;
            }
        }
        return repository.findByLocationContainingIgnoreCase(normalized);
    }
}
