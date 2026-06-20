package com.property.workorder.controller;

import com.property.workorder.common.PageResult;
import com.property.workorder.common.Result;
import com.property.workorder.entity.WorkOrder;
import com.property.workorder.entity.WorkOrderReview;
import com.property.workorder.entity.WorkOrderVisit;
import com.property.workorder.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/work-orders")
@RequiredArgsConstructor
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    @GetMapping
    public Result<PageResult<WorkOrder>> getWorkOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String buildingNo,
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(workOrderService.getWorkOrders(status, priority, category, buildingNo, assignedTo, current, size));
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> getWorkOrderStats() {
        return Result.success(workOrderService.getWorkOrderStats());
    }

    @GetMapping("/resident/{residentId}")
    public Result<PageResult<WorkOrder>> getResidentWorkOrders(
            @PathVariable Long residentId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(workOrderService.getResidentWorkOrders(residentId, status, current, size));
    }

    @GetMapping("/{id}")
    public Result<WorkOrder> getWorkOrderDetail(@PathVariable Long id) {
        return Result.success(workOrderService.getWorkOrderDetail(id));
    }

    @PostMapping
    public Result<WorkOrder> createWorkOrder(@RequestBody WorkOrder order) {
        return Result.success(workOrderService.createWorkOrder(order));
    }

    @PutMapping("/{id}/assign")
    public Result<WorkOrder> assignWorkOrder(
            @PathVariable Long id,
            @RequestParam Long staffId,
            @RequestParam(required = false) Long operatorId) {
        return Result.success(workOrderService.assignWorkOrder(id, staffId, operatorId));
    }

    @PutMapping("/{id}/start")
    public Result<WorkOrder> startWork(@PathVariable Long id) {
        return Result.success(workOrderService.startWork(id));
    }

    @PutMapping("/{id}/complete")
    public Result<WorkOrder> completeWork(@PathVariable Long id) {
        return Result.success(workOrderService.completeWork(id));
    }

    @PostMapping("/visit")
    public Result<WorkOrderVisit> createVisitRecord(@RequestBody WorkOrderVisit visit) {
        return Result.success(workOrderService.createVisitRecord(visit));
    }

    @GetMapping("/{orderId}/visit")
    public Result<WorkOrderVisit> getVisitRecord(@PathVariable Long orderId) {
        return Result.success(workOrderService.getVisitByOrderId(orderId));
    }

    @PostMapping("/review")
    public Result<WorkOrderReview> createReview(@RequestBody WorkOrderReview review) {
        return Result.success(workOrderService.createReview(review));
    }

    @GetMapping("/{orderId}/review")
    public Result<WorkOrderReview> getReview(@PathVariable Long orderId) {
        return Result.success(workOrderService.getReviewByOrderId(orderId));
    }
}
