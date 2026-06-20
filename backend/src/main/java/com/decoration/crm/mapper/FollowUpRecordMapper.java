package com.decoration.crm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.decoration.crm.entity.FollowUpRecord;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

public interface FollowUpRecordMapper extends BaseMapper<FollowUpRecord> {

    @Select("SELECT fur.*, su.real_name as follower_name " +
            "FROM follow_up_record fur " +
            "LEFT JOIN sys_user su ON fur.follow_by = su.id " +
            "WHERE fur.lead_id = #{leadId} " +
            "ORDER BY fur.follow_time DESC")
    List<FollowUpRecord> selectByLeadId(@Param("leadId") Long leadId);
}
