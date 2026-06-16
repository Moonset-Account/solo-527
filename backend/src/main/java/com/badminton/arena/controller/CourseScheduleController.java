package com.badminton.arena.controller;

import com.badminton.arena.common.PageResult;
import com.badminton.arena.common.Result;
import com.badminton.arena.entity.CourseSchedule;
import com.badminton.arena.service.CourseScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/course-schedule")
public class CourseScheduleController {

    @Autowired
    private CourseScheduleService courseScheduleService;

    @GetMapping("/page")
    public Result<PageResult<CourseSchedule>> page(@RequestParam(defaultValue = "1") Integer pageNum,
                                                   @RequestParam(defaultValue = "10") Integer pageSize,
                                                   @RequestParam(required = false) Long courseId,
                                                   @RequestParam(required = false) Long coachId) {
        PageResult<CourseSchedule> result = courseScheduleService.page(pageNum, pageSize, courseId, coachId);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    public Result<CourseSchedule> getById(@PathVariable Long id) {
        CourseSchedule schedule = courseScheduleService.getById(id);
        return Result.success(schedule);
    }

    @GetMapping("/coach/{coachId}")
    public Result<List<CourseSchedule>> listByCoach(@PathVariable Long coachId,
                                                    @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
                                                    @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {
        List<CourseSchedule> list = courseScheduleService.listByCoach(coachId, startDate, endDate);
        return Result.success(list);
    }

    @GetMapping("/date/{date}")
    public Result<List<CourseSchedule>> listByDate(@PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        List<CourseSchedule> list = courseScheduleService.listByDate(date);
        return Result.success(list);
    }

    @PostMapping
    public Result<CourseSchedule> add(@RequestBody CourseSchedule schedule) {
        CourseSchedule result = courseScheduleService.add(schedule);
        return Result.success(result);
    }

    @PostMapping("/enroll/{scheduleId}")
    public Result<String> enroll(@PathVariable Long scheduleId) {
        courseScheduleService.enroll(scheduleId);
        return Result.success("报名成功");
    }

    @PostMapping("/cancel/{scheduleId}")
    public Result<String> cancelEnroll(@PathVariable Long scheduleId) {
        courseScheduleService.cancelEnroll(scheduleId);
        return Result.success("取消报名成功");
    }
}
