package com.voyara.tourguide.vehiclerental;

import com.voyara.tourguide.common.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VehicleService {
    private final VehicleRepository repository;

    public VehicleService(VehicleRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Vehicle> findAll() {
        List<Vehicle> vehicles = repository.findAll();
        vehicles.forEach(this::initializeCollections);
        return vehicles;
    }

    @Transactional(readOnly = true)
    public Vehicle findById(Long id) {
        Vehicle vehicle = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        initializeCollections(vehicle);
        return vehicle;
    }

    @Transactional
    public Vehicle save(Vehicle vehicle) {
        Vehicle saved = repository.save(vehicle);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public Vehicle update(Long id, Vehicle vehicle) {
        repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        vehicle.setId(id);
        Vehicle saved = repository.save(vehicle);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Vehicle vehicle = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Vehicle", id));
        repository.delete(vehicle);
    }

    private void initializeCollections(Vehicle vehicle) {
        vehicle.getFeatures().size();
    }
}
