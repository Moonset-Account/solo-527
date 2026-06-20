package com.decoration.crm.service;

import com.decoration.crm.entity.LeadRemark;
import java.util.List;

public interface LeadRemarkService {
    List<LeadRemark> getByLeadId(Long leadId);
    LeadRemark create(Long leadId, String content);
    LeadRemark update(Long id, String content);
    void delete(Long id);
}
