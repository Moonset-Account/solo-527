package com.finance.approval.controller;

import com.finance.approval.dto.ApiResponse;
import com.finance.approval.dto.PageResult;
import com.finance.approval.entity.AuditLog;
import com.finance.approval.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResult<AuditLog>> getAuditLogList(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) LocalDateTime startTime,
            @RequestParam(required = false) LocalDateTime endTime,
            Pageable pageable) {
        Page<AuditLog> logPage;

        if (userId != null) {
            logPage = auditLogRepository.findByUserId(userId, pageable);
        } else if (module != null && !module.isEmpty()) {
            logPage = auditLogRepository.findByModule(module, pageable);
        } else if (startTime != null && endTime != null) {
            logPage = auditLogRepository.findByCreatedAtBetween(startTime, endTime, pageable);
        } else {
            logPage = auditLogRepository.findAll(pageable);
        }

        PageResult<AuditLog> result = PageResult.of(
                logPage.getTotalElements(),
                logPage.getContent(),
                logPage.getNumber(),
                logPage.getSize()
        );

        return ApiResponse.success(result);
    }
}
