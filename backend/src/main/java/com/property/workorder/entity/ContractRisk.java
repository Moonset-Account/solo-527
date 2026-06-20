package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.property.workorder.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("contract_risk")
public class ContractRisk extends BaseEntity {
    private String riskNo;
    private String title;
    private String description;
    private String riskType;
    private String level;
    private String status;
    private String affectedObjects;
    private Long personInCharge;
    private String closingCondition;
    private LocalDateTime discoveredAt;
    private LocalDate expectedCloseDate;
    private LocalDate actualCloseDate;
    private String mitigationMeasures;
    private String remark;
}
