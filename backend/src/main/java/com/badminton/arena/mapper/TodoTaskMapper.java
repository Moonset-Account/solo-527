package com.badminton.arena.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.badminton.arena.entity.TodoTask;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TodoTaskMapper extends BaseMapper<TodoTask> {
}
