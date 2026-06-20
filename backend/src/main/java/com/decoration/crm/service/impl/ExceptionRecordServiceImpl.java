package com.decoration.crm.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.entity.ExceptionRecord;
import com.decoration.crm.exception.BusinessException;
import com.decoration.crm.mapper.ExceptionRecordMapper;
import com.decoration.crm.security.UserDetailsImpl;
import com.decoration.crm.service.ExceptionRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class ExceptionRecordServiceImpl implements ExceptionRecordService {

    @Autowired
    private ExceptionRecordMapper exceptionRecordMapper;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return null;
    }

    @Override
    public IPage<ExceptionRecord> getPage(PageQuery query) {
        Page<ExceptionRecord> page = new Page<>(query.getPageNum(), query.getPageSize());
        return exceptionRecordMapper.selectPageWithNames(page, query);
    }

    @Override
    public ExceptionRecord getById(Long id) {
        return exceptionRecordMapper.selectById(id);
    }

    @Override
    public ExceptionRecord create(ExceptionRecord record) {
        if (record.getStatus() == null) {
            record.setStatus("PENDING");
        }
        if (record.getPriority() == null) {
            record.setPriority("MEDIUM");
        }
        if (record.getHandlerId() == null) {
            record.setHandlerId(getCurrentUserId());
        }
        exceptionRecordMapper.insert(record);
        return record;
    }

    @Override
    public ExceptionRecord update(Long id, ExceptionRecord record) {
        ExceptionRecord existing = exceptionRecordMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException("异常记录不存在");
        }
        record.setId(id);
        exceptionRecordMapper.updateById(record);
        return exceptionRecordMapper.selectById(id);
    }

    @Override
    public void delete(Long id) {
        exceptionRecordMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void resolve(Long id, String overdueReason, Integer handlingCostMinutes) {
        ExceptionRecord record = exceptionRecordMapper.selectById(id);
        if (record == null) {
            throw new BusinessException("异常记录不存在");
        }
        record.setOverdueReason(overdueReason);
        record.setHandlingCostMinutes(handlingCostMinutes);
        record.setStatus("RESOLVED");
        record.setResolvedAt(LocalDateTime.now());
        record.setHandlerId(getCurrentUserId());
        exceptionRecordMapper.updateById(record);
    }
}
