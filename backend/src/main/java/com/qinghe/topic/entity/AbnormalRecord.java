package com.qinghe.topic.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("abnormal_record")
public class AbnormalRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String title;
    private Long businessId;
    private String businessType;
    private String businessName;
    private Integer abnormalType;
    private String abnormalTypeName;
    private String description;
    private String evidence;
    private Long reporterId;
    private String reporterName;
    private Integer status;
    private String conclusion;
    private Long handlerId;
    private String handlerName;
    private LocalDateTime handleTime;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer deleted;
}
