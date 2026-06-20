package com.decoration.crm.service;

import com.decoration.crm.entity.LeadAttachment;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface LeadAttachmentService {
    List<LeadAttachment> getByLeadId(Long leadId);
    LeadAttachment getById(Long id);
    LeadAttachment upload(MultipartFile file, Long leadId, String category);
    void delete(Long id);
}
