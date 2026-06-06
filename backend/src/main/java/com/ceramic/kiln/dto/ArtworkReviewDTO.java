package com.ceramic.kiln.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ArtworkReviewDTO {
    @NotNull(message = "审核结果不能为空")
    private Boolean pass;
    private String notes;
}
