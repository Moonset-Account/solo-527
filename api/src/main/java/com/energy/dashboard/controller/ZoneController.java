package com.energy.dashboard.controller;

import com.energy.dashboard.common.Result;
import com.energy.dashboard.entity.Zone;
import com.energy.dashboard.service.ZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    @Autowired
    private ZoneService zoneService;

    @GetMapping
    public Result<List<Map<String, Object>>> getList() {
        return Result.success(zoneService.getList());
    }

    @PostMapping
    public Result<Zone> create(@RequestBody Zone zone) {
        return Result.success(zoneService.create(zone));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getById(@PathVariable Long id) {
        return Result.success(zoneService.getById(id));
    }

    @PutMapping("/{id}")
    public Result<Zone> update(@PathVariable Long id, @RequestBody Zone zone) {
        zone.setId(id);
        return Result.success(zoneService.update(zone));
    }

    @GetMapping("/{id}/meters")
    public Result<List<Map<String, Object>>> getMeters(@PathVariable Long id) {
        return Result.success(zoneService.getMeters(id));
    }

    @GetMapping("/{id}/energy")
    public Result<Map<String, Object>> getEnergy(@PathVariable Long id) {
        return Result.success(zoneService.getEnergy(id));
    }
}
