package com.property.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;


@Data
@TableName("sys_message")
public class SysMessage {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long receiverId;

    private Long senderId;

    private String messageType;

    private String title;

    private String content;

    private String relatedType;

    private Long relatedId;

    private Integer isRead;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime readTime;

    private String priority;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(exist = false)
    private String receiverName;

    @TableField(exist = false)
    private String senderName;
}
