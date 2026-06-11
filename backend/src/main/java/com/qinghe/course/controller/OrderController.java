package com.qinghe.course.controller;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.common.Result;
import com.qinghe.course.entity.CourseOrder;
import com.qinghe.course.security.SecurityUtils;
import com.qinghe.course.service.OrderService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public Result<PageResult<CourseOrder>> list(QueryParams params) {
        Long userId = SecurityUtils.getCurrentUser().isAdmin() ? null : SecurityUtils.getCurrentUserId();
        return Result.success(orderService.search(params, userId));
    }

    @GetMapping("/{id}")
    public Result<CourseOrder> detail(@PathVariable Long id) {
        return Result.success(orderService.getById(id));
    }

    @PostMapping
    public Result<CourseOrder> create(@RequestBody CreateOrderRequest request) {
        return Result.success(orderService.createOrder(request.getCourseId(), request.getClassId(), request.getCouponId()));
    }

    @PostMapping("/{id}/pay")
    public Result<CourseOrder> pay(@PathVariable Long id) {
        return Result.success(orderService.payOrder(id));
    }

    @PutMapping("/{id}/status")
    public Result<CourseOrder> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        return Result.success(orderService.updateStatus(id, request.getStatus(), request.getRemark()));
    }

    @Data
    public static class CreateOrderRequest {
        private Long courseId;
        private Long classId;
        private Long couponId;
    }

    @Data
    public static class UpdateStatusRequest {
        private String status;
        private String remark;
    }
}
