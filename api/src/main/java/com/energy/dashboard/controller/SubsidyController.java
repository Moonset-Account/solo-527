package com.energy.dashboard.controller;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.common.Result;
import com.energy.dashboard.entity.Subsidy;
import com.energy.dashboard.service.SubsidyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/subsidies")
public class SubsidyController {

    @Autowired
    private SubsidyService subsidyService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> getList(@RequestParam Map<String, Object> params) {
        return Result.success(subsidyService.getList(params));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getById(@PathVariable Long id) {
        return Result.success(subsidyService.getById(id));
    }

    @PostMapping
    public Result<Subsidy> create(@RequestBody Subsidy subsidy) {
        return Result.success(subsidyService.create(subsidy));
    }

    @PostMapping("/{id}/approve")
    public Result<Map<String, Object>> approve(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        return Result.success(subsidyService.approve(id, data));
    }
}
