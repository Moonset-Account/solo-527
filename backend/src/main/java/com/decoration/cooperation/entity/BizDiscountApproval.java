package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.decoration.cooperation.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("biz_discount_approval")
public class BizDiscountApproval extends BaseEntity {
    private String approvalNo;
    private Long contractId;
    private Long leadId;
    private Long applicantId;
    private BigDecimal originalPrice;
    private BigDecimal requestDiscountRate;
    private BigDecimal requestDiscountAmount;
    private BigDecimal requestFinalPrice;
    private String reason;
    private Long currentApproverId;
    private Integer approvalLevel;
    private String status;
    private LocalDateTime approveTime;
    private LocalDateTime submitTime;
    private String remark;
}
