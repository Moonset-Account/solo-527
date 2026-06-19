package com.decoration.cooperation.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("biz_operation_log")
public class BizOperationLog {
    private Long id;
    private String bizType;
    private Long bizId;
    private String operationType;
    private String operationContent;
    private Long operatorId;
    private String operatorName;
    private String beforeData;
    private String afterData;
    private Long processDuration;
    private LocalDateTime createTime;
}
