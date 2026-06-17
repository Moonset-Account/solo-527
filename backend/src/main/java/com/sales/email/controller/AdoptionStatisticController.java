package com.sales.email.controller;

import com.sales.email.common.Result;
import com.sales.email.dto.AdoptionStatQueryDTO;
import com.sales.email.entity.AdoptionStatistic;
import com.sales.email.service.AdoptionStatisticService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/adoption-stat")
@RequiredArgsConstructor
public class AdoptionStatisticController {

    private final AdoptionStatisticService statisticService;

    @PostMapping("/query")
    public Result<List<AdoptionStatistic>> queryStatistics(@RequestBody AdoptionStatQueryDTO query) {
        return Result.success(statisticService.queryStatistics(query));
    }

    @PostMapping("/summary")
    public Result<Map<String, Object>> getSummaryStatistics(@RequestBody AdoptionStatQueryDTO query) {
        return Result.success(statisticService.getSummaryStatistics(query));
    }
}
