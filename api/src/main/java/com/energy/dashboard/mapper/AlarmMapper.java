package com.energy.dashboard.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.energy.dashboard.entity.Alarm;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AlarmMapper extends BaseMapper<Alarm> {
}
