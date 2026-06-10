package com.courselearning.controller;

import com.courselearning.common.PageResult;
import com.courselearning.common.Result;
import com.courselearning.entity.Course;
import com.courselearning.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/course")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @GetMapping("/list")
    public Result<PageResult<Course>> list(
            @RequestParam(defaultValue = "1") Long pageNum,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        PageResult<Course> result = courseService.getCourseList(pageNum, pageSize, category, keyword, status);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> getDetail(@PathVariable Long id) {
        Map<String, Object> result = courseService.getCourseDetail(id);
        return Result.success(result);
    }

    @GetMapping("/home")
    public Result<Map<String, Object>> home() {
        Map<String, Object> result = courseService.getHomeData();
        return Result.success(result);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public Result<Void> create(@RequestBody Course course) {
        courseService.createCourse(course);
        return Result.success("创建成功", null);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public Result<Void> update(@PathVariable Long id, @RequestBody Course course) {
        courseService.updateCourse(id, course);
        return Result.success("更新成功", null);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        courseService.updateCourseStatus(id, status);
        return Result.success(status == 1 ? "上架成功" : "下架成功", null);
    }
}
