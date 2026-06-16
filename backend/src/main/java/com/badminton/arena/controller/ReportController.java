package com.badminton.arena.controller;

import com.badminton.arena.common.Result;
import com.badminton.arena.service.ReportService;
import com.badminton.arena.vo.CourtUsageTrendVO;
import com.badminton.arena.vo.InventoryReportVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/report")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/court-usage-trend")
    public Result<List<CourtUsageTrendVO>> getCourtUsageTrend(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(required = false) Long courtId) {
        List<CourtUsageTrendVO> list = reportService.getCourtUsageTrend(startDate, endDate, courtId);
        return Result.success(list);
    }

    @GetMapping("/inventory")
    public Result<List<InventoryReportVO>> getInventoryReport(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(required = false) String reportType) {
        List<InventoryReportVO> list = reportService.getInventoryReport(startDate, endDate, reportType);
        return Result.success(list);
    }

    @PostMapping("/generate/court-usage")
    public Result<Void> generateCourtUsageStats(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate statDate) {
        reportService.generateCourtUsageStats(statDate);
        return Result.success();
    }

    @PostMapping("/generate/inventory")
    public Result<Void> generateInventoryReport(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate reportDate) {
        reportService.generateInventoryReport(reportDate);
        return Result.success();
    }
}
