package com.rider.analyzer.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FulfillmentDataVO {

    private LocalDate date;
    private String dateStr;
    private Long stationId;
    private String stationName;
    private Long totalOrders;
    private Long fulfilledOrders;
    private BigDecimal fulfillmentRate;
    private Double avgDeliveryMinutes;
}
