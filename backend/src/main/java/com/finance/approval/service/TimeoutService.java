package com.finance.approval.service;

import com.finance.approval.audit.AuditOperation;
import com.finance.approval.entity.ApprovalNode;
import com.finance.approval.entity.ExpenseApplication;
import com.finance.approval.entity.SysUser;
import com.finance.approval.entity.TimeoutException;
import com.finance.approval.enums.ApplicationStatus;
import com.finance.approval.enums.TimeoutStatus;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ApprovalNodeRepository;
import com.finance.approval.repository.ExpenseApplicationRepository;
import com.finance.approval.repository.TimeoutExceptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimeoutService {

    private final TimeoutExceptionRepository timeoutExceptionRepository;
    private final ExpenseApplicationRepository expenseApplicationRepository;
    private final ApprovalNodeRepository approvalNodeRepository;
    private final UserService userService;

    @Transactional
    @AuditOperation(module = "超时监控", operation = "检查并创建超时记录")
    public void checkAndCreateTimeoutExceptions() {
        LocalDateTime now = LocalDateTime.now();
        List<ExpenseApplication> pendingApplications = expenseApplicationRepository
                .findByStatus(ApplicationStatus.PENDING, Pageable.unpaged()).getContent();

        for (ExpenseApplication application : pendingApplications) {
            if (application.getCurrentNodeId() == null) {
                continue;
            }

            ApprovalNode node = approvalNodeRepository.findById(application.getCurrentNodeId())
                    .orElse(null);

            if (node == null || node.getTimeoutHours() == null || node.getTimeoutHours() <= 0) {
                continue;
            }

            LocalDateTime dueTime = application.getSubmittedAt() != null
                    ? application.getSubmittedAt().plusHours(node.getTimeoutHours())
                    : application.getCreatedAt().plusHours(node.getTimeoutHours());

            if (now.isAfter(dueTime) && !timeoutExceptionRepository.existsByApplicationIdAndNodeIdAndStatus(
                    application.getId(), node.getId(), TimeoutStatus.PENDING)) {

                SysUser approver = getApproverForNode(application, node);

                TimeoutException timeout = TimeoutException.builder()
                        .applicationId(application.getId())
                        .nodeId(node.getId())
                        .nodeName(node.getNodeName())
                        .approverId(approver != null ? approver.getId() : null)
                        .approverName(approver != null ? approver.getRealName() : null)
                        .dueTime(dueTime)
                        .timeoutHours(node.getTimeoutHours())
                        .status(TimeoutStatus.PENDING)
                        .build();

                timeoutExceptionRepository.save(timeout);
                log.info("创建超时记录，申请ID: {}, 节点: {}", application.getId(), node.getNodeName());
            }
        }
    }

    private SysUser getApproverForNode(ExpenseApplication application, ApprovalNode node) {
        if (node.getApproverUserId() != null) {
            return userService.getUserById(node.getApproverUserId());
        }
        if (node.getApproverRole() != null) {
            List<SysUser> users = userService.getUsersByRole(node.getApproverRole());
            if (!users.isEmpty()) {
                return users.get(0);
            }
        }
        return null;
    }

    @Transactional(readOnly = true)
    public Page<TimeoutException> getTimeoutList(TimeoutStatus status, Pageable pageable) {
        if (status != null) {
            return timeoutExceptionRepository.findByStatus(status, pageable);
        }
        return timeoutExceptionRepository.findAll(pageable);
    }

    @Transactional
    @AuditOperation(module = "超时监控", operation = "处理超时")
    public TimeoutException handleTimeout(Long id, String handleRemark) {
        TimeoutException timeout = timeoutExceptionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("超时记录不存在"));

        if (timeout.getStatus() != TimeoutStatus.PENDING) {
            throw new BusinessException("该超时记录已处理");
        }

        SysUser currentUser = userService.getCurrentUser();
        timeout.setStatus(TimeoutStatus.HANDLED);
        timeout.setHandledBy(currentUser.getId());
        timeout.setHandledAt(LocalDateTime.now());

        return timeoutExceptionRepository.save(timeout);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTimeoutStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("pendingCount", timeoutExceptionRepository.countByStatus(TimeoutStatus.PENDING));
        statistics.put("handledCount", timeoutExceptionRepository.countByStatus(TimeoutStatus.HANDLED));
        statistics.put("timeoutByApprover", timeoutExceptionRepository.getTimeoutCountByApprover());
        return statistics;
    }

    @Async
    @Transactional
    @AuditOperation(module = "超时监控", operation = "发送提醒")
    public void sendReminder(Long timeoutId) {
        TimeoutException timeout = timeoutExceptionRepository.findById(timeoutId)
                .orElseThrow(() -> new BusinessException("超时记录不存在"));

        log.info("发送超时提醒，超时ID: {}, 审批人: {}", timeoutId, timeout.getApproverName());
    }
}
