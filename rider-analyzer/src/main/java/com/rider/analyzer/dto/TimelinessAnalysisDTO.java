package com.rider.analyzer.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class TimelinessAnalysisDTO {

    private String nodeType;
    private String nodeLabel;
    private Long timeoutCount;
    private Double avgTimeoutMinutes;
    private BigDecimal timeoutRate;
}
