package com.decoration.crm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.decoration.crm.entity.LeadRemark;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface LeadRemarkMapper extends BaseMapper<LeadRemark> {

    @Select("SELECT lr.*, su.real_name as creator_name " +
            "FROM lead_remark lr " +
            "LEFT JOIN sys_user su ON lr.created_by = su.id " +
            "WHERE lr.lead_id = #{leadId} " +
            "ORDER BY lr.created_at DESC")
    List<LeadRemark> selectByLeadId(@Param("leadId") Long leadId);
}
