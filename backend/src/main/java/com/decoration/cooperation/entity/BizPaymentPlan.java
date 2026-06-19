package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.decoration.cooperation.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("biz_payment_plan")
public class BizPaymentPlan extends BaseEntity {
    private Long contractId;
    private Long leadId;
    private Integer periodNo;
    private String periodName;
    private BigDecimal paymentRatio;
    private BigDecimal planAmount;
    private BigDecimal actualAmount;
    private LocalDate planDate;
    private LocalDate actualDate;
    private String status;
    private Long collectorId;
    private String remark;
}
