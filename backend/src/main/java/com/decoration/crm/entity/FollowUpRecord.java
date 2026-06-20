package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.decoration.crm.handler.PostgreSqlEnumTypeHandler;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName(value = "follow_up_record", autoResultMap = true)
public class FollowUpRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long leadId;
    private String followType;
    private String content;
    private LocalDateTime nextFollowTime;
    private LocalDateTime followTime;
    private Long followBy;
    @TableField(typeHandler = PostgreSqlEnumTypeHandler.class)
    private String status;
    private Integer durationMinutes;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(exist = false)
    private String followerName;
}
