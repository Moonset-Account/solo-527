package com.sales.email.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("operation_log")
public class OperationLog implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String operationType;

    private String businessType;

    private String businessId;

    private String sourceOrderNo;

    private Long operatorId;

    private String operatorName;

    private String detail;

    private String remark;

    private String ip;

    @TableLogic
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
