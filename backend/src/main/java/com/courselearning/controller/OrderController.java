package com.courselearning.controller;

import com.courselearning.common.PageResult;
import com.courselearning.common.Result;
import com.courselearning.dto.CommissionDisputeDTO;
import com.courselearning.dto.OrderCreateDTO;
import com.courselearning.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/create")
    public Result<Map<String, Object>> create(@Valid @RequestBody OrderCreateDTO dto) {
        Map<String, Object> result = orderService.createOrder(dto);
        return Result.success("订单创建成功", result);
    }

    @PostMapping("/callback")
    public Result<Void> callback(
            @RequestParam String orderNo,
            @RequestParam Integer payStatus,
            @RequestParam(required = false) String payMethod) {
        orderService.paymentCallback(orderNo, payStatus, payMethod);
        return Result.success("回调处理成功", null);
    }

    @GetMapping("/list")
    public Result<PageResult<Map<String, Object>>> list(
            @RequestParam(defaultValue = "1") Long pageNum,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) Integer payStatus,
            @RequestParam(required = false) Integer commissionStatus,
            @RequestParam(required = false) String orderType,
            @RequestParam(required = false) Long userId) {
        PageResult<Map<String, Object>> result = orderService.getOrderList(
                pageNum, pageSize, payStatus, commissionStatus, orderType, userId);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getDetail(@PathVariable Long id) {
        Map<String, Object> result = orderService.getOrderDetail(id);
        return Result.success(result);
    }

    @PutMapping("/commission-dispute")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> commissionDispute(@Valid @RequestBody CommissionDisputeDTO dto) {
        orderService.triggerCommissionDispute(dto.getOrderId(), dto.getNote());
        return Result.success("佣金争议已触发", null);
    }

    @PutMapping("/commission-confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> commissionConfirm(
            @RequestParam Long orderId,
            @RequestParam Boolean resolve) {
        orderService.confirmCommissionDispute(orderId, resolve);
        return Result.success(resolve ? "争议已解决" : "争议已确认关闭", null);
    }

    @PostMapping("/settle/{referrerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Integer> settleCommission(@PathVariable Long referrerId) {
        int count = orderService.settleCommission(referrerId);
        return Result.success("结算完成，共结算" + count + "笔佣金", count);
    }

    @GetMapping("/repurchase-stats")
    public Result<Map<String, Object>> repurchaseStats(
            @RequestParam(required = false) Long referrerId) {
        Map<String, Object> result = orderService.getRepurchaseStats(referrerId);
        return Result.success(result);
    }
}
