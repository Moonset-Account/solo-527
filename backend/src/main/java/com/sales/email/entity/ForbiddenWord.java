package com.sales.email.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("forbidden_word")
public class ForbiddenWord implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String word;

    private String category;

    private String riskLevel;

    private String replacement;

    private Integer enabled;

    private Long operatorId;

    private String operatorName;

    private String operatorRemark;

    private String sourceOrderNo;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
