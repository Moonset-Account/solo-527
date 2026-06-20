package com.decoration.crm.service.impl;

import com.decoration.crm.entity.LeadChangeLog;
import com.decoration.crm.mapper.LeadChangeLogMapper;
import com.decoration.crm.service.LeadChangeLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LeadChangeLogServiceImpl implements LeadChangeLogService {

    @Autowired
    private LeadChangeLogMapper leadChangeLogMapper;

    @Override
    public List<LeadChangeLog> getByLeadId(Long leadId) {
        return leadChangeLogMapper.selectByLeadId(leadId);
    }
}
