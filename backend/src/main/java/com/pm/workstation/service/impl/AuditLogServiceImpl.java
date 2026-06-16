package com.pm.workstation.service.impl;

import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.entity.AuditLog;
import com.pm.workstation.enums.AuditAction;
import com.pm.workstation.repository.AuditLogRepository;
import com.pm.workstation.service.AuditLogService;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    public AuditLog logAction(Long userId, AuditAction action, String targetType, Long targetId, String detail) {
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetail(detail);
        log.setCreatedAt(LocalDateTime.now());
        return auditLogRepository.save(log);
    }

    @Override
    public PageResultDTO<AuditLog> getAuditLogs(int page, int size, AuditAction action) {
        Page<AuditLog> pageResult;
        if (action != null) {
            pageResult = auditLogRepository.findByAction(action, PageRequest.of(page - 1, size));
        } else {
            pageResult = auditLogRepository.findAll(PageRequest.of(page - 1, size));
        }
        return PageResultDTO.of(pageResult.getContent(), pageResult.getTotalElements(), page, size);
    }
}
