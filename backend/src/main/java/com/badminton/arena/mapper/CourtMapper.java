package com.badminton.arena.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.badminton.arena.entity.Court;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CourtMapper extends BaseMapper<Court> {
}
