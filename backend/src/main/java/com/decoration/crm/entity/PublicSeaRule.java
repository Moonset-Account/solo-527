package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("public_sea_rule")
public class PublicSeaRule {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String ruleName;
    private String ruleType;
    private Integer daysBeforePublic;
    private String description;
    private Boolean enabled;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
