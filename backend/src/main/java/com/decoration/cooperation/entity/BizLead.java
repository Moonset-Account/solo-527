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
@TableName("biz_lead")
public class BizLead extends BaseEntity {
    private String leadNo;
    private Long customerId;
    private String source;
    private String sourceDetail;
    private String projectName;
    private String decorationType;
    private BigDecimal houseArea;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private String city;
    private String district;
    private String community;
    private LocalDate expectStartDate;
    private Long ownerId;
    private String status;
    private String followStage;
    private Integer importance;
    private Integer conflictFlag;
    private String conflictWithIds;
    private LocalDate predictDealDate;
    private Integer predictDealRate;
    private String remark;
    private LocalDateTime assignTime;
    private LocalDateTime lastFollowTime;
    private LocalDateTime nextFollowTime;
}
