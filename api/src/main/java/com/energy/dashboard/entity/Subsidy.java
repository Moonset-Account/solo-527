package com.energy.dashboard.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("subsidy")
public class Subsidy {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String type;

    private BigDecimal amount;

    @TableField("source_document_no")
    private String sourceDocumentNo;

    private String remark;

    @TableField("created_by")
    private String createdBy;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("approved_by")
    private String approvedBy;

    @TableField("approved_at")
    private LocalDateTime approvedAt;

    private String status;
}
