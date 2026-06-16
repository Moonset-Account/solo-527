package com.rider.analyzer.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DashboardStatsDTO {

    private Long totalOrders;
    private Long signedOrders;
    private Long timeoutOrders;
    private BigDecimal settlementAccuracy;
    private Long exceptionCount;
}
