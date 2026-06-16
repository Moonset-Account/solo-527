package com.badminton.arena.controller;

import com.badminton.arena.common.PageResult;
import com.badminton.arena.common.Result;
import com.badminton.arena.entity.Coach;
import com.badminton.arena.service.CoachService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/coach")
public class CoachController {

    @Autowired
    private CoachService coachService;

    @GetMapping("/page")
    public Result<PageResult<Coach>> page(@RequestParam(defaultValue = "1") Integer pageNum,
                                          @RequestParam(defaultValue = "10") Integer pageSize,
                                          @RequestParam(required = false) String name,
                                          @RequestParam(required = false) String level) {
        PageResult<Coach> result = coachService.page(pageNum, pageSize, name, level);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    public Result<Coach> getById(@PathVariable Long id) {
        Coach coach = coachService.getById(id);
        return Result.success(coach);
    }

    @PostMapping
    public Result<Coach> add(@RequestBody Coach coach) {
        Coach result = coachService.add(coach);
        return Result.success(result);
    }

    @PutMapping
    public Result<Coach> update(@RequestBody Coach coach) {
        Coach result = coachService.update(coach);
        return Result.success(result);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        coachService.delete(id);
        return Result.success();
    }
}
