package com.carcore.admin.controller;

import com.carcore.admin.common.PageResult;
import com.carcore.admin.common.RequireRole;
import com.carcore.admin.common.Result;
import com.carcore.admin.dto.BatchOperationConfirmDTO;
import com.carcore.admin.dto.BatchOperationDTO;
import com.carcore.admin.entity.BatchOperation;
import com.carcore.admin.service.BatchOperationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/batch-operations")
public class BatchOperationController {

    private final BatchOperationService batchOperationService;

    public BatchOperationController(BatchOperationService batchOperationService) {
        this.batchOperationService = batchOperationService;
    }

    @GetMapping("/{id}")
    public Result<BatchOperation> getById(@PathVariable Long id) {
        return Result.success(batchOperationService.getById(id));
    }

    @GetMapping("/no/{batchNo}")
    public Result<BatchOperation> getByNo(@PathVariable String batchNo) {
        return Result.success(batchOperationService.getByBatchNo(batchNo));
    }

    @GetMapping("/page")
    public Result<PageResult<BatchOperation>> page(
            @RequestParam(required = false) String batchNo,
            @RequestParam(required = false) String operationType,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(batchOperationService.page(
                batchNo, operationType, targetType, status, pageNum, pageSize));
    }

    @PostMapping
    @RequireRole({"ADMIN", "MANAGER"})
    public Result<BatchOperation> create(@RequestBody BatchOperationDTO dto) {
        return Result.success(batchOperationService.create(dto));
    }

    @PostMapping("/confirm")
    @RequireRole({"ADMIN", "MANAGER"})
    public Result<BatchOperation> confirm(@RequestBody BatchOperationConfirmDTO dto) {
        return Result.success(batchOperationService.confirm(dto));
    }
}
