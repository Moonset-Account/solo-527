package com.energy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EnergyQueryDTO {
    private String area;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String granularity;
}
