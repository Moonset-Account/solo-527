package com.rider.analyzer.controller;

import com.rider.analyzer.common.Result;
import com.rider.analyzer.dto.DashboardStatsDTO;
import com.rider.analyzer.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public Result<DashboardStatsDTO> getStats() {
        return Result.success(dashboardService.getStats());
    }

    @GetMapping("/settlement-accuracy")
    public Result<BigDecimal> getSettlementAccuracy() {
        return Result.success(dashboardService.getSettlementAccuracy());
    }
}
