package com.carcore.admin.controller;

import com.carcore.admin.common.PageResult;
import com.carcore.admin.common.RequireRole;
import com.carcore.admin.common.Result;
import com.carcore.admin.entity.MemberPackageOrder;
import com.carcore.admin.service.MemberPackageOrderService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/member-package-orders")
public class MemberPackageOrderController {

    private final MemberPackageOrderService memberPackageOrderService;

    public MemberPackageOrderController(MemberPackageOrderService memberPackageOrderService) {
        this.memberPackageOrderService = memberPackageOrderService;
    }

    @GetMapping("/{id}")
    public Result<MemberPackageOrder> getById(@PathVariable Long id) {
        return Result.success(memberPackageOrderService.getById(id));
    }

    @GetMapping("/no/{orderNo}")
    public Result<MemberPackageOrder> getByOrderNo(@PathVariable String orderNo) {
        return Result.success(memberPackageOrderService.getByOrderNo(orderNo));
    }

    @GetMapping("/page")
    public Result<PageResult<MemberPackageOrder>> page(
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) Long packageId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(memberPackageOrderService.page(
                orderNo, memberId, packageId, status, startDate, endDate, pageNum, pageSize));
    }

    @PostMapping
    @RequireRole({"ADMIN", "BOSS"})
    public Result<MemberPackageOrder> create(@RequestBody MemberPackageOrder order) {
        return Result.success(memberPackageOrderService.createOrder(order));
    }

    @PutMapping("/{id}/use")
    @RequireRole({"ADMIN", "MANAGER", "TECHNICIAN"})
    public Result<MemberPackageOrder> useOrder(@PathVariable Long id) {
        return Result.success(memberPackageOrderService.useOrder(id));
    }

    @PutMapping("/{id}/expire")
    @RequireRole({"ADMIN", "BOSS"})
    public Result<MemberPackageOrder> expireOrder(@PathVariable Long id) {
        return Result.success(memberPackageOrderService.expireOrder(id));
    }
}
