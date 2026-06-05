package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("satisfaction")
public class Satisfaction {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long workOrderId;

    private Long ownerId;

    private Integer overallScore;

    private Integer responseSpeedScore;

    private Integer serviceAttitudeScore;

    private Integer qualityScore;

    private String content;

    private Integer isSolved;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(exist = false)
    private String orderNo;

    @TableField(exist = false)
    private String ownerName;
}
