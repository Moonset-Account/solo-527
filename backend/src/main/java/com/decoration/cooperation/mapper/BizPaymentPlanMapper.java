package com.decoration.cooperation.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.decoration.cooperation.entity.BizPaymentPlan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface BizPaymentPlanMapper extends BaseMapper<BizPaymentPlan> {

    List<Map<String, Object>> selectPaymentProgressReport(@Param("startDate") String startDate,
                                                           @Param("endDate") String endDate,
                                                           @Param("ownerId") Long ownerId);
}
