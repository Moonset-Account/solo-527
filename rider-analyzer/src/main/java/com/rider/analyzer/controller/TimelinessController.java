package com.rider.analyzer.controller;

import com.rider.analyzer.common.Result;
import com.rider.analyzer.dto.FulfillmentDataVO;
import com.rider.analyzer.dto.TimelinessAnalysisDTO;
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

    @GetMapping("/timeout-nodes")
    public Result<List<TimelinessAnalysisDTO>> analyzeTimeoutNodes(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return Result.success(timelinessAnalysisService.analyzeTimeoutNodes(start, end));
    }

    @GetMapping("/fulfillment")
    public Result<List<FulfillmentDataVO>> getFulfillmentData(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return Result.success(timelinessAnalysisService.getFulfillmentData(start, end));
    }

    @GetMapping("/fulfillment-by-station")
    public Result<List<FulfillmentDataVO>> getFulfillmentByStation(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return Result.success(timelinessAnalysisService.getFulfillmentByStation(start, end));
    }

    @GetMapping("/stats")
    public Result<List<TimelinessAnalysisDTO>> getNodeStats() {
        return Result.success(timelinessAnalysisService.getNodeStats());
    }
}
