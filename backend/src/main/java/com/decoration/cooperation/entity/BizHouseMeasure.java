package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.decoration.cooperation.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("biz_house_measure")
public class BizHouseMeasure extends BaseEntity {
    private Long leadId;
    private Long measureUserId;
    private LocalDate measureDate;
    private String actualHouseType;
    private BigDecimal actualTotalArea;
    private String measureData;
    private String roomMeasurements;
    private String wallCondition;
    private String floorCondition;
    private String ceilingCondition;
    private String waterElectricPosition;
    private String pipelineCondition;
    private String loadBearingWalls;
    private String difficultyPoints;
    private String suggestion;
    private String remark;
}
