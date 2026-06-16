package com.badminton.arena.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.entity.Course;

public interface CourseService extends IService<Course> {

    PageResult<Course> page(Integer pageNum, Integer pageSize, String name, Long coachId, String courseType);

    Course add(Course course);

    Course update(Course course);

    void delete(Long id);
}
