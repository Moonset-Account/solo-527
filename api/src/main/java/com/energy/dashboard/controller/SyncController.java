package com.energy.dashboard.controller;

import com.energy.dashboard.common.PageResult;
import com.energy.dashboard.common.Result;
import com.energy.dashboard.service.SyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sync/tasks")
public class SyncController {

    @Autowired
    private SyncService syncService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> getTasks(@RequestParam Map<String, Object> params) {
        return Result.success(syncService.getTasks(params));
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getTaskById(@PathVariable Long id) {
        return Result.success(syncService.getTaskById(id));
    }

    @PostMapping("/{id}/retry")
    public Result<Map<String, Object>> retry(@PathVariable Long id) {
        return Result.success(syncService.retry(id));
    }
}
