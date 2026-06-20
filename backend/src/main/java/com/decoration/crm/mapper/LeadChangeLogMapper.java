package com.decoration.crm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.decoration.crm.entity.LeadChangeLog;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface LeadChangeLogMapper extends BaseMapper<LeadChangeLog> {

    @Select("SELECT lcl.*, su.real_name as changer_name " +
            "FROM lead_change_log lcl " +
            "LEFT JOIN sys_user su ON lcl.changed_by = su.id " +
            "WHERE lcl.lead_id = #{leadId} " +
            "ORDER BY lcl.changed_at DESC")
    List<LeadChangeLog> selectByLeadId(@Param("leadId") Long leadId);
}
