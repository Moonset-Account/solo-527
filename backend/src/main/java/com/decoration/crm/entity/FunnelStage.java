package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("funnel_stage")
public class FunnelStage {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
    private Integer sortOrder;
    private String color;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
