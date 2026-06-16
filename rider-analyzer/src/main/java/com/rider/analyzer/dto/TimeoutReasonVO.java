package com.rider.analyzer.dto;

import lombok.Data;

@Data
public class TimeoutReasonVO {

    private String reason;
    private Long count;
    private Double percentage;
    private String color;
}
