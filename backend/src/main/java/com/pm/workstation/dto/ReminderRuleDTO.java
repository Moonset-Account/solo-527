package com.pm.workstation.dto;

import com.pm.workstation.enums.RemindMethod;
import com.pm.workstation.enums.ReminderType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReminderRuleDTO {

    private Long id;

    private String ruleName;

    private ReminderType ruleType;

    private Object triggerCondition;

    private Integer triggerHours;

    private List<RemindMethod> remindMethod;

    private Integer remindBeforeHours;

    private Boolean enabled;
}
