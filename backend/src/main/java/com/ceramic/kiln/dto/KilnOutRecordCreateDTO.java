package com.ceramic.kiln.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KilnOutRecordCreateDTO {
    @NotNull(message = "窑次ID不能为空")
    private Long kilnRunId;
    @NotNull(message = "作品ID不能为空")
    private Long artworkId;
    @NotBlank(message = "质量状态不能为空")
    private String qualityStatus;
    private String notes;
}
