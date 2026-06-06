package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.entity.Booking;
import com.gym.enums.BookingStatus;
import com.gym.service.BookingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ApiResponse<Booking> createBooking(@RequestBody Booking booking) {
        return ApiResponse.success(bookingService.createBooking(booking));
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<Booking> cancelBooking(@PathVariable Long id) {
        return ApiResponse.success(bookingService.cancelBooking(id));
    }

    @PutMapping("/{id}/checkin")
    public ApiResponse<Booking> checkIn(@PathVariable Long id) {
        return ApiResponse.success(bookingService.checkIn(id));
    }

    @PutMapping("/{id}/complete")
    public ApiResponse<Booking> completeBooking(@PathVariable Long id) {
        return ApiResponse.success(bookingService.completeBooking(id));
    }

    @GetMapping
    public ApiResponse<List<Booking>> getBookings(
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) Long coachId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) BookingStatus status) {
        return ApiResponse.success(bookingService.getBookings(memberId, coachId, startDate, endDate, status));
    }

    @GetMapping("/{id}")
    public ApiResponse<Booking> getBookingById(@PathVariable Long id) {
        return ApiResponse.success(bookingService.getBookingById(id));
    }

    @GetMapping("/coach/{coachId}/date/{date}")
    public ApiResponse<List<Booking>> getCoachBookingsOnDate(
            @PathVariable Long coachId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(bookingService.getCoachBookingsOnDate(coachId, date));
    }
}
