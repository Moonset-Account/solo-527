package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.decoration.cooperation.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("biz_decoration_requirement")
public class BizDecorationRequirement extends BaseEntity {
    private Long leadId;
    private String houseType;
    private String houseStructure;
    private BigDecimal totalArea;
    private BigDecimal usableArea;
    private String floor;
    private Integer totalFloors;
    private String orientation;
    private String decorationStyle;
    private String decorationLevel;
    private String decorationUsage;
    private String styleDescription;
    private String functionalRequirements;
    private String materialPreferences;
    private String colorPreferences;
    private Integer hasElder;
    private Integer hasChild;
    private Integer hasPet;
    private String specialRequirements;
    private String remark;
}
