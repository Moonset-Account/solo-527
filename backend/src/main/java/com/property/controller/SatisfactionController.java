package com.property.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.property.common.Result;
import com.property.entity.Satisfaction;
import com.property.service.SatisfactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/satisfaction")
public class SatisfactionController {

    @Autowired
    private SatisfactionService satisfactionService;

    @PostMapping
    public Result<Satisfaction> submit(
            @RequestParam Long workOrderId,
            @RequestParam Integer overallScore,
            @RequestParam(required = false) Integer responseSpeedScore,
            @RequestParam(required = false) Integer serviceAttitudeScore,
            @RequestParam(required = false) Integer qualityScore,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) Integer isSolved) {
        return satisfactionService.submitSatisfaction(workOrderId, overallScore,
                responseSpeedScore, serviceAttitudeScore, qualityScore, content, isSolved);
    }

    @GetMapping
    public Result<IPage<Satisfaction>> getPage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer minScore,
            @RequestParam(required = false) Long ownerId) {
        return Result.success(satisfactionService.getSatisfactionPage(page, size, minScore, ownerId));
    }
}
