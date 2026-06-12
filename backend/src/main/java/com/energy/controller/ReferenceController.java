package com.energy.controller;

import com.energy.common.Result;
import com.energy.entity.PeakLoad;
import com.energy.entity.PriceRule;
import com.energy.entity.Strategy;
import com.energy.service.ReferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reference")
@RequiredArgsConstructor
public class ReferenceController {

    private final ReferenceService referenceService;

    @GetMapping("/prices")
    public Result<List<PriceRule>> getPrices(
            @RequestParam(required = false) String area,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return Result.success(referenceService.getPriceRules(area, date));
    }

    @GetMapping("/strategies")
    public Result<List<Strategy>> getStrategies(@RequestParam(required = false) Boolean activeOnly) {
        return Result.success(referenceService.getStrategies(activeOnly));
    }

    @GetMapping("/strategies/{code}/versions")
    public Result<List<Strategy>> getStrategyVersions(@PathVariable String code) {
        return Result.success(referenceService.getStrategyVersions(code));
    }

    @GetMapping("/strategies/{code}/{version}")
    public Result<Strategy> getStrategy(@PathVariable String code, @PathVariable String version) {
        return Result.success(referenceService.getStrategyByCodeAndVersion(code, version));
    }

    @GetMapping("/peak-loads")
    public Result<List<PeakLoad>> getPeakLoads(
            @RequestParam(required = false) String area,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return Result.success(referenceService.getPeakLoads(area, start, end));
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return Result.success(referenceService.getStatistics(start, end));
    }

    @GetMapping("/failed-peaks")
    public Result<List<PeakLoad>> getFailedPeaks() {
        return Result.success(referenceService.getFailedPeaks());
    }

    @GetMapping("/failed-strategies")
    public Result<List<Strategy>> getFailedStrategies() {
        return Result.success(referenceService.getFailedStrategies());
    }
}
