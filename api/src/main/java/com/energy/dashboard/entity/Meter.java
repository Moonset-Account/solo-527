package com.energy.dashboard.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("meter")
public class Meter {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("meter_no")
    private String meterNo;

    private String location;

    @TableField("zone_id")
    private Long zoneId;

    private String status;

    @TableField("communication_params")
    private String communicationParams;

    @TableField("source_document_no")
    private String sourceDocumentNo;

    private String remark;

    @TableField("last_sync_time")
    private LocalDateTime lastSyncTime;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
