package com.carcore.admin.controller;

import com.carcore.admin.common.PageResult;
import com.carcore.admin.common.RequireRole;
import com.carcore.admin.common.Result;
import com.carcore.admin.dto.ReportGenerateDTO;
import com.carcore.admin.entity.EfficiencyReport;
import com.carcore.admin.service.EfficiencyReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/efficiency-reports")
public class EfficiencyReportController {

    private final EfficiencyReportService efficiencyReportService;

    public EfficiencyReportController(EfficiencyReportService efficiencyReportService) {
        this.efficiencyReportService = efficiencyReportService;
    }

    @GetMapping("/{id}")
    public Result<EfficiencyReport> getById(@PathVariable Long id) {
        return Result.success(efficiencyReportService.getById(id));
    }

    @GetMapping("/no/{reportNo}")
    public Result<EfficiencyReport> getByNo(@PathVariable String reportNo) {
        return Result.success(efficiencyReportService.getByReportNo(reportNo));
    }

    @GetMapping("/{id}/detail")
    public Result<Map<String, Object>> getDetail(@PathVariable Long id) {
        return Result.success(efficiencyReportService.getReportDetail(id));
    }

    @GetMapping("/page")
    public Result<PageResult<EfficiencyReport>> page(
            @RequestParam(required = false) String reportNo,
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(efficiencyReportService.page(
                reportNo, reportType, startDate, endDate, pageNum, pageSize));
    }

    @PostMapping("/generate")
    @RequireRole({"ADMIN", "BOSS"})
    public Result<EfficiencyReport> generate(@RequestBody ReportGenerateDTO dto) {
        return Result.success(efficiencyReportService.generate(dto));
    }
}
