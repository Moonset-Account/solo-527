package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.property.workorder.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("payment_record")
public class PaymentRecord extends BaseEntity {
    private String paymentNo;
    private Long billId;
    private Long residentId;
    private BigDecimal amount;
    private String method;
    private String transactionNo;
    private Integer status;
    private LocalDateTime paidAt;
    private Long operatorId;
    private String remark;
    private String callbackData;
}
