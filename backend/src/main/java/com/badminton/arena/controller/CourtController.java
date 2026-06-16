package com.badminton.arena.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.common.Result;
import com.badminton.arena.entity.Court;
import com.badminton.arena.service.CourtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/court")
public class CourtController {

    @Autowired
    private CourtService courtService;

    @GetMapping("/page")
    public Result<PageResult<Court>> page(@RequestParam(defaultValue = "1") int pageNum,
                                          @RequestParam(defaultValue = "10") int pageSize,
                                          @RequestParam(required = false) Integer status,
                                          @RequestParam(required = false) String keyword) {
        Page<Court> page = courtService.page(pageNum, pageSize, status, keyword);
        PageResult<Court> pageResult = new PageResult<>(
                page.getTotal(),
                page.getPages(),
                page.getCurrent(),
                page.getSize(),
                page.getRecords()
        );
        return Result.success(pageResult);
    }

    @GetMapping("/list")
    public Result<List<Court>> list(@RequestParam(required = false) Integer status) {
        List<Court> list = courtService.listByStatus(status);
        return Result.success(list);
    }

    @GetMapping("/{id}")
    public Result<Court> getById(@PathVariable Long id) {
        Court court = courtService.getById(id);
        return Result.success(court);
    }

    @PostMapping
    public Result<Void> add(@RequestBody Court court) {
        courtService.add(court);
        return Result.success();
    }

    @PutMapping
    public Result<Void> update(@RequestBody Court court) {
        courtService.update(court);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        courtService.delete(id);
        return Result.success();
    }
}
