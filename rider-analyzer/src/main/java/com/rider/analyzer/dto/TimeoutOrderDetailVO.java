package com.rider.analyzer.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TimeoutOrderDetailVO {

    private Long id;
    private String orderNo;
    private String nodeType;
    private String nodeLabel;
    private LocalDateTime planTime;
    private LocalDateTime actualTime;
    private Long timeoutMinutes;
    private String reason;
}
