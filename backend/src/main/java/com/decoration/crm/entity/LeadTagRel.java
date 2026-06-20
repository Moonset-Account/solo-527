package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lead_tag_rel")
public class LeadTagRel {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long leadId;
    private Long tagId;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
