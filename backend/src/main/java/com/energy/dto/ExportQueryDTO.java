package com.energy.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ExportQueryDTO {
    private String operator;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String exportType;
    private Integer page = 0;
    private Integer size = 20;
}
