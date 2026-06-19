package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.decoration.cooperation.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("biz_contract")
public class BizContract extends BaseEntity {
    private String contractNo;
    private Long leadId;
    private Long customerId;
    private String contractName;
    private String contractType;
    private BigDecimal originalPrice;
    private BigDecimal discountRate;
    private BigDecimal discountAmount;
    private BigDecimal finalPrice;
    private String paymentTerms;
    private Integer projectCycle;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private LocalDate signDate;
    private LocalDate effectiveDate;
    private Long ownerId;
    private Long approverId;
    private String approvalRemark;
    private LocalDateTime approvalTime;
    private String remark;
}
