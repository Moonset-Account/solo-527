package com.qinghe.topic.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("video_data")
public class VideoData {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long scriptId;
    private Long topicId;
    private String videoTitle;
    private String platform;
    private String videoUrl;
    private LocalDate publishDate;
    private Long views;
    private Long likes;
    private Long comments;
    private Long shares;
    private Long favorites;
    private Long clicks;
    private Long conversions;
    private BigDecimal conversionRate;
    private BigDecimal amount;
    private Long creatorId;
    private String creatorName;
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    @TableLogic
    private Integer deleted;
}
