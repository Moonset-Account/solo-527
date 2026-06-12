package com.finance.approval.controller;

import com.finance.approval.dto.ApiResponse;
import com.finance.approval.dto.ConfigRequest;
import com.finance.approval.entity.ApprovalConfig;
import com.finance.approval.enums.ConfigType;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ApprovalConfigRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/configs")
@RequiredArgsConstructor
public class ApprovalConfigController {

    private final ApprovalConfigRepository approvalConfigRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<List<ApprovalConfig>> getAllConfigs() {
        List<ApprovalConfig> configs = approvalConfigRepository.findAll();
        return ApiResponse.success(configs);
    }

    @GetMapping("/type/{configType}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<ApprovalConfig>> getConfigsByType(@PathVariable String configType) {
        ConfigType type = ConfigType.valueOf(configType);
        List<ApprovalConfig> configs = approvalConfigRepository.findByConfigTypeAndEnabled(type, true);
        return ApiResponse.success(configs);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<ApprovalConfig> createConfig(@Valid @RequestBody ConfigRequest request) {
        if (approvalConfigRepository.findByConfigTypeAndConfigKey(request.getConfigType(), request.getConfigKey()).isPresent()) {
            throw new BusinessException("该配置键已存在");
        }

        ApprovalConfig config = ApprovalConfig.builder()
                .configType(request.getConfigType())
                .configKey(request.getConfigKey())
                .configValue(request.getConfigValue())
                .description(request.getDescription())
                .enabled(true)
                .sortOrder(0)
                .build();

        config = approvalConfigRepository.save(config);
        return ApiResponse.success(config);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<ApprovalConfig> updateConfig(
            @PathVariable Long id,
            @Valid @RequestBody ConfigRequest request) {
        ApprovalConfig config = approvalConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException("配置不存在"));

        if (!config.getConfigKey().equals(request.getConfigKey()) &&
                approvalConfigRepository.findByConfigTypeAndConfigKey(request.getConfigType(), request.getConfigKey()).isPresent()) {
            throw new BusinessException("该配置键已存在");
        }

        config.setConfigType(request.getConfigType());
        config.setConfigKey(request.getConfigKey());
        config.setConfigValue(request.getConfigValue());
        config.setDescription(request.getDescription());

        config = approvalConfigRepository.save(config);
        return ApiResponse.success(config);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<Void> deleteConfig(@PathVariable Long id) {
        ApprovalConfig config = approvalConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException("配置不存在"));

        approvalConfigRepository.delete(config);
        return ApiResponse.success();
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<ApprovalConfig> toggleConfig(@PathVariable Long id) {
        ApprovalConfig config = approvalConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException("配置不存在"));

        config.setEnabled(!config.getEnabled());
        config = approvalConfigRepository.save(config);
        return ApiResponse.success(config);
    }
}
