package com.sales.email.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("email_review")
public class EmailReview implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long draftId;

    private String draftNo;

    private Integer version;

    private Long reviewerId;

    private String reviewerName;

    private String reviewType;

    private String reviewResult;

    private BigDecimal aiRiskScore;

    private String forbiddenWordsHit;

    private String reviewComment;

    private Integer reminderSent;

    private String sourceOrderNo;

    private String operatorRemark;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
