package com.decoration.crm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.decoration.crm.entity.LeadAttachment;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface LeadAttachmentMapper extends BaseMapper<LeadAttachment> {

    @Select("SELECT la.*, su.real_name as uploader_name " +
            "FROM lead_attachment la " +
            "LEFT JOIN sys_user su ON la.uploaded_by = su.id " +
            "WHERE la.lead_id = #{leadId} " +
            "ORDER BY la.created_at DESC")
    List<LeadAttachment> selectByLeadId(@Param("leadId") Long leadId);
}
