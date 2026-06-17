package com.sales.email.controller;

import com.sales.email.common.PageResult;
import com.sales.email.common.Result;
import com.sales.email.dto.EmailReviewDTO;
import com.sales.email.entity.EmailReview;
import com.sales.email.service.EmailReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/email-review")
@RequiredArgsConstructor
public class EmailReviewController {

    private final EmailReviewService reviewService;

    @PostMapping("/ai-review/{draftId}/{version}")
    public Result<EmailReview> aiReview(@PathVariable Long draftId, @PathVariable Integer version) {
        return Result.success(reviewService.aiReview(draftId, version));
    }

    @PostMapping("/manual-review")
    public Result<EmailReview> manualReview(@RequestBody EmailReviewDTO dto) {
        return Result.success(reviewService.manualReview(dto));
    }

    @GetMapping("/query")
    public Result<PageResult<EmailReview>> queryReviews(
            @RequestParam(required = false) Long pageNum,
            @RequestParam(required = false) Long pageSize,
            @RequestParam(required = false) Long draftId,
            @RequestParam(required = false) String reviewType,
            @RequestParam(required = false) String reviewResult,
            @RequestParam(required = false) Long reviewerId,
            @RequestParam(required = false) String sourceOrderNo,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return Result.success(reviewService.queryReviews(pageNum, pageSize, draftId, reviewType,
                reviewResult, reviewerId, sourceOrderNo, startDate, endDate));
    }

    @GetMapping("/pending/{supervisorId}")
    public Result<List<EmailReview>> getPendingReviews(@PathVariable(required = false) Long supervisorId) {
        return Result.success(reviewService.getPendingReviews(supervisorId));
    }

    @GetMapping("/pending-count/{supervisorId}")
    public Result<Map<String, Object>> getPendingCount(@PathVariable(required = false) Long supervisorId) {
        long count = reviewService.countPendingManualReviews(supervisorId);
        return Result.success(Map.of("count", count));
    }
}
