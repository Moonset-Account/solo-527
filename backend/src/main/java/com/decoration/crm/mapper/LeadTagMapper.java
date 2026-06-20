package com.decoration.crm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.decoration.crm.entity.LeadTag;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface LeadTagMapper extends BaseMapper<LeadTag> {

    @Select("SELECT lt.* FROM lead_tag lt " +
            "INNER JOIN lead_tag_rel ltr ON lt.id = ltr.tag_id " +
            "WHERE ltr.lead_id = #{leadId}")
    List<LeadTag> selectTagsByLeadId(@Param("leadId") Long leadId);
}
