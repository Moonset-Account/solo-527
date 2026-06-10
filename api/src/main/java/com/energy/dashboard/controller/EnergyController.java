package com.energy.dashboard.controller;

import com.energy.dashboard.common.Result;
import com.energy.dashboard.entity.EnergyData;
import com.energy.dashboard.service.EnergyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/energy")
public class EnergyController {

    @Autowired
    private EnergyService energyService;

    @GetMapping("/overview")
    public Result<Map<String, Object>> getOverview() {
        return Result.success(energyService.getOverview());
    }

    @GetMapping("/curve")
    public Result<List<EnergyData>> getCurve(
            @RequestParam(defaultValue = "day") String period,
            @RequestParam(required = false) Long zoneId) {
        return Result.success(energyService.getCurve(period, zoneId));
    }

    @GetMapping("/zone-comparison")
    public Result<List<Map<String, Object>>> getZoneComparison() {
        return Result.success(energyService.getZoneComparison());
    }
}
