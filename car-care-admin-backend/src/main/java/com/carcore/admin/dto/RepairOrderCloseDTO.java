package com.carcore.admin.dto;

import jakarta.validation.constraints.NotNull;

public class RepairOrderCloseDTO {

    @NotNull(message = "维修单ID不能为空")
    private Long repairOrderId;

    @NotNull(message = "处理人ID不能为空")
    private Long handlerId;

    private String closeRemark;

    public Long getRepairOrderId() {
        return repairOrderId;
    }

    public void setRepairOrderId(Long repairOrderId) {
        this.repairOrderId = repairOrderId;
    }

    public Long getHandlerId() {
        return handlerId;
    }

    public void setHandlerId(Long handlerId) {
        this.handlerId = handlerId;
    }

    public String getCloseRemark() {
        return closeRemark;
    }

    public void setCloseRemark(String closeRemark) {
        this.closeRemark = closeRemark;
    }
}
