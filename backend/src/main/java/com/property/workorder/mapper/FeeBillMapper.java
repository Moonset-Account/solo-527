package com.property.workorder.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.property.workorder.entity.FeeBill;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface FeeBillMapper extends BaseMapper<FeeBill> {
    List<Map<String, Object>> selectPaymentProgress(@Param("params") Map<String, Object> params);
}
