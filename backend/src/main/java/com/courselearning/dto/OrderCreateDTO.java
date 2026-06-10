package com.courselearning.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderCreateDTO {

    @NotNull(message = "课程ID不能为空")
    private Long courseId;

    private String orderType;

    private BigDecimal amount;

    private Integer memberDays;

    private String payMethod;
}
