package com.finance.approval.service;

import com.finance.approval.audit.AuditOperation;
import com.finance.approval.dto.RuleRequest;
import com.finance.approval.entity.ApprovalNode;
import com.finance.approval.entity.ApprovalRule;
import com.finance.approval.entity.SysUser;
import com.finance.approval.enums.RoleCode;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ApprovalNodeRepository;
import com.finance.approval.repository.ApprovalRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ApprovalRuleService {

    private final ApprovalRuleRepository approvalRuleRepository;
    private final ApprovalNodeRepository approvalNodeRepository;
    private final UserService userService;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String RULE_CACHE_PREFIX = "approval_rule:";
    private static final String RULE_NODES_CACHE_PREFIX = "approval_rule_nodes:";
    private static final String ALL_RULES_CACHE_KEY = "all_approval_rules";

    @Transactional(readOnly = true)
    public Page<ApprovalRule> getRuleList(String keyword, Pageable pageable) {
        return approvalRuleRepository.findByKeyword(keyword, pageable);
    }

    @Transactional(readOnly = true)
    public ApprovalRule getRuleById(Long id) {
        String cacheKey = RULE_CACHE_PREFIX + id;
        ApprovalRule rule = (ApprovalRule) redisTemplate.opsForValue().get(cacheKey);
        if (rule != null) {
            return rule;
        }
        rule = approvalRuleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("审批规则不存在"));
        redisTemplate.opsForValue().set(cacheKey, rule, 1, TimeUnit.HOURS);
        return rule;
    }

    @Transactional
    @AuditOperation(module = "审批规则", operation = "创建规则")
    public ApprovalRule createRule(RuleRequest request) {
        SysUser currentUser = userService.getCurrentUser();

        ApprovalRule rule = ApprovalRule.builder()
                .ruleName(request.getName())
                .maxAmount(request.getMaxAmount())
                .minAmount(BigDecimal.ZERO)
                .enabled(request.getEnabled() != null ? request.getEnabled() : true)
                .createdBy(currentUser.getId())
                .build();

        ApprovalRule savedRule = approvalRuleRepository.save(rule);
        redisTemplate.delete(ALL_RULES_CACHE_KEY);
        return savedRule;
    }

    @Transactional
    @AuditOperation(module = "审批规则", operation = "更新规则")
    public ApprovalRule updateRule(Long id, RuleRequest request) {
        ApprovalRule rule = getRuleById(id);

        rule.setRuleName(request.getName());
        rule.setMaxAmount(request.getMaxAmount());
        if (request.getEnabled() != null) {
            rule.setEnabled(request.getEnabled());
        }

        ApprovalRule updatedRule = approvalRuleRepository.save(rule);
        redisTemplate.delete(RULE_CACHE_PREFIX + id);
        redisTemplate.delete(ALL_RULES_CACHE_KEY);
        return updatedRule;
    }

    @Transactional
    @AuditOperation(module = "审批规则", operation = "删除规则")
    public void deleteRule(Long id) {
        if (!approvalRuleRepository.existsById(id)) {
            throw new BusinessException("审批规则不存在");
        }
        approvalNodeRepository.deleteByRuleId(id);
        approvalRuleRepository.deleteById(id);
        redisTemplate.delete(RULE_CACHE_PREFIX + id);
        redisTemplate.delete(RULE_NODES_CACHE_PREFIX + id);
        redisTemplate.delete(ALL_RULES_CACHE_KEY);
    }

    @Transactional
    @AuditOperation(module = "审批规则", operation = "切换规则状态")
    public void toggleRuleStatus(Long id, boolean enabled) {
        ApprovalRule rule = getRuleById(id);
        rule.setEnabled(enabled);
        approvalRuleRepository.save(rule);
        redisTemplate.delete(RULE_CACHE_PREFIX + id);
        redisTemplate.delete(ALL_RULES_CACHE_KEY);
    }

    @Transactional(readOnly = true)
    public List<ApprovalNode> getRuleNodes(Long ruleId) {
        if (!approvalRuleRepository.existsById(ruleId)) {
            throw new BusinessException("审批规则不存在");
        }

        String cacheKey = RULE_NODES_CACHE_PREFIX + ruleId;
        @SuppressWarnings("unchecked")
        List<ApprovalNode> nodes = (List<ApprovalNode>) redisTemplate.opsForValue().get(cacheKey);
        if (nodes != null) {
            return nodes;
        }

        nodes = approvalNodeRepository.findByRuleIdOrderByNodeOrderAsc(ruleId);
        redisTemplate.opsForValue().set(cacheKey, nodes, 1, TimeUnit.HOURS);
        return nodes;
    }

    @Transactional
    @AuditOperation(module = "审批规则", operation = "保存规则节点")
    public void saveRuleNodes(Long ruleId, List<ApprovalNode> nodes) {
        if (!approvalRuleRepository.existsById(ruleId)) {
            throw new BusinessException("审批规则不存在");
        }

        approvalNodeRepository.deleteByRuleId(ruleId);

        int order = 1;
        for (ApprovalNode node : nodes) {
            node.setRuleId(ruleId);
            node.setNodeOrder(order++);
            if (node.getApproverRole() == null && node.getApproverUserId() == null) {
                throw new BusinessException("审批节点必须指定审批角色或审批人");
            }
            approvalNodeRepository.save(node);
        }

        redisTemplate.delete(RULE_NODES_CACHE_PREFIX + ruleId);
    }
}
