package com.decoration.crm.controller;

import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.FunnelStage;
import com.decoration.crm.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/funnel-stages")
    public Result<List<FunnelStage>> getFunnelStages() {
        return Result.success(dashboardService.getFunnelStages());
    }

    @GetMapping("/funnel-data")
    public Result<List<Map<String, Object>>> getFunnelData() {
        return Result.success(dashboardService.getFunnelData());
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics() {
        return Result.success(dashboardService.getStatistics());
    }
}
