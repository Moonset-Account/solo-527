package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("inspection_record")
public class InspectionRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String recordNo;

    private Long pointId;

    private Long inspectorId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime checkTime;

    private String status;

    private String abnormalDescription;

    private Integer isHandled;

    private String handleRemark;

    private Long relatedOrderId;

    private BigDecimal locationLng;

    private BigDecimal locationLat;

    @TableField(fill = FieldFill.INSERT)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @TableField(exist = false)
    private String pointName;

    @TableField(exist = false)
    private String pointLocation;

    @TableField(exist = false)
    private String inspectorName;
}
