package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.dto.ReportQueryDTO;
import com.pm.workstation.entity.CollaborationReport;
import com.pm.workstation.service.ReportService;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @PostMapping("/generate")
    public ApiResponseDTO<CollaborationReport> generateDailyReport() {
        return ApiResponseDTO.success(reportService.generateDailyReport());
    }

    @GetMapping
    public ApiResponseDTO<PageResultDTO<CollaborationReport>> getReports(ReportQueryDTO query) {
        return ApiResponseDTO.success(reportService.getReports(query));
    }

    @GetMapping("/delay-ratio")
    public ApiResponseDTO<BigDecimal> getDelayRatio(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ApiResponseDTO.success(reportService.getDelayRatio(startDate, endDate));
    }

    @GetMapping("/dept-metrics")
    public ApiResponseDTO<Map<String, Object>> getDeptMetrics() {
        return ApiResponseDTO.success(reportService.getDeptMetrics());
    }
}
