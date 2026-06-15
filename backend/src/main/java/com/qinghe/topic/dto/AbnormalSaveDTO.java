package com.qinghe.topic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AbnormalSaveDTO {
    private Long id;
    @NotBlank(message = "异常标题不能为空")
    private String title;
    private Long businessId;
    private String businessType;
    private String businessName;
    @NotNull(message = "异常类型不能为空")
    private Integer abnormalType;
    private String abnormalTypeName;
    @NotBlank(message = "异常描述不能为空")
    private String description;
    private String evidence;
    private Long reporterId;
    private String reporterName;
    private Integer status;
}
