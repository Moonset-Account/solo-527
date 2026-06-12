package com.finance.approval.service;

import com.finance.approval.audit.AuditOperation;
import com.finance.approval.dto.ConfigRequest;
import com.finance.approval.entity.ApprovalConfig;
import com.finance.approval.enums.ConfigType;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ApprovalConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ApprovalConfigService {

    private final ApprovalConfigRepository approvalConfigRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CONFIG_CACHE_PREFIX = "config:";
    private static final String CONFIG_TYPE_CACHE_PREFIX = "config_type:";
    private static final String ALL_CONFIGS_CACHE_KEY = "all_configs";

    @Transactional(readOnly = true)
    public List<ApprovalConfig> getConfigsByType(ConfigType configType) {
        String cacheKey = CONFIG_TYPE_CACHE_PREFIX + configType;
        @SuppressWarnings("unchecked")
        List<ApprovalConfig> configs = (List<ApprovalConfig>) redisTemplate.opsForValue().get(cacheKey);
        if (configs != null) {
            return configs;
        }
        configs = approvalConfigRepository.findByConfigTypeAndEnabled(configType, true);
        redisTemplate.opsForValue().set(cacheKey, configs, 1, TimeUnit.HOURS);
        return configs;
    }

    @Transactional(readOnly = true)
    public Page<ApprovalConfig> getAllConfigs(Pageable pageable) {
        return approvalConfigRepository.findAllByOrderByConfigTypeAscSortOrderAsc(pageable);
    }

    @Transactional
    @AuditOperation(module = "系统配置", operation = "创建配置")
    public ApprovalConfig createConfig(ConfigRequest request) {
        if (approvalConfigRepository.existsByConfigTypeAndConfigKey(
                request.getConfigType(), request.getConfigKey())) {
            throw new BusinessException("配置键已存在");
        }

        ApprovalConfig config = ApprovalConfig.builder()
                .configType(request.getConfigType())
                .configKey(request.getConfigKey())
                .configValue(request.getConfigValue())
                .description(request.getDescription())
                .enabled(true)
                .sortOrder(0)
                .build();

        ApprovalConfig savedConfig = approvalConfigRepository.save(config);
        clearConfigCache();
        return savedConfig;
    }

    @Transactional
    @AuditOperation(module = "系统配置", operation = "更新配置")
    public ApprovalConfig updateConfig(Long id, ConfigRequest request) {
        ApprovalConfig config = approvalConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException("配置不存在"));

        if (!config.getConfigType().equals(request.getConfigType())
                || !config.getConfigKey().equals(request.getConfigKey())) {
            if (approvalConfigRepository.existsByConfigTypeAndConfigKey(
                    request.getConfigType(), request.getConfigKey())) {
                throw new BusinessException("配置键已存在");
            }
        }

        config.setConfigType(request.getConfigType());
        config.setConfigKey(request.getConfigKey());
        config.setConfigValue(request.getConfigValue());
        config.setDescription(request.getDescription());

        ApprovalConfig updatedConfig = approvalConfigRepository.save(config);
        clearConfigCache();
        return updatedConfig;
    }

    @Transactional
    @AuditOperation(module = "系统配置", operation = "删除配置")
    public void deleteConfig(Long id) {
        if (!approvalConfigRepository.existsById(id)) {
            throw new BusinessException("配置不存在");
        }
        approvalConfigRepository.deleteById(id);
        clearConfigCache();
    }

    @Transactional
    @AuditOperation(module = "系统配置", operation = "切换配置状态")
    public void toggleConfigStatus(Long id, boolean enabled) {
        ApprovalConfig config = approvalConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException("配置不存在"));
        config.setEnabled(enabled);
        approvalConfigRepository.save(config);
        clearConfigCache();
    }

    private void clearConfigCache() {
        redisTemplate.delete(ALL_CONFIGS_CACHE_KEY);
        for (ConfigType type : ConfigType.values()) {
            redisTemplate.delete(CONFIG_TYPE_CACHE_PREFIX + type);
        }
    }
}
