package com.finance.approval.service;

import com.finance.approval.audit.AuditOperation;
import com.finance.approval.dto.ApprovalRequest;
import com.finance.approval.entity.ApprovalNode;
import com.finance.approval.entity.ApprovalRecord;
import com.finance.approval.entity.ApprovalRule;
import com.finance.approval.entity.ExpenseApplication;
import com.finance.approval.entity.SysUser;
import com.finance.approval.enums.ApplicationStatus;
import com.finance.approval.enums.ApprovalAction;
import com.finance.approval.enums.RoleCode;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ApprovalNodeRepository;
import com.finance.approval.repository.ApprovalRecordRepository;
import com.finance.approval.repository.ApprovalRuleRepository;
import com.finance.approval.repository.ExpenseApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ApprovalFlowService {

    private final ExpenseApplicationRepository expenseApplicationRepository;
    private final ApprovalRuleRepository approvalRuleRepository;
    private final ApprovalNodeRepository approvalNodeRepository;
    private final ApprovalRecordRepository approvalRecordRepository;
    private final UserService userService;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String APPROVAL_RULE_CACHE_PREFIX = "approval_rule:";
    private static final String APPLICATION_CACHE_PREFIX = "application:";

    @Transactional
    @AuditOperation(module = "审批流", operation = "启动审批流")
    public void startApprovalFlow(Long applicationId) {
        ExpenseApplication application = expenseApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new BusinessException("只有待审批状态的申请可以启动审批流");
        }

        ApprovalRule rule = matchApprovalRule(
                application.getAmount(),
                application.getExpenseType(),
                application.getDepartment()
        );

        if (rule == null) {
            throw new BusinessException("未找到匹配的审批规则");
        }

        List<ApprovalNode> nodes = approvalNodeRepository.findByRuleIdOrderByNodeOrderAsc(rule.getId());
        if (nodes.isEmpty()) {
            throw new BusinessException("审批规则未配置审批节点");
        }

        ApprovalNode firstNode = nodes.get(0);
        application.setCurrentNodeId(firstNode.getId());
        expenseApplicationRepository.save(application);
        redisTemplate.delete(APPLICATION_CACHE_PREFIX + applicationId);
    }

    @Transactional
    @AuditOperation(module = "审批流", operation = "审批通过")
    public ApprovalRecord approve(ApprovalRequest request) {
        return processApproval(request, ApprovalAction.APPROVE);
    }

    @Transactional
    @AuditOperation(module = "审批流", operation = "审批拒绝")
    public ApprovalRecord reject(ApprovalRequest request) {
        return processApproval(request, ApprovalAction.REJECT);
    }

    private ApprovalRecord processApproval(ApprovalRequest request, ApprovalAction action) {
        ExpenseApplication application = expenseApplicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new BusinessException("只有待审批状态的申请可以审批");
        }

        SysUser currentUser = userService.getCurrentUser();
        ApprovalNode currentNode = approvalNodeRepository.findById(application.getCurrentNodeId())
                .orElseThrow(() -> new BusinessException("当前审批节点不存在"));

        if (!canApprove(currentUser, currentNode)) {
            throw new BusinessException("您没有权限审批此申请");
        }

        ApprovalRecord record = ApprovalRecord.builder()
                .applicationId(application.getId())
                .nodeId(currentNode.getId())
                .nodeName(currentNode.getNodeName())
                .approverId(currentUser.getId())
                .approverName(currentUser.getRealName())
                .action(action)
                .opinion(request.getOpinion())
                .approvalTime(LocalDateTime.now())
                .build();

        approvalRecordRepository.save(record);

        if (action == ApprovalAction.REJECT) {
            completeApplication(application.getId(), false);
        } else {
            moveToNextNode(application.getId());
        }

        return record;
    }

    private boolean canApprove(SysUser user, ApprovalNode node) {
        if (node.getApproverUserId() != null && node.getApproverUserId().equals(user.getId())) {
            return true;
        }

        if (node.getApproverRole() != null) {
            List<com.finance.approval.entity.SysRole> roles = userService.getUserRoles(user.getId());
            return roles.stream()
                    .anyMatch(role -> role.getRoleCode() == node.getApproverRole());
        }

        return false;
    }

    @Transactional(readOnly = true)
    public List<ApprovalRecord> getApprovalRecords(Long applicationId) {
        return approvalRecordRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
    }

    @Transactional(readOnly = true)
    public Page<ExpenseApplication> getPendingApprovals(Long approverId, Pageable pageable) {
        SysUser user = userService.getUserById(approverId);
        RoleCode roleCode = null;
        var roles = userService.getUserRoles(approverId);
        if (!roles.isEmpty()) {
            roleCode = roles.get(0).getRoleCode();
        }
        return expenseApplicationRepository.findApplicationsForApprover(approverId, roleCode, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ApprovalRecord> getApprovedList(Long approverId, Pageable pageable) {
        return approvalRecordRepository.findByApproverIdAndAction(approverId, ApprovalAction.APPROVE, pageable);
    }

    @Transactional(readOnly = true)
    public ApprovalRule matchApprovalRule(BigDecimal amount, String expenseType, String department) {
        String cacheKey = APPROVAL_RULE_CACHE_PREFIX + amount + ":" + expenseType + ":" + department;
        ApprovalRule cachedRule = (ApprovalRule) redisTemplate.opsForValue().get(cacheKey);
        if (cachedRule != null) {
            return cachedRule;
        }

        List<ApprovalRule> rules = approvalRuleRepository.findMatchingRules(amount, expenseType, department);
        if (rules.isEmpty()) {
            rules = approvalRuleRepository.findMatchingRules(amount, null, department);
        }
        if (rules.isEmpty()) {
            rules = approvalRuleRepository.findMatchingRules(amount, expenseType, null);
        }
        if (rules.isEmpty()) {
            rules = approvalRuleRepository.findMatchingRules(amount, null, null);
        }

        ApprovalRule rule = rules.stream()
                .min(Comparator.comparing(ApprovalRule::getMaxAmount))
                .orElse(null);

        if (rule != null) {
            redisTemplate.opsForValue().set(cacheKey, rule, 1, TimeUnit.HOURS);
        }

        return rule;
    }

    @Transactional
    public void moveToNextNode(Long applicationId) {
        ExpenseApplication application = expenseApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        ApprovalNode currentNode = approvalNodeRepository.findById(application.getCurrentNodeId())
                .orElseThrow(() -> new BusinessException("当前审批节点不存在"));

        List<ApprovalNode> nodes = approvalNodeRepository.findByRuleIdOrderByNodeOrderAsc(currentNode.getRuleId());

        int currentIndex = -1;
        for (int i = 0; i < nodes.size(); i++) {
            if (nodes.get(i).getId().equals(currentNode.getId())) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex == -1) {
            throw new BusinessException("当前节点不在规则节点列表中");
        }

        if (currentIndex < nodes.size() - 1) {
            ApprovalNode nextNode = nodes.get(currentIndex + 1);
            application.setCurrentNodeId(nextNode.getId());
            expenseApplicationRepository.save(application);
        } else {
            completeApplication(applicationId, true);
        }

        redisTemplate.delete(APPLICATION_CACHE_PREFIX + applicationId);
    }

    @Transactional
    public void completeApplication(Long applicationId, boolean approved) {
        ExpenseApplication application = expenseApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        application.setStatus(approved ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED);
        application.setCompletedAt(LocalDateTime.now());
        expenseApplicationRepository.save(application);
        redisTemplate.delete(APPLICATION_CACHE_PREFIX + applicationId);
    }
}
