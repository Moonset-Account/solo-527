package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.property.workorder.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("work_order")
public class WorkOrder extends BaseEntity {
    private String orderNo;
    private Long residentId;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private String buildingNo;
    private String roomNo;
    private String contactName;
    private String contactPhone;
    private LocalDateTime appointmentTime;
    private String images;
    private Long assignedTo;
    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;
    private LocalDateTime closedAt;
    private BigDecimal actualCost;
    private String remark;
}
