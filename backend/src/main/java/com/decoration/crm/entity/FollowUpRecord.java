package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("follow_up_record")
public class FollowUpRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long leadId;
    private String followType;
    private String content;
    private LocalDateTime nextFollowTime;
    private LocalDateTime followTime;
    private Long followBy;
    private String status;
    private Integer durationMinutes;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(exist = false)
    private String followerName;
}
