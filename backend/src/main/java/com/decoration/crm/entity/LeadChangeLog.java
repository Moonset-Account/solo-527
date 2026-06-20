package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lead_change_log")
public class LeadChangeLog {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long leadId;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private Long changedBy;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime changedAt;
    private String changeType;

    @TableField(exist = false)
    private String changerName;
}
