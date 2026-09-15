package com.voyara.tourguide.vehiclerental;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    private String brand;
    private String model;
    @Column(name = "model_year")
    private int year;
    private String type = "Car";
    private int capacity;
    private BigDecimal pricePerDay = BigDecimal.ZERO;
    private String status = "Available";
    private String transmission = "Automatic";
    private String fuel = "Petrol";

    @ElementCollection
    private List<String> features = new ArrayList<>();

    private String location;
    private String image;
    private int mileage;
    private String plate;
}
