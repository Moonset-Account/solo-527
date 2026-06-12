package com.energy.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class EnergyDataPoint {
    private LocalDateTime time;
    private BigDecimal value;
    private String area;

    public EnergyDataPoint(LocalDateTime time, BigDecimal value) {
        this.time = time;
        this.value = value;
    }

    public EnergyDataPoint(LocalDateTime time, BigDecimal value, String area) {
        this.time = time;
        this.value = value;
        this.area = area;
    }
}
