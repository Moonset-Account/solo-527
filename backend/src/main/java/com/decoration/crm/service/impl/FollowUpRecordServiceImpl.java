package com.decoration.crm.service.impl;

import com.decoration.crm.entity.FollowUpRecord;
import com.decoration.crm.entity.LeadCustomer;
import com.decoration.crm.exception.BusinessException;
import com.decoration.crm.mapper.FollowUpRecordMapper;
import com.decoration.crm.mapper.LeadCustomerMapper;
import com.decoration.crm.security.UserDetailsImpl;
import com.decoration.crm.service.FollowUpRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FollowUpRecordServiceImpl implements FollowUpRecordService {

    @Autowired
    private FollowUpRecordMapper followUpRecordMapper;

    @Autowired
    private LeadCustomerMapper leadCustomerMapper;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }

    @Override
    public List<FollowUpRecord> getByLeadId(Long leadId) {
        return followUpRecordMapper.selectByLeadId(leadId);
    }

    @Override
    @Transactional
    public FollowUpRecord create(FollowUpRecord record) {
        if (record.getFollowTime() == null) {
            record.setFollowTime(LocalDateTime.now());
        }
        record.setFollowBy(getCurrentUserId());
        if (record.getStatus() == null) {
            record.setStatus("COMPLETED");
        }
        followUpRecordMapper.insert(record);

        LeadCustomer lead = leadCustomerMapper.selectById(record.getLeadId());
        if (lead != null) {
            lead.setLastFollowTime(record.getFollowTime());
            lead.setNextFollowTime(record.getNextFollowTime());
            lead.setTotalFollowCount((lead.getTotalFollowCount() == null ? 0 : lead.getTotalFollowCount()) + 1);
            if ("NEW".equals(lead.getStatus())) {
                lead.setStatus("CONTACTED");
            }
            leadCustomerMapper.updateById(lead);
        }

        return record;
    }

    @Override
    public FollowUpRecord update(Long id, FollowUpRecord record) {
        FollowUpRecord existing = followUpRecordMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException("跟进记录不存在");
        }
        record.setId(id);
        followUpRecordMapper.updateById(record);
        return followUpRecordMapper.selectById(id);
    }

    @Override
    public void delete(Long id) {
        followUpRecordMapper.deleteById(id);
    }
}
