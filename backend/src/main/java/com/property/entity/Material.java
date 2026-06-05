package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Data
@TableName("material")
public class Material {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String materialCode;

    private String materialName;

    private String category;

    private String specification;

    private String unit;

    private BigDecimal unitPrice;

    private Integer stockQuantity;

    private String description;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private Integer deleted;
}
