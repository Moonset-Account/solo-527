package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.property.workorder.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("inspection_task")
public class InspectionTask extends BaseEntity {
    private String taskNo;
    private String title;
    private String description;
    private String inspectionType;
    private String area;
    private LocalDate planDate;
    private Long assigneeId;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String result;
    private String issuesFound;
    private String images;
    private String remark;
}
