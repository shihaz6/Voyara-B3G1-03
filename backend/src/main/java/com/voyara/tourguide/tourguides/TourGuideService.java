package com.voyara.tourguide.tourguides;

import com.voyara.tourguide.common.ResourceNotFoundException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TourGuideService {
    private final TourGuideRepository repository;

    public TourGuideService(TourGuideRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<TourGuide> findAll() {
        List<TourGuide> guides = repository.findAll();
        guides.forEach(this::initializeCollections);
        return guides;
    }

    @Transactional(readOnly = true)
    public TourGuide findById(Long id) {
        TourGuide guide = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tour guide", id));
        initializeCollections(guide);
        return guide;
    }

    @Transactional
    public TourGuide save(TourGuide guide) {
        TourGuide saved = repository.save(guide);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public TourGuide update(Long id, TourGuide guide) {
        TourGuide existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tour guide", id));
        existing.setName(guide.getName());
        existing.setInitials(guide.getInitials());
        existing.setColor(guide.getColor());
        existing.setLocation(guide.getLocation());
        existing.setCountry(guide.getCountry());
        existing.setRating(guide.getRating());
        existing.setReviews(guide.getReviews());
        existing.setPricePerDay(guide.getPricePerDay());
        existing.setExperience(guide.getExperience());
        existing.setStatus(guide.getStatus());
        existing.setBio(guide.getBio());
        existing.setToursCompleted(guide.getToursCompleted());
        existing.getSpecialties().clear();
        existing.getLanguages().clear();
        if (guide.getSpecialties() != null) existing.getSpecialties().addAll(new ArrayList<>(guide.getSpecialties()));
        if (guide.getLanguages() != null) existing.getLanguages().addAll(new ArrayList<>(guide.getLanguages()));
        initializeCollections(existing);
        return existing;
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void initializeCollections(TourGuide guide) {
        if (guide.getSpecialties() != null) guide.getSpecialties().size();
        if (guide.getLanguages() != null) guide.getLanguages().size();
    }
}
