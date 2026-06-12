package com.finance.approval.controller;

import com.finance.approval.dto.ApiResponse;
import com.finance.approval.dto.ApprovalRequest;
import com.finance.approval.entity.ApprovalRecord;
import com.finance.approval.entity.ExpenseApplication;
import com.finance.approval.entity.SysUser;
import com.finance.approval.enums.ApplicationStatus;
import com.finance.approval.enums.ApprovalAction;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ApprovalRecordRepository;
import com.finance.approval.repository.ExpenseApplicationRepository;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalRecordRepository approvalRecordRepository;
    private final ExpenseApplicationRepository applicationRepository;
    private final SysUserRepository userRepository;

    @PostMapping("/approve")
    @PreAuthorize("hasRole('APPROVER') or hasRole('FINANCE_MANAGER') or hasRole('ADMIN')")
    public ApiResponse<ApprovalRecord> approve(@Valid @RequestBody ApprovalRequest request) {
        return processApproval(request, ApprovalAction.APPROVE);
    }

    @PostMapping("/reject")
    @PreAuthorize("hasRole('APPROVER') or hasRole('FINANCE_MANAGER') or hasRole('ADMIN')")
    public ApiResponse<ApprovalRecord> reject(@Valid @RequestBody ApprovalRequest request) {
        return processApproval(request, ApprovalAction.REJECT);
    }

    @GetMapping("/{applicationId}/records")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<ApprovalRecord>> getApprovalRecords(@PathVariable Long applicationId) {
        ExpenseApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!application.getApplicantId().equals(user.getId()) &&
                !SecurityUtils.hasRole("ADMIN") &&
                !SecurityUtils.hasRole("FINANCE_MANAGER") &&
                !SecurityUtils.hasRole("APPROVER")) {
            throw new BusinessException("无权限查看该申请的审批记录");
        }

        List<ApprovalRecord> records = approvalRecordRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
        return ApiResponse.success(records);
    }

    private ApiResponse<ApprovalRecord> processApproval(ApprovalRequest request, ApprovalAction action) {
        ExpenseApplication application = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new BusinessException("该申请不是待审批状态");
        }

        String username = SecurityUtils.getCurrentUsername();
        SysUser approver = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        application.setStatus(action == ApprovalAction.APPROVE ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED);
        application.setCompletedAt(LocalDateTime.now());
        applicationRepository.save(application);

        ApprovalRecord record = ApprovalRecord.builder()
                .applicationId(request.getApplicationId())
                .nodeId(application.getCurrentNodeId() != null ? application.getCurrentNodeId() : 0L)
                .nodeName("审批")
                .approverId(approver.getId())
                .approverName(approver.getRealName())
                .action(action)
                .opinion(request.getOpinion())
                .approvalTime(LocalDateTime.now())
                .build();

        record = approvalRecordRepository.save(record);
        return ApiResponse.success(record);
    }
}
