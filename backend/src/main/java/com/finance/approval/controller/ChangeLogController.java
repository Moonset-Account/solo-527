package com.finance.approval.controller;

import com.finance.approval.dto.ApiResponse;
import com.finance.approval.dto.PageResult;
import com.finance.approval.entity.ChangeLog;
import com.finance.approval.repository.ChangeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/change-logs")
@RequiredArgsConstructor
public class ChangeLogController {

    private final ChangeLogRepository changeLogRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<PageResult<ChangeLog>> getChangeLogList(
            @RequestParam(required = false) String changeType,
            Pageable pageable) {
        Page<ChangeLog> logPage;
        if (changeType != null && !changeType.isEmpty()) {
            logPage = changeLogRepository.findByChangeType(changeType, pageable);
        } else {
            logPage = changeLogRepository.findAll(pageable);
        }

        PageResult<ChangeLog> result = PageResult.of(
                logPage.getTotalElements(),
                logPage.getContent(),
                logPage.getNumber(),
                logPage.getSize()
        );

        return ApiResponse.success(result);
    }
}
