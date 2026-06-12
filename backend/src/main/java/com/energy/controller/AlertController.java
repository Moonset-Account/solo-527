package com.energy.controller;

import com.energy.common.Result;
import com.energy.dto.AlertQueryDTO;
import com.energy.dto.AssignAlertDTO;
import com.energy.dto.HandleAlertDTO;
import com.energy.entity.Alert;
import com.energy.entity.AlertHandling;
import com.energy.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @PostMapping("/query")
    public Result<Page<Alert>> query(@RequestBody AlertQueryDTO dto) {
        return Result.success(alertService.queryAlerts(dto));
    }

    @GetMapping("/{id}")
    public Result<Alert> getById(@PathVariable Long id) {
        return Result.success(alertService.getAlertById(id));
    }

    @PostMapping("/assign")
    public Result<Alert> assign(@RequestBody AssignAlertDTO dto) {
        return Result.success(alertService.assignAlert(dto));
    }

    @PostMapping("/handle")
    public Result<AlertHandling> handle(@RequestBody HandleAlertDTO dto) {
        return Result.success(alertService.handleAlert(dto));
    }

    @GetMapping("/{id}/handlings")
    public Result<List<AlertHandling>> getHandlings(@PathVariable Long id) {
        return Result.success(alertService.getHandlingHistory(id));
    }

    @GetMapping("/stats")
    public Result<Map<String, Long>> getStats() {
        return Result.success(alertService.getAlertStats());
    }

    @PostMapping("/abnormal")
    public Result<List<Alert>> getAbnormal(@RequestBody AlertQueryDTO dto) {
        return Result.success(alertService.getAbnormalMeters(dto));
    }
}
