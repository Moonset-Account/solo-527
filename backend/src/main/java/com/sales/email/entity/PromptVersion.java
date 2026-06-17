package com.sales.email.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("prompt_version")
public class PromptVersion implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long templateId;

    private String templateCode;

    private Integer version;

    private String promptContent;

    private String variables;

    private String status;

    private Long operatorId;

    private String operatorName;

    private String operatorRemark;

    private String sourceOrderNo;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
