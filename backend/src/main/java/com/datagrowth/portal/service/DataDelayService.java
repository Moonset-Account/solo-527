package com.datagrowth.portal.service;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.DataDelayMonitor;
import com.datagrowth.portal.repository.DataDelayMonitorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class DataDelayService {

    private final DataDelayMonitorRepository delayRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${data.delay.threshold-minutes:30}")
    private int delayThreshold;

    private static final String CACHE_PREFIX = "delay:";
    private static final String NOTIFICATION_KEY = CACHE_PREFIX + "notifications";

    public ApiResponse<Page<DataDelayMonitor>> getDelayList(String status, Pageable pageable) {
        Page<DataDelayMonitor> result;
        
        if (status != null) {
            result = delayRepository.findByStatus(status, pageable);
        } else {
            result = delayRepository.findAll(pageable);
        }
        
        return ApiResponse.success(result);
    }

    public ApiResponse<DataDelayMonitor> getDelayDetail(Long id) {
        return delayRepository.findById(id)
            .map(ApiResponse::success)
            .orElse(ApiResponse.error("延迟监控记录不存在"));
    }

    public ApiResponse<Map<String, Object>> getDelayStats() {
        String cacheKey = CACHE_PREFIX + "stats";
        @SuppressWarnings("unchecked")
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return ApiResponse.success(cached);
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("delayed", delayRepository.countDelayed());
        stats.put("normal", delayRepository.count() - delayRepository.countDelayed());
        
        redisTemplate.opsForValue().set(cacheKey, stats, 5, TimeUnit.MINUTES);
        
        return ApiResponse.success(stats);
    }

    @Scheduled(fixedRateString = "${data.delay.check-interval-seconds:60}000")
    public void checkDataDelay() {
        List<DataDelayMonitor> monitors = delayRepository.findAll();
        
        for (DataDelayMonitor monitor : monitors) {
            LocalDateTime expectedTime = monitor.getExpectedUpdateTime();
            if (expectedTime == null) {
                continue;
            }
            
            long delayMinutes = java.time.Duration.between(expectedTime, LocalDateTime.now()).toMinutes();
            monitor.setDelayMinutes((int) delayMinutes);
            
            if (delayMinutes >= delayThreshold) {
                monitor.setStatus("DELAYED");
                if (!Boolean.TRUE.equals(monitor.getNotified())) {
                    sendDelayNotification(monitor);
                    monitor.setNotified(true);
                    monitor.setNotifiedAt(LocalDateTime.now());
                }
            } else {
                monitor.setStatus("NORMAL");
                if (Boolean.TRUE.equals(monitor.getNotified()) && delayMinutes < delayThreshold / 2) {
                    monitor.setNotified(false);
                }
            }
            
            delayRepository.save(monitor);
        }
        
        redisTemplate.delete(CACHE_PREFIX + "stats");
    }

    private void sendDelayNotification(DataDelayMonitor monitor) {
        String notificationKey = NOTIFICATION_KEY + ":" + monitor.getId();
        
        if (Boolean.TRUE.equals(redisTemplate.hasKey(notificationKey))) {
            return;
        }
        
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "DATA_DELAY");
        notification.put("datasetCode", monitor.getDatasetCode());
        notification.put("datasetName", monitor.getDatasetName());
        notification.put("delayMinutes", monitor.getDelayMinutes());
        notification.put("expectedTime", monitor.getExpectedUpdateTime());
        notification.put("notifyUsers", monitor.getNotifyUsers());
        notification.put("timestamp", LocalDateTime.now());
        notification.put("severity", monitor.getDelayMinutes() > delayThreshold * 2 ? "HIGH" : "MEDIUM");
        
        redisTemplate.opsForList().leftPush(NOTIFICATION_KEY + ":list", notification);
        redisTemplate.opsForValue().set(notificationKey, true, 1, TimeUnit.HOURS);
        
        System.out.println("[数据延迟告警] " + monitor.getDatasetName() + 
            " 已延迟 " + monitor.getDelayMinutes() + " 分钟，通知用户: " + monitor.getNotifyUsers());
    }

    @SuppressWarnings("unchecked")
    public ApiResponse<List<Map<String, Object>>> getPendingNotifications() {
        List<Object> notifications = redisTemplate.opsForList().range(NOTIFICATION_KEY + ":list", 0, -1);
        if (notifications == null) {
            return ApiResponse.success(List.of());
        }
        return ApiResponse.success(notifications.stream()
            .map(n -> (Map<String, Object>) n)
            .toList());
    }

    public ApiResponse<Void> clearNotification(int index) {
        redisTemplate.opsForList().remove(NOTIFICATION_KEY + ":list", 1, index);
        return ApiResponse.success("通知已清除", null);
    }

    public ApiResponse<Void> clearAllNotifications() {
        redisTemplate.delete(NOTIFICATION_KEY + ":list");
        return ApiResponse.success("所有通知已清除", null);
    }

    public ApiResponse<DataDelayMonitor> updateDelayMonitor(Long id, DataDelayMonitor monitor) {
        return delayRepository.findById(id)
            .map(existing -> {
                existing.setLastUpdateTime(monitor.getLastUpdateTime());
                existing.setExpectedUpdateTime(monitor.getExpectedUpdateTime());
                existing.setNotifyUsers(monitor.getNotifyUsers());
                DataDelayMonitor saved = delayRepository.save(existing);
                redisTemplate.delete(CACHE_PREFIX + "stats");
                return ApiResponse.success("延迟监控已更新", saved);
            })
            .orElse(ApiResponse.error("延迟监控记录不存在"));
    }
}
