package com.badminton.arena.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.common.Result;
import com.badminton.arena.entity.Inspection;
import com.badminton.arena.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inspection")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService;

    @GetMapping("/page")
    public Result<PageResult<Inspection>> page(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long equipmentId,
            @RequestParam(required = false) Long inspectorId,
            @RequestParam(required = false) Integer status) {
        Page<Inspection> page = inspectionService.page(pageNum, pageSize, equipmentId, inspectorId, status);
        PageResult<Inspection> pageResult = new PageResult<>(
                page.getTotal(),
                page.getPages(),
                page.getCurrent(),
                page.getSize(),
                page.getRecords()
        );
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<Inspection> getById(@PathVariable Long id) {
        Inspection inspection = inspectionService.getById(id);
        return Result.success(inspection);
    }

    @PostMapping
    public Result<Inspection> create(@RequestBody Inspection inspection) {
        Inspection result = inspectionService.createInspection(inspection);
        return Result.success(result);
    }

    @PutMapping("/{id}/assign")
    public Result<Inspection> assign(@PathVariable Long id, @RequestParam Long inspectorId) {
        Inspection result = inspectionService.assignInspector(id, inspectorId);
        return Result.success(result);
    }

    @PutMapping("/{id}/submit")
    public Result<Inspection> submit(@PathVariable Long id, @RequestBody Inspection inspection) {
        Inspection result = inspectionService.submitResult(id, inspection);
        return Result.success(result);
    }
}
