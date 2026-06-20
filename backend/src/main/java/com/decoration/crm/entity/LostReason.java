package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lost_reason")
public class LostReason {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String category;
    private Integer sortOrder;
    private Boolean enabled;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
