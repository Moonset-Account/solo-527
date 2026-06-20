package com.carcore.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RepairOrderDelayDTO {

    @NotNull(message = "维修单ID不能为空")
    private Long repairOrderId;

    @NotBlank(message = "延期原因不能为空")
    private String delayReason;

    @NotBlank(message = "延期处理结果不能为空")
    private String delayHandleResult;

    @NotNull(message = "处理人ID不能为空")
    private Long handlerId;

    public Long getRepairOrderId() {
        return repairOrderId;
    }

    public void setRepairOrderId(Long repairOrderId) {
        this.repairOrderId = repairOrderId;
    }

    public String getDelayReason() {
        return delayReason;
    }

    public void setDelayReason(String delayReason) {
        this.delayReason = delayReason;
    }

    public String getDelayHandleResult() {
        return delayHandleResult;
    }

    public void setDelayHandleResult(String delayHandleResult) {
        this.delayHandleResult = delayHandleResult;
    }

    public Long getHandlerId() {
        return handlerId;
    }

    public void setHandlerId(Long handlerId) {
        this.handlerId = handlerId;
    }
}
