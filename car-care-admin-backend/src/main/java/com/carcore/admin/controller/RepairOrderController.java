package com.carcore.admin.controller;

import com.carcore.admin.common.PageResult;
import com.carcore.admin.common.RequireRole;
import com.carcore.admin.common.Result;
import com.carcore.admin.dto.RepairOrderCloseDTO;
import com.carcore.admin.dto.RepairOrderDelayDTO;
import com.carcore.admin.dto.RepairOrderStatusDTO;
import com.carcore.admin.entity.RepairItem;
import com.carcore.admin.entity.RepairOrder;
import com.carcore.admin.entity.RepairStatusHistory;
import com.carcore.admin.service.RepairOrderService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/repair-orders")
public class RepairOrderController {

    private final RepairOrderService repairOrderService;

    public RepairOrderController(RepairOrderService repairOrderService) {
        this.repairOrderService = repairOrderService;
    }

    @GetMapping("/{id}")
    public Result<RepairOrder> getById(@PathVariable Long id) {
        return Result.success(repairOrderService.getById(id));
    }

    @GetMapping("/no/{orderNo}")
    public Result<RepairOrder> getByNo(@PathVariable String orderNo) {
        return Result.success(repairOrderService.getByOrderNo(orderNo));
    }

    @GetMapping("/{id}/status-history")
    public Result<List<RepairStatusHistory>> getStatusHistory(@PathVariable Long id) {
        return Result.success(repairOrderService.getStatusHistories(id));
    }

    @GetMapping("/{id}/items")
    public Result<List<RepairItem>> getItems(@PathVariable Long id) {
        return Result.success(repairOrderService.getRepairItems(id));
    }

    @GetMapping("/page")
    public Result<PageResult<RepairOrder>> page(
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) Long technicianId,
            @RequestParam(required = false) Long workstationId,
            @RequestParam(required = false) String orderType,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String qualityStatus,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime endTime,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(repairOrderService.page(
                orderNo, memberId, technicianId, workstationId, orderType,
                status, qualityStatus, startTime, endTime, pageNum, pageSize));
    }

    @PostMapping
    @RequireRole({"ADMIN", "MANAGER", "TECHNICIAN"})
    public Result<RepairOrder> create(@RequestBody RepairOrderWithItems request) {
        return Result.success(repairOrderService.create(
                request.getOrder(), request.getItems()));
    }

    @PutMapping
    @RequireRole({"ADMIN", "MANAGER", "TECHNICIAN"})
    public Result<RepairOrder> update(@RequestBody RepairOrderWithItems request) {
        return Result.success(repairOrderService.update(
                request.getOrder(), request.getItems()));
    }

    @PutMapping("/status")
    @RequireRole({"ADMIN", "MANAGER", "TECHNICIAN"})
    public Result<RepairOrder> updateStatus(@RequestBody RepairOrderStatusDTO dto) {
        return Result.success(repairOrderService.updateStatus(dto));
    }

    @PostMapping("/batch-status")
    @RequireRole({"ADMIN", "MANAGER"})
    public Result<Void> batchUpdateStatus(@RequestBody BatchStatusUpdate request) {
        repairOrderService.batchUpdateStatus(
                request.getIds(), request.getNewStatus(),
                request.getOperatorId(), request.getRemark());
        return Result.success();
    }

    @PostMapping("/handle-delay")
    @RequireRole({"ADMIN", "MANAGER"})
    public Result<RepairOrder> handleDelay(@RequestBody RepairOrderDelayDTO dto) {
        return Result.success(repairOrderService.handleDelay(dto));
    }

    @PostMapping("/close")
    @RequireRole({"ADMIN", "MANAGER"})
    public Result<RepairOrder> closeOrder(@RequestBody RepairOrderCloseDTO dto) {
        return Result.success(repairOrderService.closeOrder(dto));
    }

    public static class RepairOrderWithItems {
        private RepairOrder order;
        private List<RepairItem> items;

        public RepairOrder getOrder() {
            return order;
        }

        public void setOrder(RepairOrder order) {
            this.order = order;
        }

        public List<RepairItem> getItems() {
            return items;
        }

        public void setItems(List<RepairItem> items) {
            this.items = items;
        }
    }

    public static class BatchStatusUpdate {
        private List<Long> ids;
        private Integer newStatus;
        private Long operatorId;
        private String remark;

        public List<Long> getIds() {
            return ids;
        }

        public void setIds(List<Long> ids) {
            this.ids = ids;
        }

        public Integer getNewStatus() {
            return newStatus;
        }

        public void setNewStatus(Integer newStatus) {
            this.newStatus = newStatus;
        }

        public Long getOperatorId() {
            return operatorId;
        }

        public void setOperatorId(Long operatorId) {
            this.operatorId = operatorId;
        }

        public String getRemark() {
            return remark;
        }

        public void setRemark(String remark) {
            this.remark = remark;
        }
    }
}
