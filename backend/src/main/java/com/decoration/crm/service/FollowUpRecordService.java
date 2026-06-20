package com.decoration.crm.service;

import com.decoration.crm.entity.FollowUpRecord;
import java.util.List;

public interface FollowUpRecordService {
    List<FollowUpRecord> getByLeadId(Long leadId);
    FollowUpRecord create(FollowUpRecord record);
    FollowUpRecord update(Long id, FollowUpRecord record);
    void delete(Long id);
}
