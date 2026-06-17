package com.approval.workflow.dto;

import com.approval.workflow.enums.OperationType;
import lombok.Data;

@Data
public class OperationLogQueryDTO {

    private OperationType operationType;
    private Long operatorId;
    private Long requirementId;
    private String keyword;
}
