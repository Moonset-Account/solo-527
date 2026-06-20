package com.decoration.crm.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lead_attachment")
public class LeadAttachment {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long leadId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String fileType;
    private String category;
    private Long uploadedBy;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(exist = false)
    private String uploaderName;
}
