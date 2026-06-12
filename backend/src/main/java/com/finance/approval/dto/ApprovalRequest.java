package com.finance.approval.dto;

import com.finance.approval.enums.ApprovalAction;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApprovalRequest {

    @NotNull(message = "申请ID不能为空")
    private Long applicationId;

    @NotNull(message = "审批动作不能为空")
    private ApprovalAction action;

    private String opinion;
}
