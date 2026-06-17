package com.approval.workflow.dto;

import lombok.Data;

import java.util.List;

@Data
public class DelayQueryDTO {

    private Long deptId;
    private Long responsibleDeptId;
    private List<Long> responsibleDeptIds;
    private String keyword;
}
