package com.energy.dashboard.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("alarm")
public class Alarm {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String type;

    private String level;

    @TableField("meter_id")
    private Long meterId;

    private String message;

    private String status;

    private String assignee;

    @TableField("occurred_at")
    private LocalDateTime occurredAt;

    @TableField("confirmed_at")
    private LocalDateTime confirmedAt;

    @TableField("resolved_at")
    private LocalDateTime resolvedAt;

    @TableField("response_duration")
    private Long responseDuration;

    @TableField("root_cause")
    private String rootCause;

    @TableField("source_document_no")
    private String sourceDocumentNo;

    private String remark;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
