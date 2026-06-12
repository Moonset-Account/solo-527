package com.finance.approval.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RuleRequest {

    @NotBlank(message = "规则名称不能为空")
    private String name;

    @NotNull(message = "最大金额不能为空")
    @Positive(message = "最大金额必须大于0")
    private BigDecimal maxAmount;

    @NotBlank(message = "审批角色不能为空")
    private String approverRole;

    private String description;

    private Boolean enabled;
}
