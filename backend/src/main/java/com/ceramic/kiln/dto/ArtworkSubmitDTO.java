package com.ceramic.kiln.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ArtworkSubmitDTO {
    @NotNull(message = "学员ID不能为空")
    private Long studentId;
    @NotNull(message = "泥料ID不能为空")
    private Long clayId;
    private Long glazeId;
    private String name;
    private String description;
    private BigDecimal weight;
}
