package com.energy.dashboard.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.energy.dashboard.entity.Meter;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MeterMapper extends BaseMapper<Meter> {
}
