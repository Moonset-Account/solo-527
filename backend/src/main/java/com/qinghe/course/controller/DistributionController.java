package com.qinghe.course.controller;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.common.Result;
import com.qinghe.course.entity.DistributionCommission;
import com.qinghe.course.service.DistributionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/distribution")
@RequiredArgsConstructor
public class DistributionController {

    private final DistributionService distributionService;

    @GetMapping("/commissions")
    public Result<PageResult<DistributionCommission>> listCommissions(QueryParams params) {
        return Result.success(distributionService.search(params));
    }

    @GetMapping("/commissions/{id}")
    public Result<DistributionCommission> getCommission(@PathVariable Long id) {
        return Result.success(distributionService.getById(id));
    }

    @PostMapping("/commissions")
    public Result<DistributionCommission> createCommission(@RequestBody DistributionCommission commission) {
        return Result.success(distributionService.create(commission));
    }

    @PostMapping("/commissions/{id}/settle")
    public Result<DistributionCommission> settleCommission(@PathVariable Long id, @RequestBody SettleRequest request) {
        return Result.success(distributionService.settle(id, request.getRemark()));
    }

    @Data
    public static class SettleRequest {
        private String remark;
    }
}
