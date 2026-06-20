package com.decoration.crm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.decoration.crm.entity.QuotationVersion;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface QuotationVersionMapper extends BaseMapper<QuotationVersion> {

    @Select("SELECT qv.*, su.real_name as creator_name " +
            "FROM quotation_version qv " +
            "LEFT JOIN sys_user su ON qv.created_by = su.id " +
            "WHERE qv.lead_id = #{leadId} " +
            "ORDER BY qv.created_at DESC")
    List<QuotationVersion> selectByLeadId(@Param("leadId") Long leadId);
}
