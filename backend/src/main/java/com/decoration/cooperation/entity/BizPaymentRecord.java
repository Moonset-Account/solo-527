package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.decoration.cooperation.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("biz_payment_record")
public class BizPaymentRecord extends BaseEntity {
    private Long paymentPlanId;
    private Long contractId;
    private BigDecimal amount;
    private String paymentMethod;
    private LocalDate paymentDate;
    private String payer;
    private Long collectorId;
    private String collectorName;
    private String voucherNo;
    private String remark;
}
