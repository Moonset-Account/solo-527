package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Data
@TableName("expense_record")
public class ExpenseRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String expenseNo;

    private Long workOrderId;

    private String expenseType;

    private BigDecimal amount;

    private String description;

    private Long payerId;

    private String payStatus;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime payTime;

    private String payMethod;

    private Long operatorId;

    private String remark;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableField(exist = false)
    private String orderNo;

    @TableField(exist = false)
    private String payerName;

    @TableField(exist = false)
    private String operatorName;
}
