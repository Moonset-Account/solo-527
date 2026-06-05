package com.property.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.property.common.Result;
import com.property.entity.WorkOrder;
import com.property.entity.WorkOrderHistory;
import com.property.service.WorkOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
public class WorkOrderController {

    @Autowired
    private WorkOrderService workOrderService;

    @PostMapping
    public Result<WorkOrder> createOrder(@RequestBody WorkOrder order) {
        return workOrderService.createWorkOrder(order);
    }

    @PostMapping("/{id}/approve")
    public Result<WorkOrder> approveOrder(@PathVariable Long id,
                                          @RequestParam boolean approved,
                                          @RequestParam(required = false) String rejectReason,
                                          @RequestParam(required = false) Long assigneeId) {
        return workOrderService.approveOrder(id, approved, rejectReason, assigneeId);
    }

    @PostMapping("/{id}/start")
    public Result<WorkOrder> startProcess(@PathVariable Long id) {
        return workOrderService.startProcess(id);
    }

    @PostMapping("/{id}/complete")
    public Result<WorkOrder> completeOrder(@PathVariable Long id,
                                           @RequestParam(required = false) String handlerRemark,
                                           @RequestParam(required = false) BigDecimal actualCost) {
        return workOrderService.completeOrder(id, handlerRemark, actualCost);
    }

    @PostMapping("/{id}/close")
    public Result<WorkOrder> closeOrder(@PathVariable Long id) {
        return workOrderService.closeOrder(id);
    }

    @GetMapping
    public Result<IPage<WorkOrder>> getOrderPage(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String keyword) {
        return Result.success(workOrderService.getOrderPage(page, size, status, priority, keyword));
    }

    @GetMapping("/{id}")
    public Result<WorkOrder> getOrderDetail(@PathVariable Long id) {
        return workOrderService.getOrderDetail(id);
    }

    @GetMapping("/{id}/history")
    public Result<List<WorkOrderHistory>> getOrderHistory(@PathVariable Long id) {
        return Result.success(workOrderService.getOrderHistory(id));
    }

    @GetMapping("/dashboard/stats")
    public Result<Map<String, Object>> getDashboardStats() {
        return workOrderService.getDashboardStats();
    }
}
