package com.gym.controller;

import com.gym.common.response.Result;
import com.gym.entity.Booking;
import com.gym.entity.Coach;
import com.gym.repository.BookingRepository;
import com.gym.repository.CoachRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/coach-performance")
public class CoachPerformanceController {

    private final BookingRepository bookingRepository;
    private final CoachRepository coachRepository;

    public CoachPerformanceController(BookingRepository bookingRepository, CoachRepository coachRepository) {
        this.bookingRepository = bookingRepository;
        this.coachRepository = coachRepository;
    }

    private Long getCurrentCoachId() {
        Long currentUserId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Coach coach = coachRepository.findByUserId(currentUserId);
        return coach != null ? coach.getId() : null;
    }

    @GetMapping("/my-stats")
    @PreAuthorize("hasRole('COACH')")
    public Result<Map<String, Object>> getMyStats(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        Long coachId = getCurrentCoachId();
        if (coachId == null) {
            return Result.error("教练信息不存在");
        }

        LocalDate today = LocalDate.now();
        int targetYear = year != null ? year : today.getYear();
        int targetMonth = month != null ? month : today.getMonthValue();

        LocalDateTime startOfMonth = LocalDate.of(targetYear, targetMonth, 1).atStartOfDay();
        LocalDateTime endOfMonth = LocalDate.of(targetYear, targetMonth,
                LocalDate.of(targetYear, targetMonth, 1).lengthOfMonth()).atTime(23, 59, 59);

        long completedSessions = bookingRepository.countCompletedSessionsByCoach(coachId, startOfMonth, endOfMonth);

        Coach coach = coachRepository.findById(coachId).orElse(null);
        BigDecimal baseSalary = coach != null && coach.getBaseSalary() != null ? coach.getBaseSalary() : BigDecimal.ZERO;
        BigDecimal commissionRate = coach != null && coach.getCommissionRate() != null
                ? coach.getCommissionRate() : BigDecimal.ZERO;

        BigDecimal sessionIncome = BigDecimal.valueOf(completedSessions).multiply(BigDecimal.valueOf(200));
        BigDecimal commission = sessionIncome.multiply(commissionRate);
        BigDecimal totalIncome = baseSalary.add(commission);

        Map<String, Object> result = new HashMap<>();
        result.put("coachId", coachId);
        result.put("coachName", coach != null ? coach.getName() : "");
        result.put("year", targetYear);
        result.put("month", targetMonth);
        result.put("completedSessions", completedSessions);
        result.put("baseSalary", baseSalary);
        result.put("commissionRate", commissionRate);
        result.put("sessionIncome", sessionIncome);
        result.put("commission", commission);
        result.put("totalIncome", totalIncome);

        List<Booking> bookings = bookingRepository
                .findByCoachIdAndStartTimeBetweenOrderByStartTime(coachId, startOfMonth, endOfMonth);
        result.put("bookings", bookings);

        return Result.success(result);
    }

    @GetMapping("/my-bookings")
    @PreAuthorize("hasRole('COACH')")
    public Result<List<Booking>> getMyBookings(
            @RequestParam(required = false) String date) {
        Long coachId = getCurrentCoachId();
        if (coachId == null) {
            return Result.error("教练信息不存在");
        }

        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = targetDate.atTime(23, 59, 59);

        return Result.success(bookingRepository
                .findByCoachIdAndStartTimeBetweenOrderByStartTime(coachId, start, end));
    }
}
