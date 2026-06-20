package com.decoration.crm.service.impl;

import com.decoration.crm.entity.LeadAttachment;
import com.decoration.crm.mapper.LeadAttachmentMapper;
import com.decoration.crm.security.UserDetailsImpl;
import com.decoration.crm.service.LeadAttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LeadAttachmentServiceImpl implements LeadAttachmentService {

    @Autowired
    private LeadAttachmentMapper leadAttachmentMapper;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }

    @Override
    public List<LeadAttachment> getByLeadId(Long leadId) {
        return leadAttachmentMapper.selectByLeadId(leadId);
    }

    @Override
    public LeadAttachment create(LeadAttachment attachment) {
        attachment.setUploadedBy(getCurrentUserId());
        leadAttachmentMapper.insert(attachment);
        return attachment;
    }

    @Override
    public void delete(Long id) {
        leadAttachmentMapper.deleteById(id);
    }
}
