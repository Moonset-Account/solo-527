package com.pm.workstation.repository;

import com.pm.workstation.entity.ReminderRule;
import com.pm.workstation.enums.ReminderType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReminderRuleRepository extends JpaRepository<ReminderRule, Long> {

    List<ReminderRule> findByEnabledTrue();

    List<ReminderRule> findByRuleTypeAndEnabledTrue(ReminderType ruleType);
}
