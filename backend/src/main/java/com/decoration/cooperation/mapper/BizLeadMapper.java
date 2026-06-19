package com.decoration.cooperation.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.decoration.cooperation.entity.BizLead;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface BizLeadMapper extends BaseMapper<BizLead> {

    List<BizLead> selectConflictLeads(@Param("phone") String phone, @Param("customerName") String customerName,
                                       @Param("community") String community, @Param("excludeId") Long excludeId);

    List<Map<String, Object>> selectDealPrediction(@Param("startDate") String startDate, @Param("endDate") String endDate);

    List<Map<String, Object>> selectLeadStatistics();
}
