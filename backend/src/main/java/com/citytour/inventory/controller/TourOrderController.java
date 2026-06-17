package com.citytour.inventory.controller;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.dto.Result;
import com.citytour.inventory.entity.TourOrder;
import com.citytour.inventory.service.TourOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
public class TourOrderController {

    private final TourOrderService tourOrderService;

    @GetMapping
    public Result<PageResult<TourOrder>> list(@RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size,
                                              @RequestParam(required = false) String orderNo,
                                              @RequestParam(required = false) Long routeId,
                                              @RequestParam(required = false) String customerName,
                                              @RequestParam(required = false) String customerPhone,
                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                              @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                                              @RequestParam(required = false) String orderStatus,
                                              @RequestParam(required = false) String refundStatus) {
        return Result.success(tourOrderService.list(page, size, orderNo, routeId, customerName,
                customerPhone, startDate, endDate, orderStatus, refundStatus));
    }

    @GetMapping("/{id}")
    public Result<TourOrder> getById(@PathVariable Long id) {
        return Result.success(tourOrderService.getById(id));
    }

    @GetMapping("/no/{orderNo}")
    public Result<TourOrder> getByOrderNo(@PathVariable String orderNo) {
        return Result.success(tourOrderService.getByOrderNo(orderNo));
    }

    @PostMapping
    public Result<TourOrder> create(@RequestBody TourOrder order,
                                    @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        order.setCreatedBy(operator);
        return Result.success(tourOrderService.create(order));
    }

    @PutMapping
    public Result<TourOrder> update(@RequestBody TourOrder order,
                                    @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        order.setUpdatedBy(operator);
        return Result.success(tourOrderService.update(order));
    }

    @PutMapping("/{id}/status")
    public Result<TourOrder> updateStatus(@PathVariable Long id,
                                          @RequestParam String status,
                                          @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        return Result.success(tourOrderService.updateStatus(id, status, operator));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        tourOrderService.delete(id);
        return Result.success();
    }
}
