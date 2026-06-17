package com.citytour.inventory.controller;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.dto.Result;
import com.citytour.inventory.entity.RefundRecord;
import com.citytour.inventory.service.RefundService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/admin/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @GetMapping
    public Result<PageResult<RefundRecord>> list(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size,
                                                 @RequestParam(required = false) String refundNo,
                                                 @RequestParam(required = false) String orderNo,
                                                 @RequestParam(required = false) Long routeId,
                                                 @RequestParam(required = false) String refundStatus,
                                                 @RequestParam(required = false) String refundType) {
        return Result.success(refundService.list(page, size, refundNo, orderNo, routeId,
                refundStatus, refundType));
    }

    @GetMapping("/{id}")
    public Result<RefundRecord> getById(@PathVariable Long id) {
        return Result.success(refundService.getById(id));
    }

    @GetMapping("/no/{refundNo}")
    public Result<RefundRecord> getByRefundNo(@PathVariable String refundNo) {
        return Result.success(refundService.getByRefundNo(refundNo));
    }

    @PostMapping("/apply")
    public Result<RefundRecord> applyRefund(@RequestParam String orderNo,
                                            @RequestParam BigDecimal refundAmount,
                                            @RequestParam String refundReason,
                                            @RequestParam(required = false, defaultValue = "NORMAL") String refundType,
                                            @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        return Result.success(refundService.applyRefund(orderNo, refundAmount, refundReason, refundType, operator));
    }

    @PostMapping("/{id}/approve")
    public Result<RefundRecord> approveRefund(@PathVariable Long id,
                                              @RequestHeader(value = "X-User", defaultValue = "admin") String approver) {
        return Result.success(refundService.approveRefund(id, approver));
    }

    @PostMapping("/{id}/reject")
    public Result<RefundRecord> rejectRefund(@PathVariable Long id,
                                             @RequestParam String rejectReason,
                                             @RequestHeader(value = "X-User", defaultValue = "admin") String approver) {
        return Result.success(refundService.rejectRefund(id, approver, rejectReason));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        refundService.delete(id);
        return Result.success();
    }
}
