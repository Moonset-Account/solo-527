package com.carcore.admin.dto;

import jakarta.validation.constraints.NotNull;

public class RepairOrderStatusDTO {

    @NotNull(message = "维修单ID不能为空")
    private Long repairOrderId;

    @NotNull(message = "新状态不能为空")
    private Integer newStatus;

    private String newQualityStatus;

    @NotNull(message = "操作人ID不能为空")
    private Long operatorId;

    private String operateRemark;

    public Long getRepairOrderId() {
        return repairOrderId;
    }

    public void setRepairOrderId(Long repairOrderId) {
        this.repairOrderId = repairOrderId;
    }

    public Integer getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(Integer newStatus) {
        this.newStatus = newStatus;
    }

    public String getNewQualityStatus() {
        return newQualityStatus;
    }

    public void setNewQualityStatus(String newQualityStatus) {
        this.newQualityStatus = newQualityStatus;
    }

    public Long getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(Long operatorId) {
        this.operatorId = operatorId;
    }

    public String getOperateRemark() {
        return operateRemark;
    }

    public void setOperateRemark(String operateRemark) {
        this.operateRemark = operateRemark;
    }
}
