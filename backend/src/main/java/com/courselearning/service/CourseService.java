package com.courselearning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.courselearning.common.PageResult;
import com.courselearning.common.ResultCode;
import com.courselearning.entity.Chapter;
import com.courselearning.entity.Course;
import com.courselearning.entity.UserOrder;
import com.courselearning.mapper.ChapterMapper;
import com.courselearning.mapper.CourseMapper;
import com.courselearning.mapper.UserOrderMapper;
import com.courselearning.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CourseService {

    @Autowired
    private CourseMapper courseMapper;

    @Autowired
    private ChapterMapper chapterMapper;

    @Autowired
    private UserOrderMapper userOrderMapper;

    @Autowired
    private StudyService studyService;

    public PageResult<Course> getCourseList(Long pageNum, Long pageSize, String category, String keyword, Integer status) {
        Page<Course> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Course> wrapper = new LambdaQueryWrapper<>();
        if (category != null && !category.isEmpty()) {
            wrapper.eq(Course::getCategory, category);
        }
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(Course::getTitle, keyword);
        }
        if (status != null) {
            wrapper.eq(Course::getStatus, status);
        } else {
            wrapper.eq(Course::getStatus, 1);
        }
        wrapper.orderByAsc(Course::getSort).orderByDesc(Course::getCreatedAt);
        Page<Course> result = courseMapper.selectPage(page, wrapper);
        return PageResult.of(result.getTotal(), result.getRecords(), pageNum, pageSize);
    }

    public Map<String, Object> getCourseDetail(Long id) {
        Course course = courseMapper.selectById(id);
        if (course == null) {
            throw new RuntimeException(ResultCode.COURSE_NOT_EXIST.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("course", course);

        LambdaQueryWrapper<Chapter> chapterWrapper = new LambdaQueryWrapper<>();
        chapterWrapper.eq(Chapter::getCourseId, id)
                .orderByAsc(Chapter::getChapterOrder);
        List<Chapter> chapters = chapterMapper.selectList(chapterWrapper);
        result.put("chapters", chapters);

        Long userId = SecurityUtils.getCurrentUserId();
        if (userId != null) {
            LambdaQueryWrapper<UserOrder> orderWrapper = new LambdaQueryWrapper<>();
            orderWrapper.eq(UserOrder::getUserId, userId)
                    .eq(UserOrder::getCourseId, id)
                    .eq(UserOrder::getPayStatus, 1);
            Long count = userOrderMapper.selectCount(orderWrapper);
            result.put("purchased", count > 0);

            result.put("progress", studyService.getCourseProgress(userId, id));
        } else {
            result.put("purchased", false);
            result.put("progress", 0);
        }

        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateCourseStatus(Long id, Integer status) {
        Course course = courseMapper.selectById(id);
        if (course == null) {
            throw new RuntimeException(ResultCode.COURSE_NOT_EXIST.getMessage());
        }
        course.setStatus(status);
        courseMapper.updateById(course);
    }

    public Map<String, Object> getHomeData() {
        Map<String, Object> result = new HashMap<>();

        LambdaQueryWrapper<Course> hotWrapper = new LambdaQueryWrapper<>();
        hotWrapper.eq(Course::getStatus, 1)
                .orderByAsc(Course::getSort)
                .orderByDesc(Course::getCreatedAt)
                .last("LIMIT 6");
        List<Course> hotCourses = courseMapper.selectList(hotWrapper);
        result.put("hotCourses", hotCourses);

        Long userId = SecurityUtils.getCurrentUserId();
        if (userId != null) {
            result.put("continueStudy", studyService.getContinueStudyList(userId));
        } else {
            result.put("continueStudy", new ArrayList<>());
        }

        LambdaQueryWrapper<Course> newWrapper = new LambdaQueryWrapper<>();
        newWrapper.eq(Course::getStatus, 1)
                .orderByDesc(Course::getCreatedAt)
                .last("LIMIT 6");
        List<Course> newCourses = courseMapper.selectList(newWrapper);
        result.put("newCourses", newCourses);

        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public void createCourse(Course course) {
        course.setStatus(1);
        course.setCreatedAt(LocalDateTime.now());
        course.setUpdatedAt(LocalDateTime.now());
        courseMapper.insert(course);
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateCourse(Long id, Course course) {
        Course exist = courseMapper.selectById(id);
        if (exist == null) {
            throw new RuntimeException(ResultCode.COURSE_NOT_EXIST.getMessage());
        }
        course.setId(id);
        course.setUpdatedAt(LocalDateTime.now());
        courseMapper.updateById(course);
    }
}
