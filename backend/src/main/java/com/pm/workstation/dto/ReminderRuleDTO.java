package com.pm.workstation.dto;

import com.pm.workstation.enums.RemindMethod;
import com.pm.workstation.enums.ReminderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReminderRuleDTO {

    private Long id;

    @NotBlank(message = "规则名称不能为空")
    private String ruleName;

    @NotNull(message = "规则类型不能为空")
    private ReminderType ruleType;

    private String triggerCondition;

    @NotNull(message = "提醒方式不能为空")
    private RemindMethod remindMethod;

    private Integer remindBeforeHours;

    private Boolean enabled;
}
