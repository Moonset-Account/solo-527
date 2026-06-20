package com.datagrowth.portal.controller;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.ReportEfficiency;
import com.datagrowth.portal.service.ReportEfficiencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/report-efficiency")
@RequiredArgsConstructor
public class ReportEfficiencyController {

    private final ReportEfficiencyService efficiencyService;

    @GetMapping
    public ApiResponse<Page<ReportEfficiency>> getEfficiencyList(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "statDate", "avgGenerationTimeMs"));
        return efficiencyService.getEfficiencyList(startDate, endDate, pageable);
    }

    @GetMapping("/trend")
    public ApiResponse<List<ReportEfficiency>> getEfficiencyTrend(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return efficiencyService.getEfficiencyTrend(startDate, endDate);
    }

    @GetMapping("/summary")
    public ApiResponse<List<Map<String, Object>>> getEfficiencySummary(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return efficiencyService.getEfficiencySummary(startDate, endDate);
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> getDashboardData(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return efficiencyService.getDashboardData(startDate, endDate);
    }

    @PostMapping
    public ApiResponse<ReportEfficiency> recordEfficiency(@RequestBody ReportEfficiency efficiency) {
        return efficiencyService.recordEfficiency(efficiency);
    }
}
