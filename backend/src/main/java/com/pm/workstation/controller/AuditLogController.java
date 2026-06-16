package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.entity.AuditLog;
import com.pm.workstation.enums.AuditAction;
import com.pm.workstation.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ApiResponseDTO<PageResultDTO<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) AuditAction action) {
        return ApiResponseDTO.success(auditLogService.getAuditLogs(page, size, action));
    }
}
