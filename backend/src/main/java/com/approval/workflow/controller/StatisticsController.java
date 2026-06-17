package com.approval.workflow.controller;

import com.approval.workflow.dto.ApiResponse;
import com.approval.workflow.dto.EfficiencyStatsDTO;
import com.approval.workflow.service.StatisticsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/overview")
    public ApiResponse<Map<String, Object>> getOverviewStats() {
        Map<String, Object> stats = statisticsService.getOverallStats();
        return ApiResponse.success(stats);
    }

    @GetMapping("/dept/{deptId}")
    public ApiResponse<Map<String, Object>> getDeptStats(@PathVariable Long deptId) {
        Map<String, Object> stats = statisticsService.getDeptEfficiencyStats(deptId);
        return ApiResponse.success(stats);
    }

    @PostMapping("/dept/batch")
    public ApiResponse<List<EfficiencyStatsDTO>> getDeptStatsBatch(@RequestBody List<Long> deptIds) {
        List<EfficiencyStatsDTO> stats = statisticsService.getDeptEfficiencyBatch(deptIds);
        return ApiResponse.success(stats);
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<Map<String, Object>> getUserStats(@PathVariable Long userId) {
        Map<String, Object> stats = statisticsService.getUserEfficiencyStats(userId);
        return ApiResponse.success(stats);
    }
}
