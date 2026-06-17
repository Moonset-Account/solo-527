package com.citytour.inventory.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "reminder_rule", indexes = {
        @Index(name = "idx_rule_type", columnList = "rule_type")
})
public class ReminderRule extends BaseEntity {

    @Column(name = "rule_code", unique = true, nullable = false, length = 50)
    private String ruleCode;

    @Column(name = "rule_name", length = 100)
    private String ruleName;

    @Column(name = "rule_type", length = 30)
    private String ruleType;

    @Column(name = "trigger_condition", columnDefinition = "text")
    private String triggerCondition;

    @Column(name = "reminder_level", length = 20)
    private String reminderLevel;

    @Column(name = "reminder_way", length = 50)
    private String reminderWay;

    @Column(name = "reminder_template", columnDefinition = "text")
    private String reminderTemplate;

    @Column(name = "upgrade_condition", columnDefinition = "text")
    private String upgradeCondition;

    @Column(name = "upgrade_rule_code", length = 50)
    private String upgradeRuleCode;

    @Column(name = "enabled")
    private Boolean enabled;

    @Column(name = "version")
    private Integer version;

    @Column(name = "remark", length = 500)
    private String remark;
}
