package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.entity.CourseSchedule;

import java.time.LocalDate;
import java.util.List;

public interface CourseScheduleService extends IService<CourseSchedule> {

    PageResult<CourseSchedule> page(Integer pageNum, Integer pageSize, Long courseId, Long coachId);

    List<CourseSchedule> listByCoach(Long coachId, LocalDate startDate, LocalDate endDate);

    List<CourseSchedule> listByDate(LocalDate date);

    CourseSchedule add(CourseSchedule schedule);

    void enroll(Long scheduleId);

    void cancelEnroll(Long scheduleId);
}
