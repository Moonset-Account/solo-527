package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.property.workorder.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("fee_bill")
public class FeeBill extends BaseEntity {
    private String billNo;
    private Long residentId;
    private String buildingNo;
    private String roomNo;
    private String feeType;
    private String billPeriod;
    private LocalDate billDate;
    private LocalDate dueDate;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String status;
    private String details;
    private String remark;
}
