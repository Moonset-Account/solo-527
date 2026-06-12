package com.finance.approval.controller;

import com.finance.approval.dto.ApiResponse;
import com.finance.approval.dto.PageResult;
import com.finance.approval.dto.RuleRequest;
import com.finance.approval.entity.ApprovalNode;
import com.finance.approval.entity.ApprovalRule;
import com.finance.approval.entity.SysUser;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ApprovalNodeRepository;
import com.finance.approval.repository.ApprovalRuleRepository;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
public class ApprovalRuleController {

    private final ApprovalRuleRepository approvalRuleRepository;
    private final ApprovalNodeRepository approvalNodeRepository;
    private final SysUserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<PageResult<ApprovalRule>> getRuleList(
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        Page<ApprovalRule> rulePage;
        if (keyword != null && !keyword.isEmpty()) {
            rulePage = approvalRuleRepository.findByKeyword(keyword, pageable);
        } else {
            rulePage = approvalRuleRepository.findAll(pageable);
        }

        PageResult<ApprovalRule> result = PageResult.of(
                rulePage.getTotalElements(),
                rulePage.getContent(),
                rulePage.getNumber(),
                rulePage.getSize()
        );

        return ApiResponse.success(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<ApprovalRule> getRuleById(@PathVariable Long id) {
        ApprovalRule rule = approvalRuleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("规则不存在"));
        return ApiResponse.success(rule);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<ApprovalRule> createRule(@Valid @RequestBody RuleRequest request) {
        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        ApprovalRule rule = ApprovalRule.builder()
                .ruleName(request.getName())
                .maxAmount(request.getMaxAmount())
                .minAmount(java.math.BigDecimal.ZERO)
                .approverRole(request.getApproverRole())
                .description(request.getDescription())
                .enabled(request.getEnabled() != null ? request.getEnabled() : true)
                .createdBy(user.getId())
                .build();

        rule = approvalRuleRepository.save(rule);
        return ApiResponse.success(rule);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<ApprovalRule> updateRule(
            @PathVariable Long id,
            @Valid @RequestBody RuleRequest request) {
        ApprovalRule rule = approvalRuleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("规则不存在"));

        rule.setRuleName(request.getName());
        rule.setMaxAmount(request.getMaxAmount());
        rule.setApproverRole(request.getApproverRole());
        rule.setDescription(request.getDescription());
        if (request.getEnabled() != null) {
            rule.setEnabled(request.getEnabled());
        }

        rule = approvalRuleRepository.save(rule);
        return ApiResponse.success(rule);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<Void> deleteRule(@PathVariable Long id) {
        ApprovalRule rule = approvalRuleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("规则不存在"));

        List<ApprovalNode> nodes = approvalNodeRepository.findByRuleIdOrderByNodeOrderAsc(id);
        approvalNodeRepository.deleteAll(nodes);
        approvalRuleRepository.delete(rule);

        return ApiResponse.success();
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<ApprovalRule> toggleRule(@PathVariable Long id) {
        ApprovalRule rule = approvalRuleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("规则不存在"));

        rule.setEnabled(!rule.getEnabled());
        rule = approvalRuleRepository.save(rule);
        return ApiResponse.success(rule);
    }

    @GetMapping("/{id}/nodes")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<List<ApprovalNode>> getRuleNodes(@PathVariable Long id) {
        ApprovalRule rule = approvalRuleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("规则不存在"));

        List<ApprovalNode> nodes = approvalNodeRepository.findByRuleIdOrderByNodeOrderAsc(id);
        return ApiResponse.success(nodes);
    }

    @PutMapping("/{id}/nodes")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<List<ApprovalNode>> saveRuleNodes(
            @PathVariable Long id,
            @RequestBody List<ApprovalNode> nodes) {
        ApprovalRule rule = approvalRuleRepository.findById(id)
                .orElseThrow(() -> new BusinessException("规则不存在"));

        List<ApprovalNode> existingNodes = approvalNodeRepository.findByRuleIdOrderByNodeOrderAsc(id);
        approvalNodeRepository.deleteAll(existingNodes);

        for (int i = 0; i < nodes.size(); i++) {
            ApprovalNode node = nodes.get(i);
            node.setRuleId(id);
            node.setNodeOrder(i + 1);
            node.setId(null);
            approvalNodeRepository.save(node);
        }

        List<ApprovalNode> savedNodes = approvalNodeRepository.findByRuleIdOrderByNodeOrderAsc(id);
        return ApiResponse.success(savedNodes);
    }
}
