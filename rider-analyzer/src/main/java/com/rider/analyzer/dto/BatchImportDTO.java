package com.rider.analyzer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BatchImportDTO {

    @NotBlank(message = "导入类型不能为空")
    private String type;

    private Object file;
}
