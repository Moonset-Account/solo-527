package com.datagrowth.portal.controller;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.ApprovalRequest;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping
    public ApiResponse<Page<ApprovalRequest>> getApprovalList(
        @RequestParam(required = false) Long userId,
        @RequestParam(required = false) Long approverId,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return approvalService.getApprovalList(userId, approverId, status, pageable);
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getApprovalStats() {
        return approvalService.getApprovalStats();
    }

    @GetMapping("/{id}")
    public ApiResponse<ApprovalRequest> getApprovalDetail(@PathVariable Long id) {
        return approvalService.getApprovalDetail(id);
    }

    @PostMapping
    public ApiResponse<ApprovalRequest> createApproval(@RequestBody ApprovalRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            request.setUserId(user.getId());
        }
        return approvalService.createApproval(request);
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<ApprovalRequest> approve(
        @PathVariable Long id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long approverId = null;
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            approverId = user.getId();
        }
        String comment = body != null ? body.get("comment") : null;
        return approvalService.approve(id, approverId, comment);
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<ApprovalRequest> reject(
        @PathVariable Long id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long approverId = null;
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            approverId = user.getId();
        }
        String comment = body != null ? body.get("comment") : null;
        return approvalService.reject(id, approverId, comment);
    }
}
