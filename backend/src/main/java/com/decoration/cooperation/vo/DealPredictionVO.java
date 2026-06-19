package com.decoration.cooperation.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class DealPredictionVO {
    private Long totalLeads;
    private Long totalDeals;
    private BigDecimal totalDealAmount;
    private BigDecimal overallDealRate;
    private BigDecimal predictedMonthAmount;
    private BigDecimal predictedQuarterAmount;
    private List<Map<String, Object>> byStage;
    private List<Map<String, Object>> byOwner;
    private List<Map<String, Object>> bySource;
    private List<Map<String, Object>> monthlyTrend;
}
