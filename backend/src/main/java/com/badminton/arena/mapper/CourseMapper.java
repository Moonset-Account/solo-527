package com.badminton.arena.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.badminton.arena.entity.Course;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CourseMapper extends BaseMapper<Course> {
}
