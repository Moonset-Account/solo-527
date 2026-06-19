package com.decoration.cooperation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApprovalActionDTO {
    @NotNull(message = "审批ID不能为空")
    private Long approvalId;
    private String approvalType;
    private String opinion;
    private Long processDuration;
}
