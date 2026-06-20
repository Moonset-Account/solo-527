package com.datagrowth.portal.service;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.AnomalyRecord;
import com.datagrowth.portal.repository.AnomalyRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AnomalyService {

    private final AnomalyRecordRepository anomalyRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "anomaly:";
    private static final long CACHE_TTL = 30;

    public ApiResponse<Page<AnomalyRecord>> getAnomalyList(
        String severity, String status, String metricName, 
        LocalDateTime startTime, LocalDateTime endTime, Pageable pageable
    ) {
        Page<AnomalyRecord> result;
        
        if (startTime != null && endTime != null) {
            result = anomalyRepository.findByAnomalyTimeBetween(startTime, endTime, pageable);
        } else if (severity != null) {
            result = anomalyRepository.findBySeverityIn(List.of(severity), pageable);
        } else if (status != null) {
            result = anomalyRepository.findByStatusIn(List.of(status), pageable);
        } else if (metricName != null) {
            result = anomalyRepository.findByMetricNameContaining(metricName, pageable);
        } else {
            result = anomalyRepository.findAll(pageable);
        }
        
        return ApiResponse.success(result);
    }

    public ApiResponse<AnomalyRecord> getAnomalyDetail(Long id) {
        String cacheKey = CACHE_PREFIX + "detail:" + id;
        AnomalyRecord cached = (AnomalyRecord) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return ApiResponse.success(cached);
        }
        
        return anomalyRepository.findById(id)
            .map(record -> {
                redisTemplate.opsForValue().set(cacheKey, record, CACHE_TTL, TimeUnit.MINUTES);
                return ApiResponse.success(record);
            })
            .orElse(ApiResponse.error("异常记录不存在"));
    }

    public ApiResponse<AnomalyRecord> handleAnomaly(Long id, String handledBy) {
        return anomalyRepository.findById(id)
            .map(record -> {
                record.setStatus("HANDLING");
                record.setHandledBy(handledBy);
                record.setHandledAt(LocalDateTime.now());
                AnomalyRecord saved = anomalyRepository.save(record);
                redisTemplate.delete(CACHE_PREFIX + "detail:" + id);
                redisTemplate.delete(CACHE_PREFIX + "stats");
                return ApiResponse.success("已标记为处理中", saved);
            })
            .orElse(ApiResponse.error("异常记录不存在"));
    }

    public ApiResponse<AnomalyRecord> resolveAnomaly(Long id, String handledBy, String remark) {
        return anomalyRepository.findById(id)
            .map(record -> {
                record.setStatus("RESOLVED");
                record.setHandledBy(handledBy);
                record.setHandledAt(LocalDateTime.now());
                if (remark != null && record.getSuggestion() != null) {
                    record.setSuggestion(record.getSuggestion() + "\n处理备注: " + remark);
                }
                AnomalyRecord saved = anomalyRepository.save(record);
                redisTemplate.delete(CACHE_PREFIX + "detail:" + id);
                redisTemplate.delete(CACHE_PREFIX + "stats");
                return ApiResponse.success("异常已解决", saved);
            })
            .orElse(ApiResponse.error("异常记录不存在"));
    }

    public ApiResponse<Map<String, Object>> getAnomalyStats() {
        String cacheKey = CACHE_PREFIX + "stats";
        @SuppressWarnings("unchecked")
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return ApiResponse.success(cached);
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("pending", anomalyRepository.countByStatus("PENDING"));
        stats.put("handling", anomalyRepository.countByStatus("HANDLING"));
        stats.put("resolved", anomalyRepository.countByStatus("RESOLVED"));
        
        List<Object[]> severityCounts = anomalyRepository.countBySeverityAndUnresolved();
        Map<String, Long> severityStats = new HashMap<>();
        for (Object[] row : severityCounts) {
            severityStats.put((String) row[0], (Long) row[1]);
        }
        stats.put("bySeverity", severityStats);
        
        redisTemplate.opsForValue().set(cacheKey, stats, 5, TimeUnit.MINUTES);
        
        return ApiResponse.success(stats);
    }

    public ApiResponse<AnomalyRecord> createAnomaly(AnomalyRecord record) {
        record.setStatus("PENDING");
        record.setCreatedAt(LocalDateTime.now());
        AnomalyRecord saved = anomalyRepository.save(record);
        redisTemplate.delete(CACHE_PREFIX + "stats");
        return ApiResponse.success("异常记录已创建", saved);
    }
}
