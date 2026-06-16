package com.rider.analyzer.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExceptionRecordDTO {

    private Long id;
    private Long orderId;
    private String type;
    private String description;
    private String tempAnomalyReason;
    private Integer handleDurationMin;
    private String handlerName;
    private String status;
    private LocalDateTime createTime;
    private LocalDateTime resolveTime;
}
