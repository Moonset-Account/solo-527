package com.carcore.admin.controller;

import com.carcore.admin.common.Result;
import com.carcore.admin.dto.TraceQueryDTO;
import com.carcore.admin.service.TraceService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/trace")
public class TraceController {

    private final TraceService traceService;

    public TraceController(TraceService traceService) {
        this.traceService = traceService;
    }

    @PostMapping
    public Result<Map<String, Object>> trace(@RequestBody TraceQueryDTO dto) {
        return Result.success(traceService.trace(dto));
    }

    @GetMapping("/package-order/{packageOrderId}")
    public Result<Map<String, Object>> tracePackageOrder(@PathVariable Long packageOrderId) {
        return Result.success(traceService.tracePackageOrder(packageOrderId));
    }

    @GetMapping("/technician-workstation/{repairOrderId}")
    public Result<Map<String, Object>> traceTechnicianAndWorkstation(@PathVariable Long repairOrderId) {
        return Result.success(traceService.traceTechnicianAndWorkstation(repairOrderId));
    }

    @GetMapping("/test-drive/{testDriveId}")
    public Result<Map<String, Object>> traceTestDrive(@PathVariable Long testDriveId) {
        return Result.success(traceService.traceTestDrive(testDriveId));
    }

    @GetMapping("/repair-order-sources/{repairOrderId}")
    public Result<Map<String, Object>> getRepairOrderSources(@PathVariable Long repairOrderId) {
        return Result.success(traceService.getRepairOrderSources(repairOrderId));
    }
}
