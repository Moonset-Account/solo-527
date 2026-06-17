package com.approval.workflow.controller;

import com.approval.workflow.dto.ApiResponse;
import com.approval.workflow.dto.OperationLogQueryDTO;
import com.approval.workflow.entity.OperationLog;
import com.approval.workflow.enums.OperationType;
import com.approval.workflow.service.OperationLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/operation-logs")
public class OperationLogController {

    private final OperationLogService operationLogService;

    public OperationLogController(OperationLogService operationLogService) {
        this.operationLogService = operationLogService;
    }

    @GetMapping
    public ApiResponse<Page<OperationLog>> getAllLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OperationLog> logs = operationLogService.getAllLogs(pageable);
        return ApiResponse.success(logs);
    }

    @GetMapping("/requirement/{requirementId}")
    public ApiResponse<Page<OperationLog>> getLogsByRequirement(
            @PathVariable Long requirementId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<OperationLog> logs = operationLogService.getLogsByRequirement(requirementId, pageable);
        return ApiResponse.success(logs);
    }

    @GetMapping("/type/{operationType}")
    public ApiResponse<Page<OperationLog>> getLogsByType(
            @PathVariable OperationType operationType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OperationLog> logs = operationLogService.getLogsByType(operationType, pageable);
        return ApiResponse.success(logs);
    }

    @GetMapping("/operator/{operatorId}")
    public ApiResponse<Page<OperationLog>> getLogsByOperator(
            @PathVariable Long operatorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OperationLog> logs = operationLogService.getLogsByOperator(operatorId, pageable);
        return ApiResponse.success(logs);
    }

    @PostMapping("/search")
    public ApiResponse<Page<OperationLog>> searchLogs(
            @RequestBody OperationLogQueryDTO query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OperationLog> logs = operationLogService.searchLogs(query, pageable);
        return ApiResponse.success(logs);
    }
}
