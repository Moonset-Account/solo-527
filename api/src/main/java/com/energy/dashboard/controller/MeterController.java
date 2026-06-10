package com.energy.dashboard.controller;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.common.Result;
import com.energy.dashboard.entity.Meter;
import com.energy.dashboard.service.MeterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/meters")
public class MeterController {

    @Autowired
    private MeterService meterService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> getList(@RequestParam Map<String, Object> params) {
        return Result.success(meterService.getList(params));
    }

    @PostMapping
    public Result<Meter> create(@RequestBody Meter meter) {
        return Result.success(meterService.create(meter));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getById(@PathVariable Long id) {
        return Result.success(meterService.getById(id));
    }

    @PutMapping("/{id}")
    public Result<Meter> update(@PathVariable Long id, @RequestBody Meter meter) {
        return Result.success(meterService.update(id, meter));
    }
}
