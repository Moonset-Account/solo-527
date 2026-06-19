package com.decoration.cooperation.vo;

import com.decoration.cooperation.entity.BizPaymentPlan;
import com.decoration.cooperation.entity.BizPaymentRecord;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PaymentProgressVO {
    private Long contractId;
    private String contractNo;
    private String contractName;
    private Long leadId;
    private String leadNo;
    private String projectName;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long ownerId;
    private String ownerName;
    private BigDecimal contractAmount;
    private BigDecimal totalPlanAmount;
    private BigDecimal totalActualAmount;
    private BigDecimal paymentProgress;
    private String conflictExplain;
    private Long processDuration;
    private List<BizPaymentPlan> plans;
    private List<BizPaymentRecord> records;
}
