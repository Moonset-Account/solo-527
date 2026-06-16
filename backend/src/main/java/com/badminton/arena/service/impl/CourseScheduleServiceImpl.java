package com.badminton.arena.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.context.UserContext;
import com.badminton.arena.entity.Course;
import com.badminton.arena.entity.CourseEnrollment;
import com.badminton.arena.entity.CourseSchedule;
import com.badminton.arena.entity.Waitlist;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.CourseEnrollmentMapper;
import com.badminton.arena.mapper.CourseMapper;
import com.badminton.arena.mapper.CourseScheduleMapper;
import com.badminton.arena.service.CourseScheduleService;
import com.badminton.arena.service.WaitlistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CourseScheduleServiceImpl extends ServiceImpl<CourseScheduleMapper, CourseSchedule> implements CourseScheduleService {

    private static final Logger log = LoggerFactory.getLogger(CourseScheduleServiceImpl.class);

    @Autowired
    private CourseMapper courseMapper;

    @Autowired
    private CourseEnrollmentMapper courseEnrollmentMapper;

    @Autowired
    @Lazy
    private WaitlistService waitlistService;

    @Override
    public PageResult<CourseSchedule> page(Integer pageNum, Integer pageSize, Long courseId, Long coachId) {
        Page<CourseSchedule> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<CourseSchedule> wrapper = new LambdaQueryWrapper<>();
        if (courseId != null) {
            wrapper.eq(CourseSchedule::getCourseId, courseId);
        }
        if (coachId != null) {
            wrapper.eq(CourseSchedule::getCoachId, coachId);
        }
        wrapper.orderByDesc(CourseSchedule::getScheduleDate)
                .orderByAsc(CourseSchedule::getStartTime);
        Page<CourseSchedule> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getPages(), result.getCurrent(), result.getSize(), result.getRecords());
    }

    @Override
    public List<CourseSchedule> listByCoach(Long coachId, LocalDate startDate, LocalDate endDate) {
        LambdaQueryWrapper<CourseSchedule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CourseSchedule::getCoachId, coachId);
        if (startDate != null) {
            wrapper.ge(CourseSchedule::getScheduleDate, startDate);
        }
        if (endDate != null) {
            wrapper.le(CourseSchedule::getScheduleDate, endDate);
        }
        wrapper.orderByAsc(CourseSchedule::getScheduleDate)
                .orderByAsc(CourseSchedule::getStartTime);
        return list(wrapper);
    }

    @Override
    public List<CourseSchedule> listByDate(LocalDate date) {
        LambdaQueryWrapper<CourseSchedule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CourseSchedule::getScheduleDate, date);
        wrapper.orderByAsc(CourseSchedule::getStartTime);
        return list(wrapper);
    }

    @Override
    public CourseSchedule add(CourseSchedule schedule) {
        Course course = courseMapper.selectById(schedule.getCourseId());
        if (course == null) {
            throw new BusinessException("课程不存在");
        }
        if (schedule.getMaxStudents() == null) {
            schedule.setMaxStudents(course.getMaxStudents());
        }
        if (schedule.getCoachId() == null) {
            schedule.setCoachId(course.getCoachId());
        }
        if (schedule.getCourtId() == null) {
            schedule.setCourtId(course.getCourtId());
        }
        if (schedule.getStatus() == null) {
            schedule.setStatus(1);
        }
        if (schedule.getEnrolledCount() == null) {
            schedule.setEnrolledCount(0);
        }
        save(schedule);
        return schedule;
    }

    @Override
    @Transactional
    public void enroll(Long scheduleId) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }

        CourseSchedule schedule = getById(scheduleId);
        if (schedule == null) {
            throw new BusinessException("排班不存在");
        }
        if (schedule.getStatus() == 3) {
            throw new BusinessException("该排班已取消");
        }
        if (schedule.getStatus() == 2) {
            waitlistService.addToWaitlist(scheduleId);
            return;
        }

        LambdaQueryWrapper<CourseEnrollment> enrollWrapper = new LambdaQueryWrapper<>();
        enrollWrapper.eq(CourseEnrollment::getScheduleId, scheduleId)
                .eq(CourseEnrollment::getUserId, userId)
                .eq(CourseEnrollment::getStatus, 1);
        CourseEnrollment existEnroll = courseEnrollmentMapper.selectOne(enrollWrapper);
        if (existEnroll != null) {
            throw new BusinessException("您已报名该课程");
        }

        if (schedule.getEnrolledCount() >= schedule.getMaxStudents()) {
            waitlistService.addToWaitlist(scheduleId);
            return;
        }

        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setScheduleId(scheduleId);
        enrollment.setUserId(userId);
        enrollment.setCourseId(schedule.getCourseId());
        enrollment.setStatus(1);
        enrollment.setEnrollTime(LocalDateTime.now());
        courseEnrollmentMapper.insert(enrollment);

        schedule.setEnrolledCount(schedule.getEnrolledCount() + 1);
        if (schedule.getEnrolledCount() >= schedule.getMaxStudents()) {
            schedule.setStatus(2);
        }
        updateById(schedule);

        updateInventoryReport(schedule);
    }

    @Override
    @Transactional
    public void cancelEnroll(Long scheduleId) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }

        CourseSchedule schedule = getById(scheduleId);
        if (schedule == null) {
            throw new BusinessException("排班不存在");
        }

        LambdaQueryWrapper<CourseEnrollment> enrollWrapper = new LambdaQueryWrapper<>();
        enrollWrapper.eq(CourseEnrollment::getScheduleId, scheduleId)
                .eq(CourseEnrollment::getUserId, userId)
                .eq(CourseEnrollment::getStatus, 1);
        CourseEnrollment enrollment = courseEnrollmentMapper.selectOne(enrollWrapper);
        if (enrollment == null) {
            throw new BusinessException("您未报名该课程");
        }

        enrollment.setStatus(2);
        enrollment.setCancelTime(LocalDateTime.now());
        courseEnrollmentMapper.updateById(enrollment);

        schedule.setEnrolledCount(Math.max(0, schedule.getEnrolledCount() - 1));
        if (schedule.getStatus() == 2 && schedule.getEnrolledCount() < schedule.getMaxStudents()) {
            schedule.setStatus(1);
        }
        updateById(schedule);

        waitlistService.promoteNext(scheduleId);

        updateInventoryReport(schedule);
    }

    private void updateInventoryReport(CourseSchedule schedule) {
        try {
            int usedCapacity = schedule.getEnrolledCount();
            int totalCapacity = schedule.getMaxStudents();
            double occupancyRate = totalCapacity > 0 ? (usedCapacity * 100.0 / totalCapacity) : 0;

            log.info("更新库存占用报表: scheduleId={}, used={}, total={}, rate={}%",
                    schedule.getId(), usedCapacity, totalCapacity, String.format("%.2f", occupancyRate));
        } catch (Exception e) {
            log.error("更新库存占用报表失败", e);
        }
    }
}
