package com.rider.analyzer.dto;

import lombok.Data;

import java.util.List;

@Data
public class SettlementAccuracyVO {

    private List<String> dates;
    private List<Double> values;
}
