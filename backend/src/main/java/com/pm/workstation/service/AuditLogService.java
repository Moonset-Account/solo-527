package com.pm.workstation.service;

import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.entity.AuditLog;
import com.pm.workstation.enums.AuditAction;

public interface AuditLogService {

    AuditLog logAction(Long userId, AuditAction action, String targetType, Long targetId, String detail);

    PageResultDTO<AuditLog> getAuditLogs(int page, int size, AuditAction action);
}
