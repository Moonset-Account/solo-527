package com.energy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ResponseDurationDTO {
    private Long id;
    private Long alertId;
    private String alertNo;
    private String alertType;
    private String alertLevel;
    private String meterName;
    private String area;
    private String handler;
    private String assignee;
    private LocalDateTime alertTime;
    private LocalDateTime assignTime;
    private LocalDateTime handleTime;
    private Integer responseDuration;
    private String handleResult;
    private String handleRemark;
}
