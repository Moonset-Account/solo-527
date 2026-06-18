package com.emailgenerator.controller;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.common.Result;
import com.emailgenerator.entity.RiskSample;
import com.emailgenerator.service.RiskSampleService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/risk-samples")
public class RiskSampleController {

    private final RiskSampleService riskSampleService;

    public RiskSampleController(RiskSampleService riskSampleService) {
        this.riskSampleService = riskSampleService;
    }

    @GetMapping
    public Result<PageResult<RiskSample>> list(BaseQuery query,
                                               @RequestParam(required = false) Long taskId) {
        return Result.success(riskSampleService.list(query, taskId));
    }

    @GetMapping("/{id}")
    public Result<RiskSample> getById(@PathVariable Long id) {
        return Result.success(riskSampleService.getById(id));
    }

    @PostMapping("/{id}/review")
    public Result<RiskSample> review(@PathVariable Long id,
                                     @RequestParam String reviewStatus,
                                     @RequestParam(required = false) String reviewComment) {
        String reviewer = "admin";
        return Result.success(riskSampleService.review(id, reviewStatus, reviewComment, reviewer));
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats() {
        return Result.success(riskSampleService.getStats());
    }
}
