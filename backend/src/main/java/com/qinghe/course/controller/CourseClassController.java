package com.qinghe.course.controller;

import com.qinghe.course.common.PageResult;
import com.qinghe.course.common.QueryParams;
import com.qinghe.course.common.Result;
import com.qinghe.course.entity.CourseClass;
import com.qinghe.course.service.CourseClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/classes")
@RequiredArgsConstructor
public class CourseClassController {

    private final CourseClassService courseClassService;

    @GetMapping
    public Result<PageResult<CourseClass>> list(QueryParams params) {
        return Result.success(courseClassService.search(params));
    }

    @GetMapping("/{id}")
    public Result<CourseClass> detail(@PathVariable Long id) {
        return Result.success(courseClassService.getById(id));
    }

    @GetMapping("/{id}/completion-rate")
    public Result<BigDecimal> getCompletionRate(@PathVariable Long id) {
        return Result.success(courseClassService.getCompletionRate(id));
    }

    @PostMapping
    public Result<CourseClass> create(@RequestBody CourseClass courseClass) {
        return Result.success(courseClassService.create(courseClass));
    }

    @PutMapping("/{id}")
    public Result<CourseClass> update(@PathVariable Long id, @RequestBody CourseClass courseClass) {
        return Result.success(courseClassService.update(id, courseClass));
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        courseClassService.delete(id);
        return Result.success();
    }
}
