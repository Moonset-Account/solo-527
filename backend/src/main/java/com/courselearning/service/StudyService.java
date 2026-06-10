package com.courselearning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.courselearning.dto.ProgressUpdateDTO;
import com.courselearning.entity.*;
import com.courselearning.mapper.*;
import com.courselearning.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class StudyService {

    @Autowired
    private StudyProgressMapper studyProgressMapper;

    @Autowired
    private CheckInMapper checkInMapper;

    @Autowired
    private CourseMapper courseMapper;

    @Autowired
    private ChapterMapper chapterMapper;

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private UserOrderMapper userOrderMapper;

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> updateProgress(ProgressUpdateDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();

        LambdaQueryWrapper<StudyProgress> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StudyProgress::getUserId, userId)
                .eq(StudyProgress::getCourseId, dto.getCourseId())
                .eq(StudyProgress::getChapterId, dto.getChapterId());
        StudyProgress progress = studyProgressMapper.selectOne(wrapper);

        if (progress == null) {
            progress = new StudyProgress();
            progress.setUserId(userId);
            progress.setCourseId(dto.getCourseId());
            progress.setChapterId(dto.getChapterId());
            progress.setProgress(dto.getProgress());
            progress.setWatchDuration(dto.getWatchDuration() != null ? dto.getWatchDuration() : 0);
            progress.setIsCompleted(dto.getIsCompleted() != null ? dto.getIsCompleted() : 0);
            if (progress.getIsCompleted() == 1) {
                progress.setCompletedAt(LocalDateTime.now());
            }
            progress.setLastStudyTime(LocalDateTime.now());
            progress.setCreatedAt(LocalDateTime.now());
            progress.setUpdatedAt(LocalDateTime.now());
            studyProgressMapper.insert(progress);
        } else {
            if (dto.getWatchDuration() != null) {
                progress.setWatchDuration(progress.getWatchDuration() + dto.getWatchDuration());
            }
            if (dto.getProgress() > progress.getProgress()) {
                progress.setProgress(dto.getProgress());
            }
            if (dto.getIsCompleted() != null && dto.getIsCompleted() == 1 && progress.getIsCompleted() == 0) {
                progress.setIsCompleted(1);
                progress.setCompletedAt(LocalDateTime.now());
            }
            progress.setLastStudyTime(LocalDateTime.now());
            progress.setUpdatedAt(LocalDateTime.now());
            studyProgressMapper.updateById(progress);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("progress", progress);
        result.put("courseProgress", getCourseProgress(userId, dto.getCourseId()));
        return result;
    }

    public Integer getCourseProgress(Long userId, Long courseId) {
        LambdaQueryWrapper<StudyProgress> progressWrapper = new LambdaQueryWrapper<>();
        progressWrapper.eq(StudyProgress::getUserId, userId)
                .eq(StudyProgress::getCourseId, courseId);
        List<StudyProgress> progresses = studyProgressMapper.selectList(progressWrapper);

        if (progresses.isEmpty()) {
            return 0;
        }

        LambdaQueryWrapper<Chapter> chapterWrapper = new LambdaQueryWrapper<>();
        chapterWrapper.eq(Chapter::getCourseId, courseId);
        Long totalChapters = chapterMapper.selectCount(chapterWrapper);

        if (totalChapters == 0) {
            return 0;
        }

        long completedChapters = progresses.stream()
                .filter(p -> p.getIsCompleted() != null && p.getIsCompleted() == 1)
                .count();

        return (int) (completedChapters * 100 / totalChapters);
    }

    public List<Map<String, Object>> getContinueStudyList(Long userId) {
        LambdaQueryWrapper<StudyProgress> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StudyProgress::getUserId, userId)
                .orderByDesc(StudyProgress::getLastStudyTime)
                .last("LIMIT 10");
        List<StudyProgress> progresses = studyProgressMapper.selectList(wrapper);

        Set<Long> courseIds = new LinkedHashSet<>();
        for (StudyProgress progress : progresses) {
            courseIds.add(progress.getCourseId());
        }

        LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.eq(UserOrder::getUserId, userId)
                .eq(UserOrder::getPayStatus, 1)
                .orderByDesc(UserOrder::getPayTime)
                .last("LIMIT 10");
        List<UserOrder> orders = userOrderMapper.selectList(orderWrapper);
        for (UserOrder order : orders) {
            courseIds.add(order.getCourseId());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Long courseId : courseIds) {
            Course course = courseMapper.selectById(courseId);
            if (course == null || course.getStatus() != 1) {
                continue;
            }

            Map<String, Object> item = new HashMap<>();
            item.put("courseId", course.getId());
            item.put("title", course.getTitle());
            item.put("cover", course.getCover());
            item.put("progress", getCourseProgress(userId, courseId));

            LambdaQueryWrapper<StudyProgress> lastWrapper = new LambdaQueryWrapper<>();
            lastWrapper.eq(StudyProgress::getUserId, userId)
                    .eq(StudyProgress::getCourseId, courseId)
                    .orderByDesc(StudyProgress::getLastStudyTime)
                    .last("LIMIT 1");
            StudyProgress lastProgress = studyProgressMapper.selectOne(lastWrapper);
            if (lastProgress != null) {
                Chapter chapter = chapterMapper.selectById(lastProgress.getChapterId());
                if (chapter != null) {
                    item.put("lastChapterId", chapter.getId());
                    item.put("lastChapterTitle", chapter.getTitle());
                }
                item.put("lastStudyTime", lastProgress.getLastStudyTime());
            }

            result.add(item);
        }

        return result.stream().limit(6).toList();
    }

    public Map<String, Object> getCompletionRate(String dimension, Long courseId, Long userId) {
        Map<String, Object> result = new HashMap<>();

        if ("course".equals(dimension)) {
            if (courseId != null) {
                result.put("dimension", "course");
                result.put("courseId", courseId);

                Course course = courseMapper.selectById(courseId);
                if (course != null) {
                    result.put("courseTitle", course.getTitle());
                    result.put("totalChapters", course.getTotalChapters());
                }

                LambdaQueryWrapper<Chapter> chapterWrapper = new LambdaQueryWrapper<>();
                chapterWrapper.eq(Chapter::getCourseId, courseId);
                List<Chapter> chapters = chapterMapper.selectList(chapterWrapper);

                List<Map<String, Object>> chapterStats = new ArrayList<>();
                for (Chapter chapter : chapters) {
                    LambdaQueryWrapper<StudyProgress> progressWrapper = new LambdaQueryWrapper<>();
                    progressWrapper.eq(StudyProgress::getCourseId, courseId)
                            .eq(StudyProgress::getChapterId, chapter.getId());
                    List<StudyProgress> progresses = studyProgressMapper.selectList(progressWrapper);

                    long totalLearners = progresses.size();
                    long completedLearners = progresses.stream()
                            .filter(p -> p.getIsCompleted() != null && p.getIsCompleted() == 1)
                            .count();

                    double completionRate = totalLearners > 0 ? (double) completedLearners / totalLearners * 100 : 0;

                    Map<String, Object> chapterStat = new HashMap<>();
                    chapterStat.put("chapterId", chapter.getId());
                    chapterStat.put("chapterTitle", chapter.getTitle());
                    chapterStat.put("totalLearners", totalLearners);
                    chapterStat.put("completedLearners", completedLearners);
                    chapterStat.put("completionRate", String.format("%.2f", completionRate) + "%");
                    chapterStats.add(chapterStat);
                }
                result.put("chapterStats", chapterStats);

                LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
                orderWrapper.eq(UserOrder::getCourseId, courseId)
                        .eq(UserOrder::getPayStatus, 1);
                Long totalBuyers = userOrderMapper.selectCount(orderWrapper);

                long courseCompleted = 0;
                Set<Long> userIds = new HashSet<>();
                for (UserOrder order : userOrderMapper.selectList(orderWrapper)) {
                    userIds.add(order.getUserId());
                }
                for (Long uid : userIds) {
                    int progress = getCourseProgress(uid, courseId);
                    if (progress >= 80) {
                        courseCompleted++;
                    }
                }
                double courseCompletionRate = totalBuyers > 0 ? (double) courseCompleted / totalBuyers * 100 : 0;
                result.put("totalBuyers", totalBuyers);
                result.put("courseCompleted", courseCompleted);
                result.put("courseCompletionRate", String.format("%.2f", courseCompletionRate) + "%");

            } else {
                result.put("dimension", "course");
                result.put("scope", "all");

                LambdaQueryWrapper<Course> allCourseWrapper = new LambdaQueryWrapper<>();
                allCourseWrapper.eq(Course::getStatus, 1);
                List<Course> allCourses = courseMapper.selectList(allCourseWrapper);

                List<Map<String, Object>> courseStats = new ArrayList<>();
                long globalTotalChapters = 0;
                long globalCompletedChapters = 0;
                long globalTotalBuyers = 0;
                long globalCourseCompleted = 0;

                for (Course course : allCourses) {
                    Long cid = course.getId();

                    LambdaQueryWrapper<Chapter> chWrapper = new LambdaQueryWrapper<>();
                    chWrapper.eq(Chapter::getCourseId, cid);
                    long chCount = chapterMapper.selectCount(chWrapper);
                    globalTotalChapters += chCount;

                    LambdaQueryWrapper<StudyProgress> progWrapper = new LambdaQueryWrapper<>();
                    progWrapper.eq(StudyProgress::getCourseId, cid)
                            .eq(StudyProgress::getIsCompleted, 1);
                    long cc = studyProgressMapper.selectCount(progWrapper);
                    globalCompletedChapters += cc;

                    LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
                    orderWrapper.eq(UserOrder::getCourseId, cid)
                            .eq(UserOrder::getPayStatus, 1);
                    Long totalBuyers = userOrderMapper.selectCount(orderWrapper);
                    globalTotalBuyers += totalBuyers;

                    Set<Long> buyerIds = new HashSet<>();
                    long courseCompleted = 0;
                    for (UserOrder order : userOrderMapper.selectList(orderWrapper)) {
                        buyerIds.add(order.getUserId());
                    }
                    for (Long uid : buyerIds) {
                        if (getCourseProgress(uid, cid) >= 80) {
                            courseCompleted++;
                        }
                    }
                    globalCourseCompleted += courseCompleted;

                    double avgProgress = chCount > 0 ? (double) cc / chCount * 100 : 0;

                    Map<String, Object> courseStat = new HashMap<>();
                    courseStat.put("courseId", cid);
                    courseStat.put("courseTitle", course.getTitle());
                    courseStat.put("totalChapters", chCount);
                    courseStat.put("completedChapters", cc);
                    courseStat.put("totalBuyers", totalBuyers);
                    courseStat.put("courseCompleted", courseCompleted);
                    courseStat.put("progress", String.format("%.2f", avgProgress));
                    courseStat.put("completionRate", String.format("%.2f", totalBuyers > 0 ? (double) courseCompleted / totalBuyers * 100 : 0) + "%");
                    courseStats.add(courseStat);
                }

                result.put("courseStats", courseStats);
                result.put("totalCourses", allCourses.size());
                result.put("totalChapters", globalTotalChapters);
                result.put("completedChapters", globalCompletedChapters);
                result.put("totalBuyers", globalTotalBuyers);
                result.put("courseCompleted", globalCourseCompleted);
                double overallRate = globalTotalChapters > 0 ? (double) globalCompletedChapters / globalTotalChapters * 100 : 0;
                result.put("overallCompletionRate", String.format("%.2f", overallRate) + "%");
            }

        } else if ("user".equals(dimension)) {
            Long targetUserId = userId != null ? userId : SecurityUtils.getCurrentUserId();
            result.put("dimension", "user");
            result.put("userId", targetUserId);

            SysUser user = sysUserMapper.selectById(targetUserId);
            if (user != null) {
                result.put("nickname", user.getNickname());
            }

            LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
            orderWrapper.eq(UserOrder::getUserId, targetUserId)
                    .eq(UserOrder::getPayStatus, 1);
            List<UserOrder> orders = userOrderMapper.selectList(orderWrapper);

            List<Map<String, Object>> courseStats = new ArrayList<>();
            int totalChapters = 0;
            int completedChapters = 0;
            int completedCourses = 0;

            for (UserOrder order : orders) {
                Course course = courseMapper.selectById(order.getCourseId());
                if (course == null) continue;

                int progress = getCourseProgress(targetUserId, course.getId());

                LambdaQueryWrapper<Chapter> chWrapper = new LambdaQueryWrapper<>();
                chWrapper.eq(Chapter::getCourseId, course.getId());
                int chCount = chapterMapper.selectCount(chWrapper).intValue();
                totalChapters += chCount;

                LambdaQueryWrapper<StudyProgress> progWrapper = new LambdaQueryWrapper<>();
                progWrapper.eq(StudyProgress::getUserId, targetUserId)
                        .eq(StudyProgress::getCourseId, course.getId())
                        .eq(StudyProgress::getIsCompleted, 1);
                int cc = studyProgressMapper.selectCount(progWrapper).intValue();
                completedChapters += cc;

                if (progress >= 80) {
                    completedCourses++;
                }

                Map<String, Object> courseStat = new HashMap<>();
                courseStat.put("courseId", course.getId());
                courseStat.put("courseTitle", course.getTitle());
                courseStat.put("progress", progress);
                courseStat.put("totalChapters", chCount);
                courseStat.put("completedChapters", cc);
                courseStats.add(courseStat);
            }

            result.put("totalCourses", orders.size());
            result.put("completedCourses", completedCourses);
            result.put("totalChapters", totalChapters);
            result.put("completedChapters", completedChapters);
            double overallRate = totalChapters > 0 ? (double) completedChapters / totalChapters * 100 : 0;
            result.put("overallCompletionRate", String.format("%.2f", overallRate) + "%");
            result.put("courseStats", courseStats);
        }

        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> checkIn(LocalDate checkDate, Integer studyDuration, Long courseId, String remark) {
        Long userId = SecurityUtils.getCurrentUserId();
        LocalDate date = checkDate != null ? checkDate : LocalDate.now();

        LambdaQueryWrapper<CheckIn> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CheckIn::getUserId, userId)
                .eq(CheckIn::getCheckDate, date);
        CheckIn exist = checkInMapper.selectOne(wrapper);

        if (exist != null) {
            throw new RuntimeException("今日已打卡");
        }

        CheckIn checkIn = new CheckIn();
        checkIn.setUserId(userId);
        checkIn.setCheckDate(date);
        checkIn.setStudyDuration(studyDuration != null ? studyDuration : 0);
        checkIn.setCourseId(courseId);
        checkIn.setRemark(remark);
        checkIn.setCreatedAt(LocalDateTime.now());
        checkInMapper.insert(checkIn);

        Map<String, Object> result = new HashMap<>();
        result.put("checkIn", checkIn);
        result.put("streak", getCheckInStreak(userId, date));
        result.put("totalDays", getTotalCheckInDays(userId));

        return result;
    }

    public List<CheckIn> getCheckInList(LocalDate startDate, LocalDate endDate) {
        Long userId = SecurityUtils.getCurrentUserId();
        LambdaQueryWrapper<CheckIn> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CheckIn::getUserId, userId);
        if (startDate != null) {
            wrapper.ge(CheckIn::getCheckDate, startDate);
        }
        if (endDate != null) {
            wrapper.le(CheckIn::getCheckDate, endDate);
        }
        wrapper.orderByDesc(CheckIn::getCheckDate);
        return checkInMapper.selectList(wrapper);
    }

    private int getCheckInStreak(Long userId, LocalDate date) {
        int streak = 0;
        LocalDate current = date;
        while (true) {
            LambdaQueryWrapper<CheckIn> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(CheckIn::getUserId, userId)
                    .eq(CheckIn::getCheckDate, current);
            CheckIn checkIn = checkInMapper.selectOne(wrapper);
            if (checkIn != null) {
                streak++;
                current = current.minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }

    private int getTotalCheckInDays(Long userId) {
        LambdaQueryWrapper<CheckIn> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CheckIn::getUserId, userId);
        return checkInMapper.selectCount(wrapper).intValue();
    }
}
