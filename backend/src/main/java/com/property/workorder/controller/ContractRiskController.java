package com.property.workorder.controller;

import com.property.workorder.common.PageResult;
import com.property.workorder.common.Result;
import com.property.workorder.entity.ContractRisk;
import com.property.workorder.service.ContractRiskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contract-risks")
@RequiredArgsConstructor
public class ContractRiskController {

    private final ContractRiskService riskService;

    @GetMapping("/query")
    public Result<PageResult<ContractRisk>> queryRisks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String riskType,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long personInCharge,
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(riskService.queryRisks(title, riskType, level, status, personInCharge, current, size));
    }

    @GetMapping("/{id}")
    public Result<ContractRisk> getRiskDetail(@PathVariable Long id) {
        return Result.success(riskService.getRiskDetail(id));
    }

    @PostMapping
    public Result<ContractRisk> createRisk(@RequestBody ContractRisk risk) {
        return Result.success(riskService.createRisk(risk));
    }

    @PutMapping("/{id}/status")
    public Result<ContractRisk> updateRiskStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String mitigationMeasures) {
        return Result.success(riskService.updateRiskStatus(id, status, mitigationMeasures));
    }
}
