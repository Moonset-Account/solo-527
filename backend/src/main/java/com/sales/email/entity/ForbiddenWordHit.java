package com.sales.email.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("forbidden_word_hit")
public class ForbiddenWordHit implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long draftId;

    private String draftNo;

    private Integer version;

    private Long wordId;

    private String word;

    private String hitPosition;

    private Integer hitCount;

    private String sourceOrderNo;

    private String operatorRemark;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
