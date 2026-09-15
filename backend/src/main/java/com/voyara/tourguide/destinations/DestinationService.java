package com.voyara.tourguide.destinations;

import com.voyara.tourguide.common.ResourceNotFoundException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DestinationService {
    private final DestinationRepository repository;

    public DestinationService(DestinationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Destination> findAll() {
        List<Destination> destinations = repository.findAll();
        destinations.forEach(this::initializeCollections);
        return destinations;
    }

    @Transactional(readOnly = true)
    public Destination findById(Long id) {
        Destination destination = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Destination", id));
        initializeCollections(destination);
        return destination;
    }

    @Transactional
    public Destination save(Destination destination) {
        Destination saved = repository.save(destination);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public Destination update(Long id, Destination destination) {
        Destination existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination", id));
        existing.setName(destination.getName());
        existing.setCountry(destination.getCountry());
        existing.setContinent(destination.getContinent());
        existing.setDescription(destination.getDescription());
        existing.setImage(destination.getImage());
        existing.setTours(destination.getTours());
        existing.setStatus(destination.getStatus());
        existing.setRating(destination.getRating());
        existing.setReviews(destination.getReviews());
        existing.setBestSeason(destination.getBestSeason());
        existing.setHighlights(destination.getHighlights());
        existing.getCategories().clear();
        if (destination.getCategories() != null) {
            existing.getCategories().addAll(new ArrayList<>(destination.getCategories()));
        }
        initializeCollections(existing);
        return existing;
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void initializeCollections(Destination destination) {
        if (destination.getCategories() != null) {
            destination.getCategories().size();
        }
    }
}
