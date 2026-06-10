package com.energy.dashboard.controller;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.common.Result;
import com.energy.dashboard.entity.Alarm;
import com.energy.dashboard.service.AlarmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/alarms")
public class AlarmController {

    @Autowired
    private AlarmService alarmService;

    @GetMapping
    public Result<PageResult<Alarm>> getList(@RequestParam Map<String, Object> params) {
        return Result.success(alarmService.getList(params));
    }

    @GetMapping("/{id}")
    public Result<Alarm> getById(@PathVariable Long id) {
        return Result.success(alarmService.getById(id));
    }

    @PostMapping("/{id}/confirm")
    public Result<Alarm> confirm(@PathVariable Long id) {
        return Result.success(alarmService.confirm(id));
    }

    @PostMapping("/{id}/resolve")
    public Result<Alarm> resolve(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        return Result.success(alarmService.resolve(id, data));
    }

    @GetMapping("/review")
    public Result<Map<String, Object>> getReview(@RequestParam String month) {
        return Result.success(alarmService.getReview(month));
    }
}
