package com.sales.email.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("email_draft")
public class EmailDraft implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String draftNo;

    private String subject;

    private String recipient;

    private String cc;

    private String bcc;

    private String content;

    private String sourceOrderNo;

    private String sourceType;

    private Long agentId;

    private String agentName;

    private Long supervisorId;

    private String supervisorName;

    private Integer currentVersion;

    private String status;

    private Long promptVersionId;

    private String riskHitReasons;

    private String riskLevel;

    private String remark;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
