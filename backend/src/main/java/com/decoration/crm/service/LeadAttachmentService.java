package com.decoration.crm.service;

import com.decoration.crm.entity.LeadAttachment;
import java.util.List;

public interface LeadAttachmentService {
    List<LeadAttachment> getByLeadId(Long leadId);
    LeadAttachment create(LeadAttachment attachment);
    void delete(Long id);
}
