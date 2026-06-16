package com.rider.analyzer.controller;

import com.rider.analyzer.common.Result;
import com.rider.analyzer.dto.FulfillmentDataVO;
import com.rider.analyzer.dto.TimelinessAnalysisDTO;
import com.rider.analyzer.dto.TimelinessAnalysisVO;
import com.rider.analyzer.dto.TimeoutOrderDetailVO;
import com.rider.analyzer.dto.TimeoutReasonVO;
import com.rider.analyzer.service.TimelinessAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/timeliness")
@RequiredArgsConstructor
public class TimelinessController {

    private final TimelinessAnalysisService timelinessAnalysisService;

    @GetMapping("/stats")
    public Result<List<TimelinessAnalysisDTO>> getNodeStats() {
        return Result.success(timelinessAnalysisService.getNodeStats());
    }

    @GetMapping("/analysis")
    public Result<TimelinessAnalysisVO> getFullAnalysis() {
        return Result.success(timelinessAnalysisService.getFullAnalysis());
    }

    @GetMapping("/timeout-reasons")
    public Result<List<TimeoutReasonVO>> getTimeoutReasons() {
        return Result.success(timelinessAnalysisService.getTimeoutReasons());
    }

    @GetMapping("/timeout-orders")
    public Result<List<TimeoutOrderDetailVO>> getTimeoutOrders() {
        return Result.success(timelinessAnalysisService.getTimeoutOrderDetails());
    }

    @GetMapping("/timeout-nodes")
    public Result<List<TimelinessAnalysisDTO>> analyzeTimeoutNodes(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return Result.success(timelinessAnalysisService.analyzeTimeoutNodes(start, end));
    }

    @GetMapping("/fulfillment")
    public Result<List<FulfillmentDataVO>> getFulfillmentData(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        if (start == null) start = LocalDateTime.now().minusDays(7);
        if (end == null) end = LocalDateTime.now();
        return Result.success(timelinessAnalysisService.getFulfillmentData(start, end));
    }

    @GetMapping("/fulfillment-by-station")
    public Result<List<FulfillmentDataVO>> getFulfillmentByStation(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        if (start == null) start = LocalDateTime.now().minusDays(7);
        if (end == null) end = LocalDateTime.now();
        return Result.success(timelinessAnalysisService.getFulfillmentByStation(start, end));
    }
}
