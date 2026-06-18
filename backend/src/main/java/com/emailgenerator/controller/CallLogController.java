package com.emailgenerator.controller;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.common.Result;
import com.emailgenerator.entity.CallLog;
import com.emailgenerator.service.CallLogService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/call-logs")
public class CallLogController {

    private final CallLogService callLogService;

    public CallLogController(CallLogService callLogService) {
        this.callLogService = callLogService;
    }

    @GetMapping
    public Result<PageResult<CallLog>> list(BaseQuery query) {
        return Result.success(callLogService.list(query));
    }

    @GetMapping("/{id}")
    public Result<CallLog> getById(@PathVariable Long id) {
        return Result.success(callLogService.getById(id));
    }

    @GetMapping("/stats/errors")
    public Result<List<Map<String, Object>>> getErrorStats(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {
        return Result.success(callLogService.getErrorStats(startTime, endTime));
    }

    @GetMapping("/stats/apis")
    public Result<List<Map<String, Object>>> getApiStats(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime) {
        return Result.success(callLogService.getApiStats(startTime, endTime));
    }
}
