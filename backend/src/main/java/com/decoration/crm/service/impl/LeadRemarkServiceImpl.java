package com.decoration.crm.service.impl;

import com.decoration.crm.entity.LeadRemark;
import com.decoration.crm.exception.BusinessException;
import com.decoration.crm.mapper.LeadRemarkMapper;
import com.decoration.crm.security.UserDetailsImpl;
import com.decoration.crm.service.LeadRemarkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LeadRemarkServiceImpl implements LeadRemarkService {

    @Autowired
    private LeadRemarkMapper leadRemarkMapper;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }

    @Override
    public List<LeadRemark> getByLeadId(Long leadId) {
        return leadRemarkMapper.selectByLeadId(leadId);
    }

    @Override
    public LeadRemark create(Long leadId, String content) {
        LeadRemark remark = new LeadRemark();
        remark.setLeadId(leadId);
        remark.setContent(content);
        remark.setCreatedBy(getCurrentUserId());
        leadRemarkMapper.insert(remark);
        return remark;
    }

    @Override
    public LeadRemark update(Long id, String content) {
        LeadRemark remark = leadRemarkMapper.selectById(id);
        if (remark == null) {
            throw new BusinessException("备注不存在");
        }
        remark.setContent(content);
        leadRemarkMapper.updateById(remark);
        return remark;
    }

    @Override
    public void delete(Long id) {
        leadRemarkMapper.deleteById(id);
    }
}
