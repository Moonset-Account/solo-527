package com.emailgenerator.controller;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.Result;
import com.emailgenerator.service.StatsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/overview")
    public Result<Map<String, Object>> getOverview() {
        return Result.success(statsService.getOverview());
    }

    @GetMapping("/accuracy")
    public Result<Map<String, Object>> getAccuracyStats(BaseQuery query) {
        return Result.success(statsService.getAccuracyStats(query));
    }
}
