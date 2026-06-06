package com.ceramic.kiln.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class KilnRunCreateDTO {
    @NotNull(message = "窑炉ID不能为空")
    private Long kilnId;
    @NotNull(message = "烧成曲线ID不能为空")
    private Long firingCurveId;
    @NotNull(message = "温区不能为空")
    private String temperatureZone;
    private LocalDateTime scheduledStartTime;
    @NotNull(message = "最大容量不能为空")
    private Integer maxCapacity;
    private String notes;
}
