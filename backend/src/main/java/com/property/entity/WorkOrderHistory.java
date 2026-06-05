package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("work_order_history")
public class WorkOrderHistory {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long workOrderId;

    private String operation;

    private String oldStatus;

    private String newStatus;

    private Long operatorId;

    private String operatorName;

    private String remark;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
