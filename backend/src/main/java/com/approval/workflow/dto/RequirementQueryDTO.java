package com.approval.workflow.dto;

import com.approval.workflow.enums.RequirementStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RequirementQueryDTO {

    private String keyword;
    private RequirementStatus status;
    private Long deptId;
    private Long creatorId;
    private Long assigneeId;
    private Integer priority;
    private String category;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String sortBy;
    private String sortDirection;
}
