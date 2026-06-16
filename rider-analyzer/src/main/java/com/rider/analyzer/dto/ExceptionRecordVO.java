package com.rider.analyzer.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExceptionRecordVO {

    private Long id;
    private Long orderId;
    private String orderNo;
    private String type;
    private String typeLabel;
    private String description;
    private String tempAnomalyReason;
    private Integer handleDurationMin;
    private String handlerName;
    private String status;
    private String statusLabel;
    private LocalDateTime createTime;
    private LocalDateTime resolveTime;
}
