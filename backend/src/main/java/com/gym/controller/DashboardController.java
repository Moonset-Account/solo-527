package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long coachId) {
        return ApiResponse.success(dashboardService.getDashboardStats(startDate, endDate, coachId));
    }

    @GetMapping("/coach/{coachId}/performance")
    public ApiResponse<Map<String, Object>> getCoachPerformance(
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
