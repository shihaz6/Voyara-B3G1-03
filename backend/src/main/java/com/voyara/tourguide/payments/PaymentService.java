package com.voyara.tourguide.payments;

import com.voyara.tourguide.bookings.Booking;
import com.voyara.tourguide.bookings.BookingService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final BookingService bookingService;

    public PaymentService(PaymentRepository paymentRepository, BookingService bookingService) {
        this.paymentRepository = paymentRepository;
        this.bookingService = bookingService;
    }

    @Transactional(readOnly = true)
    public Payment findForBooking(Booking booking) {
        return paymentRepository.findByBookingId(booking.getId()).orElse(null);
    }

    @Transactional
    public Payment pay(Booking booking, String paymentMethod) {
        if (!"Confirmed".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment is available after the booking is confirmed");
        }
        if (paymentRepository.findByBookingId(booking.getId()).isPresent() || "Paid".equals(booking.getPayment())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This booking has already been paid");
        }
        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a payment method");
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(booking.getTotal() == null ? BigDecimal.ZERO : booking.getTotal());
        payment.setPaymentMethod(paymentMethod.trim());
        payment.setStatus("Paid");
        payment.setTransactionReference("VYR-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        payment.setPaidAt(Instant.now());
        booking.setPayment("Paid");
        bookingService.saveExisting(booking);
        return paymentRepository.save(payment);
    }
}
