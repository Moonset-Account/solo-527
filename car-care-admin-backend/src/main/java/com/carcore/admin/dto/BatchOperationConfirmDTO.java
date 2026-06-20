package com.carcore.admin.dto;

import jakarta.validation.constraints.NotNull;

public class BatchOperationConfirmDTO {

    @NotNull(message = "批量操作ID不能为空")
    private Long batchOperationId;

    @NotNull(message = "操作人ID不能为空")
    private Long operatorId;

    private Boolean confirmed = true;

    public Long getBatchOperationId() {
        return batchOperationId;
    }

    public void setBatchOperationId(Long batchOperationId) {
        this.batchOperationId = batchOperationId;
    }

    public Long getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(Long operatorId) {
        this.operatorId = operatorId;
    }

    public Boolean getConfirmed() {
        return confirmed;
    }

    public void setConfirmed(Boolean confirmed) {
        this.confirmed = confirmed;
    }
}
