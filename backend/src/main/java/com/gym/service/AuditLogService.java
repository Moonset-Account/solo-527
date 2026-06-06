package com.gym.service;

import com.gym.entity.AuditLog;
import com.gym.repository.AuditLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public void log(String operation, String module, Long targetId, String targetType, Object oldValue, Object newValue) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setLogNo("LOG" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
            auditLog.setOperation(operation);
            auditLog.setModule(module);
            auditLog.setTargetId(targetId);
            auditLog.setTargetType(targetType);
            auditLog.setOldValue(oldValue != null ? toJson(oldValue) : null);
            auditLog.setNewValue(newValue != null ? toJson(newValue) : null);

            HttpServletRequest request = getRequest();
            if (request != null) {
                auditLog.setIpAddress(getClientIp(request));
                auditLog.setUserAgent(request.getHeader("User-Agent"));
            }

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("保存审计日志失败", e);
        }
    }

    public Page<AuditLog> getLogs(String module, LocalDateTime start, LocalDateTime end, Pageable pageable) {
        if (module != null && start != null && end != null) {
            return auditLogRepository.findByModuleAndCreatedAtBetween(module, start, end, pageable);
        }
        return auditLogRepository.findAll(pageable);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return obj.toString();
        }
    }

    private HttpServletRequest getRequest() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs != null ? attrs.getRequest() : null;
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
