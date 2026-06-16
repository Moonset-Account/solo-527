package com.rider.analyzer.service;

import com.rider.analyzer.entity.OperationLog;
import com.rider.analyzer.repository.OperationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OperationLogService {

    private final OperationLogRepository operationLogRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public void log(Long userId, String userName, String module, String action, String detail, String ip) {
        OperationLog operationLog = new OperationLog();
        operationLog.setUserId(userId);
        operationLog.setUserName(userName);
        operationLog.setModule(module);
        operationLog.setAction(action);
        operationLog.setDetail(detail);
        operationLog.setIp(ip);
        operationLogRepository.save(operationLog);

        String key = "op_log:" + module + ":" + System.currentTimeMillis();
        redisTemplate.opsForValue().set(key, operationLog, 7, TimeUnit.DAYS);
    }

    public List<OperationLog> queryLogs(String module, LocalDateTime start, LocalDateTime end) {
        if (module != null && start != null && end != null) {
            return operationLogRepository.findByModuleAndCreateTimeBetween(module, start, end);
        }
        if (start != null && end != null) {
            return operationLogRepository.findByCreateTimeBetween(start, end);
        }
        return operationLogRepository.findAll();
    }
}
