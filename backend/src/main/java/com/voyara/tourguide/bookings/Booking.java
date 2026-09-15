package com.voyara.tourguide.bookings;

import com.voyara.tourguide.users.AppUser;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Booking {
    @Id
    private String id;

    @NotBlank
    private String guest;

    @Email
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tourist_user_id")
    @JsonIgnore
    private AppUser tourist;

    private String bookingType = "PACKAGE";
    private String destination;
    private String pkg;
    private String guide;
    private String guideSelectionType = "VOYARA";
    private Long guideResourceId;
    private String accommodation;
    private String accommodationSelectionType = "VOYARA";
    private Long accommodationResourceId;
    private String vehicle;
    private String vehicleSelectionType = "VOYARA";
    private Long vehicleResourceId;
    private LocalDate checkIn;
    private LocalDate checkOut;

    @Min(1)
    private int guests = 1;

    private BigDecimal total = BigDecimal.ZERO;
    private String status = "Pending";
    private String payment = "Pending";
    private String notes;
    private LocalDate createdAt = LocalDate.now();
}
