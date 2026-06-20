package com.carcore.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class BatchOperationDTO {

    @NotBlank(message = "操作类型不能为空")
    private String operationType;

    @NotBlank(message = "操作名称不能为空")
    private String operationName;

    @NotBlank(message = "目标类型不能为空")
    private String targetType;

    @NotNull(message = "目标ID列表不能为空")
    private List<Long> targetIds;

    private String operationDetail;

    @NotNull(message = "操作人ID不能为空")
    private Long operatorId;

    public String getOperationType() {
        return operationType;
    }

    public void setOperationType(String operationType) {
        this.operationType = operationType;
    }

    public String getOperationName() {
        return operationName;
    }

    public void setOperationName(String operationName) {
        this.operationName = operationName;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public List<Long> getTargetIds() {
        return targetIds;
    }

    public void setTargetIds(List<Long> targetIds) {
        this.targetIds = targetIds;
    }

    public String getOperationDetail() {
        return operationDetail;
    }

    public void setOperationDetail(String operationDetail) {
        this.operationDetail = operationDetail;
    }

    public Long getOperatorId() {
        return operatorId;
    }

    public void setOperatorId(Long operatorId) {
        this.operatorId = operatorId;
    }
}
