package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("callback_compensation_log")
public class CallbackCompensationLog implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String callbackId;
    private String action;
    private Long operatorId;
    private String operatorName;
    private String note;
    private String beforeData;
    private String afterData;
    private LocalDateTime createdAt;
}
