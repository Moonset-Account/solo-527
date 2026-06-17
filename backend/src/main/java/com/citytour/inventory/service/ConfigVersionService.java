package com.citytour.inventory.service;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.entity.ConfigVersion;
import com.citytour.inventory.repository.ConfigVersionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConfigVersionService {

    private final ConfigVersionRepository configVersionRepository;
    private final ObjectMapper objectMapper;

    public PageResult<ConfigVersion> list(int page, int size, String configType,
                                          String configKey, String status) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "versionNo"));
        Page<ConfigVersion> result = configVersionRepository.findByConditions(
                configType, configKey, status, pageRequest);
        return new PageResult<>(result.getContent(), result.getTotalElements(), page, size);
    }

    public ConfigVersion getById(Long id) {
        return configVersionRepository.findById(id).orElse(null);
    }

    public List<ConfigVersion> getVersions(String configType, String configKey) {
        return configVersionRepository.findByConfigTypeAndConfigKeyOrderByVersionNoDesc(configType, configKey);
    }

    public ConfigVersion getActiveConfig(String configType, String configKey) {
        return configVersionRepository.findActiveConfig(configType, configKey, LocalDateTime.now()).orElse(null);
    }

    public <T> T getActiveConfigValue(String configType, String configKey, Class<T> clazz) {
        ConfigVersion config = getActiveConfig(configType, configKey);
        if (config == null || config.getConfigValue() == null) {
            return null;
        }
        try {
            return objectMapper.readValue(config.getConfigValue(), clazz);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    @Transactional
    public ConfigVersion createVersion(ConfigVersion config, String operator) {
        List<ConfigVersion> existing = configVersionRepository
                .findByConfigTypeAndConfigKeyOrderByVersionNoDesc(config.getConfigType(), config.getConfigKey());

        int nextVersion = existing.isEmpty() ? 1 : existing.get(0).getVersionNo() + 1;
        config.setVersionNo(nextVersion);
        config.setCreatedBy(operator);

        if ("ACTIVE".equals(config.getStatus())) {
            for (ConfigVersion old : existing) {
                if ("ACTIVE".equals(old.getStatus())) {
                    old.setStatus("INACTIVE");
                    old.setEffectEndTime(config.getEffectStartTime());
                    old.setUpdatedBy(operator);
                    configVersionRepository.save(old);
                }
            }
        }

        return configVersionRepository.save(config);
    }

    @Transactional
    public ConfigVersion updateStatus(Long id, String status, String operator) {
        ConfigVersion config = configVersionRepository.findById(id).orElseThrow();
        config.setStatus(status);
        config.setUpdatedBy(operator);

        if ("ACTIVE".equals(status)) {
            List<ConfigVersion> versions = configVersionRepository
                    .findByConfigTypeAndConfigKeyOrderByVersionNoDesc(config.getConfigType(), config.getConfigKey());
            for (ConfigVersion v : versions) {
                if (!v.getId().equals(id) && "ACTIVE".equals(v.getStatus())) {
                    v.setStatus("INACTIVE");
                    v.setEffectEndTime(LocalDateTime.now());
                    v.setUpdatedBy(operator);
                    configVersionRepository.save(v);
                }
            }
            config.setEffectStartTime(LocalDateTime.now());
        }

        return configVersionRepository.save(config);
    }

    @Transactional
    public void delete(Long id) {
        configVersionRepository.deleteById(id);
    }
}
