package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("quotation_version")
public class QuotationVersion {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long leadId;
    private String versionNo;
    private BigDecimal totalPrice;
    private BigDecimal designFee;
    private BigDecimal materialFee;
    private BigDecimal laborFee;
    private BigDecimal otherFee;
    private BigDecimal discount;
    private BigDecimal finalPrice;
    private String paymentMethod;
    private Integer constructionPeriod;
    private String remark;
    private Long createdBy;
    private Boolean isCurrent;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableField(exist = false)
    private String creatorName;
}
