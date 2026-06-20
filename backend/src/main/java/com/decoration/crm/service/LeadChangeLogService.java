package com.decoration.crm.service;

import com.decoration.crm.entity.LeadChangeLog;
import java.util.List;

public interface LeadChangeLogService {
    List<LeadChangeLog> getByLeadId(Long leadId);
}
