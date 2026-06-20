package com.datagrowth.portal.service;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.AlertRule;
import com.datagrowth.portal.repository.AlertRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AlertRuleService {

    private final AlertRuleRepository alertRuleRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "alert:";

    public ApiResponse<Page<AlertRule>> getRuleList(
        String metricName, String severity, Boolean enabled, Pageable pageable
    ) {
        Page<AlertRule> result;
        
        if (metricName != null) {
            result = alertRuleRepository.findByMetricNameContaining(metricName, pageable);
        } else if (severity != null) {
            result = alertRuleRepository.findBySeverity(severity, pageable);
        } else if (enabled != null) {
            result = alertRuleRepository.findByEnabled(enabled, pageable);
        } else {
            result = alertRuleRepository.findAll(pageable);
        }
        
        return ApiResponse.success(result);
    }

    public ApiResponse<AlertRule> getRuleDetail(Long id) {
        return alertRuleRepository.findById(id)
            .map(ApiResponse::success)
            .orElse(ApiResponse.error("告警规则不存在"));
    }

    public ApiResponse<AlertRule> createRule(AlertRule rule) {
        rule.setEnabled(true);
        AlertRule saved = alertRuleRepository.save(rule);
        clearCache();
        return ApiResponse.success("告警规则已创建", saved);
    }

    public ApiResponse<AlertRule> updateRule(Long id, AlertRule rule) {
        return alertRuleRepository.findById(id)
            .map(existing -> {
                existing.setRuleName(rule.getRuleName());
                existing.setMetricName(rule.getMetricName());
                existing.setDimension(rule.getDimension());
                existing.setAlertType(rule.getAlertType());
                existing.setThreshold(rule.getThreshold());
                existing.setOperator(rule.getOperator());
                existing.setSeverity(rule.getSeverity());
                existing.setEffectiveCondition(rule.getEffectiveCondition());
                existing.setEnabled(rule.getEnabled());
                existing.setNotificationChannels(rule.getNotificationChannels());
                existing.setNotifyUsers(rule.getNotifyUsers());
                existing.setUpdatedBy(rule.getUpdatedBy());
                AlertRule saved = alertRuleRepository.save(existing);
                clearCache();
                return ApiResponse.success("告警规则已更新", saved);
            })
            .orElse(ApiResponse.error("告警规则不存在"));
    }

    public ApiResponse<Void> deleteRule(Long id) {
        if (alertRuleRepository.existsById(id)) {
            alertRuleRepository.deleteById(id);
            clearCache();
            return ApiResponse.success("告警规则已删除", null);
        }
        return ApiResponse.error("告警规则不存在");
    }

    public ApiResponse<AlertRule> toggleRule(Long id, boolean enabled) {
        return alertRuleRepository.findById(id)
            .map(rule -> {
                rule.setEnabled(enabled);
                AlertRule saved = alertRuleRepository.save(rule);
                clearCache();
                return ApiResponse.success(enabled ? "规则已启用" : "规则已禁用", saved);
            })
            .orElse(ApiResponse.error("告警规则不存在"));
    }

    @SuppressWarnings("unchecked")
    public List<AlertRule> getActiveRules() {
        String cacheKey = CACHE_PREFIX + "active";
        List<AlertRule> rules = (List<AlertRule>) redisTemplate.opsForValue().get(cacheKey);
        
        if (rules == null) {
            rules = alertRuleRepository.findByEnabledTrue();
            redisTemplate.opsForValue().set(cacheKey, rules, 30, TimeUnit.MINUTES);
        }
        
        return rules;
    }

    private void clearCache() {
        redisTemplate.delete(CACHE_PREFIX + "active");
    }
}
