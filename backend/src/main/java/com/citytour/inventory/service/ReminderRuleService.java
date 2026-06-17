package com.citytour.inventory.service;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.entity.ReminderRule;
import com.citytour.inventory.repository.ReminderRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReminderRuleService {

    private final ReminderRuleRepository reminderRuleRepository;

    public PageResult<ReminderRule> list(int page, int size, String ruleCode, String ruleName,
                                         String ruleType, Boolean enabled) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<ReminderRule> result = reminderRuleRepository.findByConditions(
                ruleCode, ruleName, ruleType, enabled, pageRequest);
        return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
    }

    public ReminderRule getById(Long id) {
        return reminderRuleRepository.findById(id).orElse(null);
    }

    public ReminderRule getByRuleCode(String ruleCode) {
        return reminderRuleRepository.findByRuleCode(ruleCode).orElse(null);
    }

    public List<ReminderRule> getEnabledRulesByType(String ruleType) {
        return reminderRuleRepository.findByRuleTypeAndEnabledTrue(ruleType);
    }

    @Transactional
    public ReminderRule create(ReminderRule rule, String operator) {
        if (rule.getEnabled() == null) {
            rule.setEnabled(true);
        }
        if (rule.getVersion() == null) {
            rule.setVersion(1);
        }
        rule.setCreatedBy(operator);
        return reminderRuleRepository.save(rule);
    }

    @Transactional
    public ReminderRule update(ReminderRule rule, String operator) {
        ReminderRule existing = reminderRuleRepository.findById(rule.getId()).orElseThrow();
        rule.setVersion(existing.getVersion() + 1);
        rule.setUpdatedBy(operator);
        return reminderRuleRepository.save(rule);
    }

    @Transactional
    public ReminderRule toggleEnabled(Long id, boolean enabled, String operator) {
        ReminderRule rule = reminderRuleRepository.findById(id).orElseThrow();
        rule.setEnabled(enabled);
        rule.setUpdatedBy(operator);
        rule.setVersion(rule.getVersion() + 1);
        return reminderRuleRepository.save(rule);
    }

    @Transactional
    public void delete(Long id) {
        reminderRuleRepository.deleteById(id);
    }

    public boolean checkUpgradeCondition(String currentRuleCode, Object context) {
        ReminderRule currentRule = getByRuleCode(currentRuleCode);
        if (currentRule == null || currentRule.getUpgradeCondition() == null) {
            return false;
        }
        String upgradeRuleCode = currentRule.getUpgradeRuleCode();
        return upgradeRuleCode != null && !upgradeRuleCode.isEmpty();
    }
}
