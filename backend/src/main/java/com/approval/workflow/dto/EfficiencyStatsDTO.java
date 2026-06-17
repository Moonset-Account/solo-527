package com.approval.workflow.dto;

import lombok.Data;

@Data
public class EfficiencyStatsDTO {

    private Long deptId;
    private String deptName;
    private Long totalCount;
    private Long approvedCount;
    private Long inProgressCount;
    private Long stuckCount;
    private Double avgNodeDuration;
}
