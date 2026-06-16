package com.pm.workstation.service;

import com.pm.workstation.dto.ReminderRuleDTO;
import com.pm.workstation.entity.ReminderLog;
import com.pm.workstation.entity.ReminderRule;
import java.util.List;

public interface ReminderService {

    ReminderRule createRule(ReminderRuleDTO dto);

    ReminderRule updateRule(Long id, ReminderRuleDTO dto);

    void deleteRule(Long id);

    List<ReminderRule> getEnabledRules();

    ReminderLog sendReminder(Long ruleId, Long targetId, Long receiverId);

    void checkAndRemind();
}
