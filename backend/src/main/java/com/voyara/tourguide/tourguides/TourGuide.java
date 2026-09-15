package com.voyara.tourguide.tourguides;

import jakarta.persistence.ElementCollection;
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
public class TourGuide {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    private String initials;
    private String color = "#6b7280";
    private String location;
    private String country;

    @ElementCollection
    private List<String> specialties = new ArrayList<>();

    @ElementCollection
    private List<String> languages = new ArrayList<>();

    private double rating;
    private int reviews;
    private BigDecimal pricePerDay = BigDecimal.ZERO;
    private int experience;
    private String status = "Available";
    private String bio;
    private int toursCompleted;
}
