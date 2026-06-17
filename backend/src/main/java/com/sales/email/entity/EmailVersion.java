package com.sales.email.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("email_version")
public class EmailVersion implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long draftId;

    private String draftNo;

    private Integer version;

    private String subject;

    private String recipient;

    private String cc;

    private String bcc;

    private String content;

    private String contentSource;

    private Long promptVersionId;

    private Long operatorId;

    private String operatorName;

    private String changeSummary;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
