package com.badminton.arena.controller;

import com.badminton.arena.common.PageResult;
import com.badminton.arena.common.Result;
import com.badminton.arena.entity.Course;
import com.badminton.arena.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/course")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @GetMapping("/page")
    public Result<PageResult<Course>> page(@RequestParam(defaultValue = "1") Integer pageNum,
                                           @RequestParam(defaultValue = "10") Integer pageSize,
                                           @RequestParam(required = false) String name,
                                           @RequestParam(required = false) Long coachId,
                                           @RequestParam(required = false) String courseType) {
        PageResult<Course> result = courseService.page(pageNum, pageSize, name, coachId, courseType);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    public Result<Course> getById(@PathVariable Long id) {
        Course course = courseService.getById(id);
        return Result.success(course);
    }

    @PostMapping
    public Result<Course> add(@RequestBody Course course) {
        Course result = courseService.add(course);
        return Result.success(result);
    }

    @PutMapping
    public Result<Course> update(@RequestBody Course course) {
        Course result = courseService.update(course);
        return Result.success(result);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        courseService.delete(id);
        return Result.success();
    }
}
