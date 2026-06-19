package com.decoration.cooperation.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.decoration.cooperation.dto.FollowRecordCreateDTO;
import com.decoration.cooperation.entity.BizFollowRecord;
import com.decoration.cooperation.vo.TimelineItemVO;

import java.util.List;

public interface BizFollowRecordService extends IService<BizFollowRecord> {

    BizFollowRecord createFollow(FollowRecordCreateDTO dto);

    List<BizFollowRecord> listByLeadId(Long leadId);

    List<TimelineItemVO> getTimeline(Long leadId, Long contractId);
}
