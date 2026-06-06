package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.enums.BookingStatus;
import com.gym.service.DashboardService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long coachId,
            @RequestParam(required = false) BookingStatus status) {
        return ApiResponse.success(dashboardService.getDashboardStats(startDate, endDate, coachId, status));
    }

    @GetMapping("/coach/{coachId}/performance")
    public ApiResponse<List<Map<String, Object>>> getCoachPerformance(
            @PathVariable Long coachId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(dashboardService.getCoachPerformance(coachId, startDate, endDate));
    }

    @GetMapping("/renewal-funnel")
    public ApiResponse<List<Map<String, Object>>> getRenewalFunnel() {
        return ApiResponse.success(dashboardService.getRenewalFunnel());
    }
}
