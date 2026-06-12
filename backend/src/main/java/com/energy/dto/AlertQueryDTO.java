package com.energy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AlertQueryDTO {
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String assignee;
    private String alertType;
    private String alertLevel;
    private Integer page = 0;
    private Integer size = 20;
}
