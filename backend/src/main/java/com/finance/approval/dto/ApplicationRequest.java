package com.finance.approval.dto;

import com.finance.approval.enums.ExpenseType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ApplicationRequest {

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotNull(message = "金额不能为空")
    @Positive(message = "金额必须大于0")
    private BigDecimal amount;

    @NotNull(message = "报销类型不能为空")
    private ExpenseType expenseType;

    private String description;

    private List<String> attachments;
}
