package com.qinghe.topic.controller;

import com.qinghe.topic.common.Result;
import com.qinghe.topic.dto.StatsQueryDTO;
import com.qinghe.topic.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "数据统计/复盘")
@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @Operation(summary = "数据复盘看板统计")
    @GetMapping("/dashboard")
    public Result<Map<String, Object>> dashboard(StatsQueryDTO query) {
        return Result.success(statsService.getDashboardStats(query));
    }

    @Operation(summary = "工作台待办统计")
    @GetMapping("/todo")
    public Result<Map<String, Object>> todoStats() {
        return Result.success(statsService.getTodoStats());
    }
}
