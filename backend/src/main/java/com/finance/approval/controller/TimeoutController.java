package com.finance.approval.controller;

import com.finance.approval.dto.ApiResponse;
import com.finance.approval.dto.PageResult;
import com.finance.approval.entity.SysUser;
import com.finance.approval.entity.TimeoutException;
import com.finance.approval.enums.TimeoutStatus;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.repository.TimeoutExceptionRepository;
import com.finance.approval.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/timeouts")
@RequiredArgsConstructor
public class TimeoutController {

    private final TimeoutExceptionRepository timeoutExceptionRepository;
    private final SysUserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<PageResult<TimeoutException>> getTimeoutList(
            @RequestParam(required = false) TimeoutStatus status,
            Pageable pageable) {
        Page<TimeoutException> timeoutPage;
        if (status != null) {
            timeoutPage = timeoutExceptionRepository.findByStatus(status, pageable);
        } else {
            timeoutPage = timeoutExceptionRepository.findAll(pageable);
        }

        PageResult<TimeoutException> result = PageResult.of(
                timeoutPage.getTotalElements(),
                timeoutPage.getContent(),
                timeoutPage.getNumber(),
                timeoutPage.getSize()
        );

        return ApiResponse.success(result);
    }

    @PostMapping("/{id}/handle")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<TimeoutException> handleTimeout(@PathVariable Long id) {
        TimeoutException timeout = timeoutExceptionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("超时记录不存在"));

        if (timeout.getStatus() == TimeoutStatus.HANDLED) {
            throw new BusinessException("该超时已处理");
        }

        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        timeout.setStatus(TimeoutStatus.HANDLED);
        timeout.setHandledBy(user.getId());
        timeout.setHandledAt(LocalDateTime.now());

        timeout = timeoutExceptionRepository.save(timeout);
        return ApiResponse.success(timeout);
    }

    @PostMapping("/{id}/remind")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<Void> sendReminder(@PathVariable Long id) {
        TimeoutException timeout = timeoutExceptionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("超时记录不存在"));

        if (timeout.getStatus() == TimeoutStatus.HANDLED) {
            throw new BusinessException("该超时已处理，无需发送提醒");
        }

        return ApiResponse.success();
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<Map<String, Object>> getTimeoutStatistics() {
        Map<String, Object> statistics = new HashMap<>();

        long totalCount = timeoutExceptionRepository.count();
        long pendingCount = timeoutExceptionRepository.findByStatus(TimeoutStatus.PENDING, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long handledCount = timeoutExceptionRepository.findByStatus(TimeoutStatus.HANDLED, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();

        statistics.put("totalCount", totalCount);
        statistics.put("pendingCount", pendingCount);
        statistics.put("handledCount", handledCount);
        statistics.put("pendingRate", totalCount > 0 ? (double) pendingCount / totalCount : 0);

        return ApiResponse.success(statistics);
    }
}
