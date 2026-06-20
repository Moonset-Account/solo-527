package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.decoration.crm.handler.PostgreSqlEnumTypeHandler;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName(value = "lead_customer", autoResultMap = true)
public class LeadCustomer {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String customerName;
    private String phone;
    private String gender;
    private Integer age;
    private String address;
    private String community;
    private String houseType;
    private BigDecimal houseArea;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private String decorationStyle;
    private String decorationType;
    private LocalDate moveInDate;
    private String source;
    @TableField(typeHandler = PostgreSqlEnumTypeHandler.class)
    private String status;
    @TableField(typeHandler = PostgreSqlEnumTypeHandler.class)
    private String level;
    private Long ownerId;
    @TableField(typeHandler = PostgreSqlEnumTypeHandler.class)
    private String publicSeaStatus;
    private LocalDateTime publicSeaInTime;
    private Long lostReasonId;
    private String lostRemark;
    private LocalDateTime lostTime;
    private String remark;
    private LocalDateTime nextFollowTime;
    private Integer totalFollowCount;
    private LocalDateTime lastFollowTime;
    private LocalDateTime measureDate;
    private Long measureDesignerId;
    private String measureRemark;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
    @TableLogic
    private LocalDateTime deletedAt;

    @TableField(exist = false)
    private String ownerName;
    @TableField(exist = false)
    private String measureDesignerName;
}
