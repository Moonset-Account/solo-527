package com.courselearning.controller;

import com.courselearning.common.Result;
import com.courselearning.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/stats")
@PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @GetMapping("/overview")
    public Result<Map<String, Object>> overview() {
        Map<String, Object> result = statsService.getOverview();
        return Result.success(result);
    }

    @GetMapping("/drilldown")
    public Result<Map<String, Object>> drilldown(
            @RequestParam(defaultValue = "day") String dimension,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long userId) {
        Map<String, Object> result = statsService.getDrilldown(dimension, startDate, endDate, courseId, userId);
        return Result.success(result);
    }

    @GetMapping("/commission")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Map<String, Object>> commission(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long referrerId) {
        Map<String, Object> result = statsService.getCommissionReport(startDate, endDate, referrerId);
        return Result.success(result);
    }
}
