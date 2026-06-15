package com.qinghe.topic.controller;

import com.qinghe.topic.common.PageResult;
import com.qinghe.topic.common.Result;
import com.qinghe.topic.dto.ReviewDTO;
import com.qinghe.topic.dto.ReviewQueryDTO;
import com.qinghe.topic.entity.ReviewRecord;
import com.qinghe.topic.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "审核管理(变更追溯)")
@RestController
@RequestMapping("/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "审核记录分页")
    @GetMapping("/page")
    public Result<PageResult<ReviewRecord>> page(ReviewQueryDTO query) {
        return Result.success(reviewService.page(query));
    }

    @Operation(summary = "查询业务的所有审核记录(按版本排序)")
    @GetMapping("/list/{businessId}")
    public Result<List<ReviewRecord>> listByBusiness(
            @PathVariable Long businessId,
            @RequestParam(required = false) Integer reviewType) {
        return Result.success(reviewService.listByBusiness(businessId, reviewType));
    }

    @Operation(summary = "审核记录详情")
    @GetMapping("/{id}")
    public Result<ReviewRecord> getById(@PathVariable Long id) {
        return Result.success(reviewService.getById(id));
    }

    @Operation(summary = "新增审核记录(记录变更)")
    @PostMapping("/add")
    public Result<Void> addRecord(@RequestBody ReviewDTO dto) {
        reviewService.addRecord(dto);
        return Result.success();
    }
}
