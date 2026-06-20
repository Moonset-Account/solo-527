package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.property.workorder.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("work_order_visit")
public class WorkOrderVisit extends BaseEntity {
    private Long workOrderId;
    private Long visitedBy;
    private LocalDateTime visitedAt;
    private String visitResult;
    private Integer residentSatisfied;
    private Integer needFollowUp;
    private String followUpNote;
}
