package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lead_tag")
public class LeadTag {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String color;
    private String category;
    private Integer sortOrder;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
