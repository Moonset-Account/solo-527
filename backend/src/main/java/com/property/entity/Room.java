package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Data
@TableName("room")
public class Room {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long buildingId;

    private String roomNo;

    private Integer floor;

    private BigDecimal area;

    private String roomType;

    private Long ownerId;

    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;

    @TableField(exist = false)
    private String buildingNo;

    @TableField(exist = false)
    private String buildingName;

    @TableField(exist = false)
    private String ownerName;
}
