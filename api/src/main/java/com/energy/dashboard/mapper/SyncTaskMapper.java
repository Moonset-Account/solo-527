package com.energy.dashboard.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.energy.dashboard.entity.SyncTask;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SyncTaskMapper extends BaseMapper<SyncTask> {
}
