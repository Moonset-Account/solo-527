package com.ceramic.kiln.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ExternalArtworkSubmitDTO {
    @NotBlank(message = "学员姓名不能为空")
    private String studentName;
    @NotBlank(message = "学员手机号不能为空")
    private String studentPhone;
    private String studentEmail;
    @NotBlank(message = "泥料编码不能为空")
    private String clayCode;
    private String glazeCode;
    private String name;
    private String description;
    private BigDecimal weight;
}
