package com.courselearning.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("user_order")
public class UserOrder implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private String orderNo;

    private Long userId;

    private Long courseId;

    private String orderType;

    private BigDecimal amount;

    private BigDecimal payAmount;

    private Integer payStatus;

    private LocalDateTime payTime;

    private String payMethod;

    private Integer memberDays;

    private Long referrerId;

    private BigDecimal commissionAmount;

    private Integer commissionStatus;

    private String commissionDisputeNote;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
