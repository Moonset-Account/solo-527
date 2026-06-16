package com.badminton.arena.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.entity.Course;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.CourseMapper;
import com.badminton.arena.service.CourseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class CourseServiceImpl extends ServiceImpl<CourseMapper, Course> implements CourseService {

    private static final Logger log = LoggerFactory.getLogger(CourseServiceImpl.class);

    @Override
    public PageResult<Course> page(Integer pageNum, Integer pageSize, String name, Long coachId, String courseType) {
        Page<Course> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Course> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(name)) {
            wrapper.like(Course::getName, name);
        }
        if (coachId != null) {
            wrapper.eq(Course::getCoachId, coachId);
        }
        if (StringUtils.hasText(courseType)) {
            wrapper.eq(Course::getCourseType, courseType);
        }
        wrapper.orderByDesc(Course::getCreateTime);
        Page<Course> result = page(page, wrapper);
        return new PageResult<>(result.getTotal(), result.getPages(), result.getCurrent(), result.getSize(), result.getRecords());
    }

    @Override
    public Course add(Course course) {
        LambdaQueryWrapper<Course> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Course::getCourseNo, course.getCourseNo());
        Course exist = getOne(wrapper);
        if (exist != null) {
            throw new BusinessException("课程编号已存在");
        }
        if (course.getStatus() == null) {
            course.setStatus(1);
        }
        if (course.getCurrentStudents() == null) {
            course.setCurrentStudents(0);
        }
        save(course);
        return course;
    }

    @Override
    public Course update(Course course) {
        Course exist = getById(course.getId());
        if (exist == null) {
            throw new BusinessException("课程不存在");
        }
        updateById(course);
        return getById(course.getId());
    }

    @Override
    public void delete(Long id) {
        Course exist = getById(id);
        if (exist == null) {
            throw new BusinessException("课程不存在");
        }
        removeById(id);
    }
}
