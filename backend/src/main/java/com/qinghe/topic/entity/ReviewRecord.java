package com.qinghe.topic.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("review_record")
public class ReviewRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long businessId;
    private Integer reviewType;
    private String reviewTypeName;
    private Integer version;
    private String beforeContent;
    private String afterContent;
    private String diffContent;
    private String reviewOpinion;
    private Integer reviewResult;
    private Long reviewerId;
    private String reviewerName;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableLogic
    private Integer deleted;
}
