package com.datagrowth.portal.service;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.DimensionConfig;
import com.datagrowth.portal.repository.DimensionConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class DimensionService {

    private final DimensionConfigRepository dimensionRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "dimension:";

    public ApiResponse<Page<DimensionConfig>> getDimensionList(
        String dimensionName, Boolean enabled, Pageable pageable
    ) {
        Page<DimensionConfig> result;
        
        if (dimensionName != null) {
            result = dimensionRepository.findByDimensionNameContaining(dimensionName, pageable);
        } else if (enabled != null) {
            result = dimensionRepository.findByEnabled(enabled, pageable);
        } else {
            result = dimensionRepository.findAll(pageable);
        }
        
        return ApiResponse.success(result);
    }

    @SuppressWarnings("unchecked")
    public ApiResponse<List<DimensionConfig>> getEnabledDimensions() {
        String cacheKey = CACHE_PREFIX + "enabled";
        List<DimensionConfig> cached = (List<DimensionConfig>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return ApiResponse.success(cached);
        }
        
        List<DimensionConfig> result = dimensionRepository.findByEnabledTrue();
        redisTemplate.opsForValue().set(cacheKey, result, 1, TimeUnit.HOURS);
        
        return ApiResponse.success(result);
    }

    public ApiResponse<DimensionConfig> getDimensionDetail(Long id) {
        return dimensionRepository.findById(id)
            .map(ApiResponse::success)
            .orElse(ApiResponse.error("维度配置不存在"));
    }

    public ApiResponse<DimensionConfig> createDimension(DimensionConfig config) {
        config.setEnabled(true);
        DimensionConfig saved = dimensionRepository.save(config);
        clearCache();
        return ApiResponse.success("维度配置已创建", saved);
    }

    public ApiResponse<DimensionConfig> updateDimension(Long id, DimensionConfig config) {
        return dimensionRepository.findById(id)
            .map(existing -> {
                existing.setDimensionCode(config.getDimensionCode());
                existing.setDimensionName(config.getDimensionName());
                existing.setDimensionType(config.getDimensionType());
                existing.setDimensionValues(config.getDimensionValues());
                existing.setEffectiveCondition(config.getEffectiveCondition());
                existing.setEnabled(config.getEnabled());
                existing.setDescription(config.getDescription());
                existing.setUpdatedBy(config.getUpdatedBy());
                DimensionConfig saved = dimensionRepository.save(existing);
                clearCache();
                return ApiResponse.success("维度配置已更新", saved);
            })
            .orElse(ApiResponse.error("维度配置不存在"));
    }

    public ApiResponse<Void> deleteDimension(Long id) {
        if (dimensionRepository.existsById(id)) {
            dimensionRepository.deleteById(id);
            clearCache();
            return ApiResponse.success("维度配置已删除", null);
        }
        return ApiResponse.error("维度配置不存在");
    }

    public ApiResponse<DimensionConfig> toggleDimension(Long id, boolean enabled) {
        return dimensionRepository.findById(id)
            .map(config -> {
                config.setEnabled(enabled);
                DimensionConfig saved = dimensionRepository.save(config);
                clearCache();
                return ApiResponse.success(enabled ? "维度已启用" : "维度已禁用", saved);
            })
            .orElse(ApiResponse.error("维度配置不存在"));
    }

    private void clearCache() {
        redisTemplate.delete(CACHE_PREFIX + "enabled");
    }
}
