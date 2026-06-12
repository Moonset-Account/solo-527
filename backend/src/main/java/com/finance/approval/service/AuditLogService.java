package com.finance.approval.service;

import com.finance.approval.entity.AuditLog;
import com.finance.approval.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogList(String module, Long userId, LocalDateTime startTime, LocalDateTime endTime, Pageable pageable) {
        return auditLogRepository.findByConditions(module, userId, startTime, endTime, pageable);
    }

    @Transactional
    public AuditLog saveAuditLog(AuditLog log) {
        return auditLogRepository.save(log);
    }

    @Async
    @Transactional
    public void saveAuditLogAsync(AuditLog log) {
        try {
            auditLogRepository.save(log);
        } catch (Exception e) {
            log.error("异步保存审计日志失败", e);
        }
    }
}
