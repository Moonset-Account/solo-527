package com.badminton.arena.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.common.Result;
import com.badminton.arena.entity.Equipment;
import com.badminton.arena.service.EquipmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/equipment")
public class EquipmentController {

    @Autowired
    private EquipmentService equipmentService;

    @GetMapping("/page")
    public Result<PageResult<Equipment>> page(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer status) {
        Page<Equipment> page = equipmentService.page(pageNum, pageSize, name, category, status);
        PageResult<Equipment> pageResult = new PageResult<>(
                page.getTotal(),
                page.getPages(),
                page.getCurrent(),
                page.getSize(),
                page.getRecords()
        );
        return Result.success(pageResult);
    }

    @GetMapping("/{id}")
    public Result<Equipment> getById(@PathVariable Long id) {
        Equipment equipment = equipmentService.getById(id);
        return Result.success(equipment);
    }

    @PostMapping
    public Result<Equipment> add(@RequestBody Equipment equipment) {
        Equipment result = equipmentService.add(equipment);
        return Result.success(result);
    }

    @PutMapping
    public Result<Equipment> update(@RequestBody Equipment equipment) {
        Equipment result = equipmentService.update(equipment);
        return Result.success(result);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        equipmentService.delete(id);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        equipmentService.updateStatus(id, status);
        return Result.success();
    }
}
