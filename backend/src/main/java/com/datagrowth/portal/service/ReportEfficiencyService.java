package com.datagrowth.portal.service;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.ReportEfficiency;
import com.datagrowth.portal.repository.ReportEfficiencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ReportEfficiencyService {

    private final ReportEfficiencyRepository efficiencyRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "efficiency:";

    public ApiResponse<Page<ReportEfficiency>> getEfficiencyList(
        LocalDate startDate, LocalDate endDate, Pageable pageable
    ) {
        Page<ReportEfficiency> result;
        
        if (startDate != null && endDate != null) {
            result = efficiencyRepository.findByStatDateBetween(startDate, endDate, pageable);
        } else {
            result = efficiencyRepository.findAll(pageable);
        }
        
        return ApiResponse.success(result);
    }

    public ApiResponse<List<ReportEfficiency>> getEfficiencyTrend(
        LocalDate startDate, LocalDate endDate
    ) {
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        String cacheKey = CACHE_PREFIX + "trend:" + startDate + ":" + endDate;
        @SuppressWarnings("unchecked")
        List<ReportEfficiency> cached = (List<ReportEfficiency>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return ApiResponse.success(cached);
        }
        
        List<ReportEfficiency> result = efficiencyRepository.findByDateRangeOrderByTime(startDate, endDate);
        redisTemplate.opsForValue().set(cacheKey, result, 30, TimeUnit.MINUTES);
        
        return ApiResponse.success(result);
    }

    public ApiResponse<List<Map<String, Object>>> getEfficiencySummary(
        LocalDate startDate, LocalDate endDate
    ) {
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        String cacheKey = CACHE_PREFIX + "summary:" + startDate + ":" + endDate;
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> cached = (List<Map<String, Object>>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return ApiResponse.success(cached);
        }
        
        List<Object[]> rawResult = efficiencyRepository.findSummaryByDateRange(startDate, endDate);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Object[] row : rawResult) {
            Map<String, Object> item = new HashMap<>();
            item.put("reportName", row[0]);
            item.put("avgGenerationTimeMs", row[1]);
            item.put("totalCount", row[2]);
            result.add(item);
        }
        
        redisTemplate.opsForValue().set(cacheKey, result, 30, TimeUnit.MINUTES);
        
        return ApiResponse.success(result);
    }

    public ApiResponse<Map<String, Object>> getDashboardData(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        String cacheKey = CACHE_PREFIX + "dashboard:" + startDate + ":" + endDate;
        @SuppressWarnings("unchecked")
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return ApiResponse.success(cached);
        }
        
        List<ReportEfficiency> trendData = efficiencyRepository.findByDateRangeOrderByTime(startDate, endDate);
        List<Object[]> summaryData = efficiencyRepository.findSummaryByDateRange(startDate, endDate);
        
        Map<String, Object> result = new HashMap<>();
        
        long totalGenerationCount = 0;
        long totalTimeMs = 0;
        long successCount = 0;
        long failCount = 0;
        double avgTimeTotal = 0;
        int count = 0;
        
        for (ReportEfficiency item : trendData) {
            totalGenerationCount += item.getGenerationCount();
            totalTimeMs += item.getTotalTimeMs() != null ? item.getTotalTimeMs() : 0;
            successCount += item.getSuccessCount() != null ? item.getSuccessCount() : 0;
            failCount += item.getFailCount() != null ? item.getFailCount() : 0;
            avgTimeTotal += item.getAvgGenerationTimeMs();
            count++;
        }
        
        result.put("totalGenerationCount", totalGenerationCount);
        result.put("totalTimeMs", totalTimeMs);
        result.put("avgGenerationTimeMs", count > 0 ? avgTimeTotal / count : 0);
        result.put("successCount", successCount);
        result.put("failCount", failCount);
        result.put("successRate", (successCount + failCount) > 0 
            ? String.format("%.2f", (double) successCount / (successCount + failCount) * 100) 
            : "0.00");
        result.put("trendData", trendData);
        
        List<Map<String, Object>> summaryList = new ArrayList<>();
        for (Object[] row : summaryData) {
            Map<String, Object> item = new HashMap<>();
            item.put("reportName", row[0]);
            item.put("avgGenerationTimeMs", row[1]);
            item.put("totalCount", row[2]);
            summaryList.add(item);
        }
        result.put("byReport", summaryList);
        
        redisTemplate.opsForValue().set(cacheKey, result, 30, TimeUnit.MINUTES);
        
        return ApiResponse.success(result);
    }

    public ApiResponse<ReportEfficiency> recordEfficiency(ReportEfficiency efficiency) {
        ReportEfficiency saved = efficiencyRepository.save(efficiency);
        clearCache();
        return ApiResponse.success("效率数据已记录", saved);
    }

    private void clearCache() {
        Set<String> keys = redisTemplate.keys(CACHE_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
