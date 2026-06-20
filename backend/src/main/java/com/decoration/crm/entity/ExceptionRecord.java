package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("exception_record")
public class ExceptionRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long leadId;
    private String exceptionType;
    private String title;
    private String description;
    private String overdueReason;
    private Integer handlingCostMinutes;
    private Long responsibleId;
    private Long handlerId;
    private String status;
    private String priority;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    @TableField(exist = false)
    private String responsibleName;
    @TableField(exist = false)
    private String handlerName;
    @TableField(exist = false)
    private String customerName;
}
