package com.voyara.tourguide.packages;

import com.voyara.tourguide.common.ResourceNotFoundException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TourPackageService {
    private final TourPackageRepository repository;

    public TourPackageService(TourPackageRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<TourPackage> findAll() {
        List<TourPackage> packages = repository.findAll();
        packages.forEach(this::initializeCollections);
        return packages;
    }

    @Transactional(readOnly = true)
    public TourPackage findById(Long id) {
        TourPackage tourPackage = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Package", id));
        initializeCollections(tourPackage);
        return tourPackage;
    }

    @Transactional
    public TourPackage save(TourPackage tourPackage) {
        TourPackage saved = repository.save(tourPackage);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public TourPackage update(Long id, TourPackage tourPackage) {
        TourPackage existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Package", id));
        existing.setName(tourPackage.getName());
        existing.setCategory(tourPackage.getCategory());
        existing.setDuration(tourPackage.getDuration());
        existing.setPrice(tourPackage.getPrice());
        existing.setMaxGroup(tourPackage.getMaxGroup());
        existing.setDifficulty(tourPackage.getDifficulty());
        existing.setStatus(tourPackage.getStatus());
        existing.setRating(tourPackage.getRating());
        existing.setReviews(tourPackage.getReviews());
        existing.setBookings(tourPackage.getBookings());
        existing.setImage(tourPackage.getImage());
        existing.setIncluded(tourPackage.getIncluded());
        existing.setDescription(tourPackage.getDescription());
        existing.getDestinations().clear();
        if (tourPackage.getDestinations() != null) {
            existing.getDestinations().addAll(new ArrayList<>(tourPackage.getDestinations()));
        }
        initializeCollections(existing);
        return existing;
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private void initializeCollections(TourPackage tourPackage) {
        if (tourPackage.getDestinations() != null) {
            tourPackage.getDestinations().size();
        }
    }
}
