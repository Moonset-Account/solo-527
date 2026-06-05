package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("inspection_point")
public class InspectionPoint {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String pointCode;

    private String pointName;

    private String location;

    private String category;

    private String checkItems;

    private String qrCode;

    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
