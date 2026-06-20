package com.property.workorder.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.property.workorder.entity.WorkOrder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface WorkOrderMapper extends BaseMapper<WorkOrder> {
    List<Map<String, Object>> selectWorkOrderStats(@Param("params") Map<String, Object> params);
}
