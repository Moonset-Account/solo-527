package com.finance.approval.dto;

import com.finance.approval.enums.ConfigType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConfigRequest {

    @NotNull(message = "配置类型不能为空")
    private ConfigType configType;

    @NotBlank(message = "配置键不能为空")
    private String configKey;

    @NotBlank(message = "配置值不能为空")
    private String configValue;

    private String description;
}
