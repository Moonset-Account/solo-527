package com.qinghe.course.controller;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.common.Result;
import com.qinghe.course.entity.RefundRequest;
import com.qinghe.course.service.RefundService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @GetMapping
    public Result<PageResult<RefundRequest>> list(QueryParams params) {
        return Result.success(refundService.search(params));
    }

    @GetMapping("/{id}")
    public Result<RefundRequest> detail(@PathVariable Long id) {
        return Result.success(refundService.getById(id));
    }

    @PostMapping
    public Result<RefundRequest> create(@RequestBody RefundRequest request) {
        return Result.success(refundService.create(request));
    }

    @PostMapping("/{id}/reminder")
    public Result<RefundRequest> sendReminder(@PathVariable Long id) {
        return Result.success(refundService.sendReminder(id));
    }

    @PostMapping("/{id}/approve")
    public Result<RefundRequest> approve(@PathVariable Long id, @RequestBody ProcessRequest request) {
        return Result.success(refundService.approve(id, request.getRemark()));
    }

    @PostMapping("/{id}/reject")
    public Result<RefundRequest> reject(@PathVariable Long id, @RequestBody ProcessRequest request) {
        return Result.success(refundService.reject(id, request.getRemark()));
    }

    @Data
    public static class ProcessRequest {
        private String remark;
    }
}
