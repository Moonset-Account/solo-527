package com.badminton.arena.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.common.Result;
import com.badminton.arena.entity.Repair;
import com.badminton.arena.service.RepairService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/repair")
public class RepairController {

    @Autowired
    private RepairService repairService;

    @GetMapping("/page")
    public Result<PageResult<Repair>> page(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long equipmentId,
            @RequestParam(required = false) Long repairerId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer priority) {
        Page<Repair> page = repairService.page(pageNum, pageSize, equipmentId, repairerId, status, priority);
        PageResult<Repair> pageResult = new PageResult<>(
                page.getTotal(),
                page.getPages(),
                page.getCurrent(),
                page.getSize(),
                page.getRecords()
        );
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<Repair> getById(@PathVariable Long id) {
        Repair repair = repairService.getById(id);
        return Result.success(repair);
    }

    @PostMapping
    public Result<Repair> create(@RequestBody Repair repair) {
        Repair result = repairService.createRepair(repair);
        return Result.success(result);
    }

    @PutMapping("/{id}/assign")
    public Result<Repair> assign(@PathVariable Long id, @RequestParam Long repairerId) {
        Repair result = repairService.assignRepairer(id, repairerId);
        return Result.success(result);
    }

    @PutMapping("/{id}/status")
    public Result<Repair> updateStatus(@PathVariable Long id, @RequestParam Integer status, @RequestBody(required = false) Repair repair) {
        Repair result = repairService.updateStatus(id, status, repair);
        return Result.success(result);
    }
}
