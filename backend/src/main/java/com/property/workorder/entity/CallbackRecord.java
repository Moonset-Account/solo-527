package com.property.workorder.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("callback_record")
public class CallbackRecord implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String callbackId;
    private String callbackType;
    private String businessId;
    private String businessType;
    private String url;
    private String requestBody;
    private String responseBody;
    private String status;
    private Integer retryCount;
    private Integer maxRetries;
    private String failureReason;
    private LocalDateTime lastAttemptAt;
    private LocalDateTime nextRetryAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
