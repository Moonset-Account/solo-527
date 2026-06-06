package com.ceramic.kiln.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DamageClaimCreateDTO {
    @NotNull(message = "作品ID不能为空")
    private Long artworkId;
    @NotBlank(message = "破损类型不能为空")
    private String damageType;
    private String damageDescription;
    @NotBlank(message = "赔付类型不能为空")
    private String compensationType;
    private BigDecimal compensationAmount;
}
