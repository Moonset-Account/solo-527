package com.datagrowth.portal.controller;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.AlertRule;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.service.AlertRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/alert-rules")
@RequiredArgsConstructor
public class AlertRuleController {

    private final AlertRuleService alertRuleService;

    @GetMapping
    public ApiResponse<Page<AlertRule>> getRuleList(
        @RequestParam(required = false) String metricName,
        @RequestParam(required = false) String severity,
        @RequestParam(required = false) Boolean enabled,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return alertRuleService.getRuleList(metricName, severity, enabled, pageable);
    }

    @GetMapping("/{id}")
    public ApiResponse<AlertRule> getRuleDetail(@PathVariable Long id) {
        return alertRuleService.getRuleDetail(id);
    }

    @PostMapping
    public ApiResponse<AlertRule> createRule(@RequestBody AlertRule rule) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            rule.setCreatedBy(user.getUsername());
            rule.setUpdatedBy(user.getUsername());
        }
        return alertRuleService.createRule(rule);
    }

    @PutMapping("/{id}")
    public ApiResponse<AlertRule> updateRule(@PathVariable Long id, @RequestBody AlertRule rule) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            rule.setUpdatedBy(user.getUsername());
        }
        return alertRuleService.updateRule(id, rule);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRule(@PathVariable Long id) {
        return alertRuleService.deleteRule(id);
    }

    @PutMapping("/{id}/toggle")
    public ApiResponse<AlertRule> toggleRule(
        @PathVariable Long id,
        @RequestParam boolean enabled
    ) {
        return alertRuleService.toggleRule(id, enabled);
    }
}
