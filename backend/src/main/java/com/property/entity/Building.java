package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;


@Data
@TableName("building")
public class Building {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String buildingNo;

    private String buildingName;

    private Integer totalFloors;

    private String description;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableLogic
    private Integer deleted;
}
