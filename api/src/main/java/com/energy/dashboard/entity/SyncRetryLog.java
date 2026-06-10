package com.energy.dashboard.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sync_retry_log")
public class SyncRetryLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("sync_task_id")
    private Long syncTaskId;

    @TableField("retry_at")
    private LocalDateTime retryAt;

    private Boolean success;

    private String message;
}
