package com.energy.dashboard.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sync_task")
public class SyncTask {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String type;

    @TableField("meter_id")
    private Long meterId;

    private String status;

    @TableField("triggered_at")
    private LocalDateTime triggeredAt;

    @TableField("completed_at")
    private LocalDateTime completedAt;

    private Long duration;

    @TableField("fail_reason")
    private String failReason;

    @TableField("friendly_fail_reason")
    private String friendlyFailReason;

    @TableField("fail_category")
    private String failCategory;

    @TableField("retry_count")
    private Integer retryCount;

    @TableField("created_at")
    private LocalDateTime createdAt;
}
