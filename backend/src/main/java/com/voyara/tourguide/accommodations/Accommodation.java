package com.voyara.tourguide.accommodations;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Accommodation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    private String type = "Hotel";
    private Long destinationId;
    private String location;
    private String country;
    private BigDecimal price = BigDecimal.ZERO;
    private int rooms;
    private double rating;
    private int reviews;
    private String status = "Active";

    @ElementCollection
    @CollectionTable(name = "accommodation_amenities", joinColumns = @JoinColumn(name = "accommodation_id"))
    @Column(name = "amenities")
    private List<String> amenities = new ArrayList<>();

    private String image;
    private int occupancy;
}
