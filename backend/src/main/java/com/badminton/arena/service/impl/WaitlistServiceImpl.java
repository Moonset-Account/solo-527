package com.badminton.arena.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.context.UserContext;
import com.badminton.arena.entity.CourseEnrollment;
import com.badminton.arena.entity.CourseSchedule;
import com.badminton.arena.entity.Waitlist;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.CourseEnrollmentMapper;
import com.badminton.arena.mapper.CourseScheduleMapper;
import com.badminton.arena.mapper.WaitlistMapper;
import com.badminton.arena.service.WaitlistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class WaitlistServiceImpl extends ServiceImpl<WaitlistMapper, Waitlist> implements WaitlistService {

    private static final Logger log = LoggerFactory.getLogger(WaitlistServiceImpl.class);

    @Autowired
    private CourseScheduleMapper courseScheduleMapper;

    @Autowired
    private CourseEnrollmentMapper courseEnrollmentMapper;

    @Override
    public List<Waitlist> listBySchedule(Long scheduleId) {
        LambdaQueryWrapper<Waitlist> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Waitlist::getScheduleId, scheduleId)
                .eq(Waitlist::getStatus, 0)
                .orderByAsc(Waitlist::getWaitOrder);
        return list(wrapper);
    }

    @Override
    @Transactional
    public Waitlist addToWaitlist(Long scheduleId) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }

        CourseSchedule schedule = courseScheduleMapper.selectById(scheduleId);
        if (schedule == null) {
            throw new BusinessException("排班不存在");
        }

        LambdaQueryWrapper<Waitlist> existWrapper = new LambdaQueryWrapper<>();
        existWrapper.eq(Waitlist::getScheduleId, scheduleId)
                .eq(Waitlist::getUserId, userId)
                .eq(Waitlist::getStatus, 0);
        Waitlist existWaitlist = getOne(existWrapper);
        if (existWaitlist != null) {
            throw new BusinessException("您已在候补名单中");
        }

        LambdaQueryWrapper<Waitlist> countWrapper = new LambdaQueryWrapper<>();
        countWrapper.eq(Waitlist::getScheduleId, scheduleId)
                .eq(Waitlist::getStatus, 0);
        Long waitCount = count(countWrapper);

        Waitlist waitlist = new Waitlist();
        waitlist.setScheduleId(scheduleId);
        waitlist.setCourseId(schedule.getCourseId());
        waitlist.setUserId(userId);
        waitlist.setWaitOrder(waitCount.intValue() + 1);
        waitlist.setStatus(0);
        save(waitlist);

        log.info("用户{}加入排班{}的候补名单，候补顺序：{}", userId, scheduleId, waitlist.getWaitOrder());
        return waitlist;
    }

    @Override
    @Transactional
    public void removeFromWaitlist(Long scheduleId) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            throw new BusinessException("用户未登录");
        }

        LambdaQueryWrapper<Waitlist> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Waitlist::getScheduleId, scheduleId)
                .eq(Waitlist::getUserId, userId)
                .eq(Waitlist::getStatus, 0);
        Waitlist waitlist = getOne(wrapper);
        if (waitlist == null) {
            throw new BusinessException("您不在候补名单中");
        }

        waitlist.setStatus(2);
        updateById(waitlist);

        reorderWaitlist(scheduleId);
    }

    @Override
    @Transactional
    public void promoteNext(Long scheduleId) {
        CourseSchedule schedule = courseScheduleMapper.selectById(scheduleId);
        if (schedule == null) {
            return;
        }

        if (schedule.getEnrolledCount() >= schedule.getMaxStudents()) {
            return;
        }

        LambdaQueryWrapper<Waitlist> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Waitlist::getScheduleId, scheduleId)
                .eq(Waitlist::getStatus, 0)
                .orderByAsc(Waitlist::getWaitOrder)
                .last("LIMIT 1");
        Waitlist firstWaitlist = getOne(wrapper);
        if (firstWaitlist == null) {
            return;
        }

        firstWaitlist.setStatus(1);
        updateById(firstWaitlist);

        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setScheduleId(scheduleId);
        enrollment.setUserId(firstWaitlist.getUserId());
        enrollment.setCourseId(firstWaitlist.getCourseId());
        enrollment.setStatus(1);
        enrollment.setEnrollTime(LocalDateTime.now());
        courseEnrollmentMapper.insert(enrollment);

        schedule.setEnrolledCount(schedule.getEnrolledCount() + 1);
        if (schedule.getEnrolledCount() >= schedule.getMaxStudents()) {
            schedule.setStatus(2);
        }
        courseScheduleMapper.updateById(schedule);

        reorderWaitlist(scheduleId);

        log.info("候补用户{}已转正到排班{}", firstWaitlist.getUserId(), scheduleId);
    }

    private void reorderWaitlist(Long scheduleId) {
        LambdaQueryWrapper<Waitlist> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Waitlist::getScheduleId, scheduleId)
                .eq(Waitlist::getStatus, 0)
                .orderByAsc(Waitlist::getCreateTime);
        List<Waitlist> waitlists = list(wrapper);

        for (int i = 0; i < waitlists.size(); i++) {
            Waitlist w = waitlists.get(i);
            LambdaUpdateWrapper<Waitlist> updateWrapper = new LambdaUpdateWrapper<>();
            updateWrapper.eq(Waitlist::getId, w.getId())
                    .set(Waitlist::getWaitOrder, i + 1);
            update(updateWrapper);
        }
    }
}
