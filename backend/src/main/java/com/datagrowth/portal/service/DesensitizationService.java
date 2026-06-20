package com.datagrowth.portal.service;

import com.datagrowth.portal.entity.DesensitizationConfig;
import com.datagrowth.portal.repository.DesensitizationConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class DesensitizationService {

    private final DesensitizationConfigRepository configRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${data.desensitization.enabled:true}")
    private boolean desensitizationEnabled;

    private static final String CACHE_PREFIX = "desensitization:";

    public Page<DesensitizationConfig> getConfigList(String datasetCode, Boolean enabled, Pageable pageable) {
        if (datasetCode != null) {
            return configRepository.findByDatasetCodeContaining(datasetCode, pageable);
        }
        if (enabled != null) {
            return configRepository.findByEnabled(enabled, pageable);
        }
        return configRepository.findAll(pageable);
    }

    public DesensitizationConfig createConfig(DesensitizationConfig config) {
        DesensitizationConfig saved = configRepository.save(config);
        clearCache(saved.getDatasetCode());
        return saved;
    }

    public DesensitizationConfig updateConfig(Long id, DesensitizationConfig config) {
        return configRepository.findById(id)
            .map(existing -> {
                existing.setDatasetCode(config.getDatasetCode());
                existing.setTableName(config.getTableName());
                existing.setColumnName(config.getColumnName());
                existing.setColumnAlias(config.getColumnAlias());
                existing.setDesensitizationType(config.getDesensitizationType());
                existing.setDesensitizationRule(config.getDesensitizationRule());
                existing.setDataLevel(config.getDataLevel());
                existing.setEffectiveCondition(config.getEffectiveCondition());
                existing.setEnabled(config.getEnabled());
                existing.setDescription(config.getDescription());
                existing.setUpdatedBy(config.getUpdatedBy());
                DesensitizationConfig saved = configRepository.save(existing);
                clearCache(saved.getDatasetCode());
                return saved;
            })
            .orElseThrow(() -> new RuntimeException("配置不存在"));
    }

    public void deleteConfig(Long id) {
        configRepository.findById(id).ifPresent(config -> {
            configRepository.deleteById(id);
            clearCache(config.getDatasetCode());
        });
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> desensitize(String datasetCode, Map<String, Object> data, String userDataLevel) {
        if (!desensitizationEnabled || data == null || data.isEmpty()) {
            return data;
        }

        String cacheKey = CACHE_PREFIX + "config:" + datasetCode;
        List<DesensitizationConfig> configs = (List<DesensitizationConfig>) redisTemplate.opsForValue().get(cacheKey);
        
        if (configs == null) {
            configs = configRepository.findByDatasetCodeAndEnabledTrue(datasetCode);
            redisTemplate.opsForValue().set(cacheKey, configs, 1, TimeUnit.HOURS);
        }

        Map<String, Object> result = new HashMap<>(data);
        
        for (DesensitizationConfig config : configs) {
            if (shouldApplyDesensitization(config, userDataLevel)) {
                String columnName = config.getColumnName();
                if (result.containsKey(columnName)) {
                    Object value = result.get(columnName);
                    if (value instanceof String) {
                        result.put(columnName, applyDesensitization((String) value, config));
                    }
                }
            }
        }

        return result;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> desensitizeList(String datasetCode, List<Map<String, Object>> dataList, String userDataLevel) {
        if (!desensitizationEnabled || dataList == null || dataList.isEmpty()) {
            return dataList;
        }

        String cacheKey = CACHE_PREFIX + "config:" + datasetCode;
        List<DesensitizationConfig> configs = (List<DesensitizationConfig>) redisTemplate.opsForValue().get(cacheKey);
        
        if (configs == null) {
            configs = configRepository.findByDatasetCodeAndEnabledTrue(datasetCode);
            redisTemplate.opsForValue().set(cacheKey, configs, 1, TimeUnit.HOURS);
        }

        final List<DesensitizationConfig> finalConfigs = configs;
        return dataList.stream()
            .map(data -> {
                Map<String, Object> result = new HashMap<>(data);
                for (DesensitizationConfig config : finalConfigs) {
                    if (shouldApplyDesensitization(config, userDataLevel)) {
                        String columnName = config.getColumnName();
                        if (result.containsKey(columnName)) {
                            Object value = result.get(columnName);
                            if (value instanceof String) {
                                result.put(columnName, applyDesensitization((String) value, config));
                            }
                        }
                    }
                }
                return result;
            })
            .toList();
    }

    private boolean shouldApplyDesensitization(DesensitizationConfig config, String userDataLevel) {
        if (!config.getEnabled()) {
            return false;
        }
        
        int configLevel = getDataLevelPriority(config.getDataLevel());
        int userLevel = getDataLevelPriority(userDataLevel);
        
        return userLevel < configLevel;
    }

    private int getDataLevelPriority(String level) {
        return switch (level) {
            case "PUBLIC" -> 1;
            case "INTERNAL" -> 2;
            case "SENSITIVE" -> 3;
            case "CONFIDENTIAL" -> 4;
            case "HIGH_SENSITIVE" -> 5;
            default -> 0;
        };
    }

    private String applyDesensitization(String value, DesensitizationConfig config) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        return switch (config.getDesensitizationType()) {
            case "MASK_ALL" -> maskAll(value);
            case "MASK_MIDDLE" -> maskMiddle(value, config.getDesensitizationRule());
            case "MASK_LOCAL" -> maskLocal(value);
            case "ROUND" -> roundValue(value, config.getDesensitizationRule());
            case "HASH" -> hashValue(value);
            default -> value;
        };
    }

    private String maskAll(String value) {
        return "*".repeat(Math.min(value.length(), 10));
    }

    private String maskMiddle(String value, String rule) {
        int start = 3;
        int length = 4;
        char maskChar = '*';

        if (rule != null && !rule.isEmpty()) {
            String[] parts = rule.split(",");
            if (parts.length >= 1) start = Integer.parseInt(parts[0]);
            if (parts.length >= 2) length = Integer.parseInt(parts[1]);
            if (parts.length >= 3) maskChar = parts[2].charAt(0);
        }

        if (value.length() <= start) {
            return maskAll(value);
        }

        int end = Math.min(start + length, value.length());
        StringBuilder sb = new StringBuilder(value);
        for (int i = start; i < end; i++) {
            sb.setCharAt(i, maskChar);
        }
        return sb.toString();
    }

    private String maskLocal(String email) {
        Pattern pattern = Pattern.compile("^(.+)@(.+)$");
        Matcher matcher = pattern.matcher(email);
        if (matcher.matches()) {
            String local = matcher.group(1);
            String domain = matcher.group(2);
            if (local.length() <= 2) {
                return "*".repeat(local.length()) + "@" + domain;
            }
            return local.charAt(0) + "*".repeat(local.length() - 2) + local.charAt(local.length() - 1) + "@" + domain;
        }
        return maskMiddle(email, "1,1,*");
    }

    private String roundValue(String value, String rule) {
        try {
            double num = Double.parseDouble(value);
            int scale = rule != null ? Integer.parseInt(rule) : 0;
            double factor = Math.pow(10, scale);
            return String.valueOf(Math.round(num / factor) * factor);
        } catch (NumberFormatException e) {
            return value;
        }
    }

    private String hashValue(String value) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
            byte[] array = md.digest(value.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : array) {
                sb.append(Integer.toHexString((b & 0xFF) | 0x100).substring(1, 3));
            }
            return sb.substring(0, 8);
        } catch (java.security.NoSuchAlgorithmException e) {
            return maskAll(value);
        }
    }

    private void clearCache(String datasetCode) {
        redisTemplate.delete(CACHE_PREFIX + "config:" + datasetCode);
    }
}
