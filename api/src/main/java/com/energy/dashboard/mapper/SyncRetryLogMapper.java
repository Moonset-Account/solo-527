package com.energy.dashboard.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.energy.dashboard.entity.SyncRetryLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SyncRetryLogMapper extends BaseMapper<SyncRetryLog> {
}
