package com.finance.approval.service.scheduling;

import com.finance.approval.config.RedisCacheConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheEvictScheduler {

    private final CacheManager cacheManager;
    private final RedisTemplate<String, Object> redisTemplate;

    @Scheduled(cron = "${scheduling.cache-evict.cron:0 0 2 * * ?}")
    public void evictExpiredCaches() {
        log.info("开始执行缓存清除定时任务");
        try {
            String[] cacheNames = {
                    RedisCacheConfig.CACHE_USERS,
                    RedisCacheConfig.CACHE_ROLES,
                    RedisCacheConfig.CACHE_RULES,
                    RedisCacheConfig.CACHE_CONFIGS,
                    RedisCacheConfig.CACHE_APPLICATIONS
            };

            for (String cacheName : cacheNames) {
                Cache cache = cacheManager.getCache(cacheName);
                if (cache != null) {
                    cache.clear();
                    log.info("已清除缓存: {}", cacheName);
                }
            }

            Set<String> keys = redisTemplate.keys("*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("已清除 {} 个Redis键", keys.size());
            }

            log.info("缓存清除定时任务执行完成");
        } catch (Exception e) {
            log.error("缓存清除定时任务执行失败", e);
        }
    }
}
