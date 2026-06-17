package com.sales.email.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sales.email.entity.OperationLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface OperationLogMapper extends BaseMapper<OperationLog> {
}
