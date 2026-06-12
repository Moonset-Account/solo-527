package com.energy.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ValidateResultDTO {
    private Long id;
    private Long meterId;
    private String meterCode;
    private String meterName;
    private String area;
    private LocalDateTime readingTime;
    private BigDecimal activePower;
    private BigDecimal reactivePower;
    private BigDecimal voltage;
    private BigDecimal currentValue;
    private BigDecimal powerFactor;
    private BigDecimal cumulativeEnergy;
    private Boolean isValid;
    private String validateRemark;
}
