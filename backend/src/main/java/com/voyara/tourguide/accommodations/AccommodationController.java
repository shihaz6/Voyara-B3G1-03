package com.voyara.tourguide.accommodations;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accommodations")
public class AccommodationController {
    private final AccommodationService service;

    public AccommodationController(AccommodationService service) {
        this.service = service;
    }

    @GetMapping
    public List<Accommodation> all(
            @RequestParam(required = false) Long destinationId,
            @RequestParam(required = false) String destination
    ) {
        if (destinationId != null || (destination != null && !destination.isBlank())) {
            return service.findByDestination(destinationId, destination);
        }
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Accommodation one(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Accommodation create(@Valid @RequestBody Accommodation accommodation) {
        return service.save(accommodation);
    }

    @PutMapping("/{id}")
    public Accommodation update(@PathVariable Long id, @Valid @RequestBody Accommodation accommodation) {
        return service.update(id, accommodation);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
