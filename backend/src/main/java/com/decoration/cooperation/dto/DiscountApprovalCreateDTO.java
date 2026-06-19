package com.decoration.cooperation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DiscountApprovalCreateDTO {
    @NotNull(message = "合同ID不能为空")
    private Long contractId;
    @NotNull(message = "原价不能为空")
    private BigDecimal originalPrice;
    @NotNull(message = "申请折扣率不能为空")
    private BigDecimal requestDiscountRate;
    private BigDecimal requestDiscountAmount;
    private BigDecimal requestFinalPrice;
    private String reason;
    private String remark;
}
