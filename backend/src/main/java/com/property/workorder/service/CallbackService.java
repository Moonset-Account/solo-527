package com.property.workorder.service;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.property.workorder.common.PageResult;
import com.property.workorder.entity.CallbackRecord;
import com.property.workorder.mapper.CallbackRecordMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CallbackService {

    private final CallbackRecordMapper callbackMapper;

    @Value("${callback.retry.max-attempts:5}")
    private int maxAttempts;

    @Value("${callback.retry.initial-interval:60000}")
    private long initialInterval;

    @Value("${callback.retry.multiplier:2.0}")
    private double multiplier;

    public PageResult<CallbackRecord> queryCallbacks(String callbackType, String businessId,
                                                       String status, Integer current, Integer size) {
        Page<CallbackRecord> page = new Page<>(current, size);
        LambdaQueryWrapper<CallbackRecord> wrapper = new LambdaQueryWrapper<>();
        if (callbackType != null && !callbackType.isEmpty()) {
            wrapper.eq(CallbackRecord::getCallbackType, callbackType);
        }
        if (businessId != null && !businessId.isEmpty()) {
            wrapper.eq(CallbackRecord::getBusinessId, businessId);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(CallbackRecord::getStatus, status);
        }
        wrapper.orderByDesc(CallbackRecord::getCreatedAt);
        return PageResult.of(callbackMapper.selectPage(page, wrapper));
    }

    @Transactional(rollbackFor = Exception.class)
    public CallbackRecord createCallback(String callbackType, String businessId, String businessType,
                                          String url, String requestBody) {
        CallbackRecord record = new CallbackRecord();
        record.setCallbackId(UUID.randomUUID().toString().replace("-", ""));
        record.setCallbackType(callbackType);
        record.setBusinessId(businessId);
        record.setBusinessType(businessType);
        record.setUrl(url);
        record.setRequestBody(requestBody);
        record.setStatus("PENDING");
        record.setRetryCount(0);
        record.setMaxRetries(maxAttempts);
        record.setNextRetryAt(LocalDateTime.now());
        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        callbackMapper.insert(record);
        return record;
    }

    @Transactional(rollbackFor = Exception.class)
    public boolean executeCallback(CallbackRecord record) {
        try {
            HttpResponse response = HttpRequest.post(record.getUrl())
                    .header("Content-Type", "application/json")
                    .body(record.getRequestBody())
                    .timeout(30000)
                    .execute();

            record.setLastAttemptAt(LocalDateTime.now());
            record.setRetryCount(record.getRetryCount() + 1);

            if (response.isOk()) {
                record.setStatus("SUCCESS");
                record.setResponseBody(response.body());
                record.setNextRetryAt(null);
                record.setFailureReason(null);
                callbackMapper.updateById(record);
                log.info("回调成功 callbackId={}", record.getCallbackId());
                return true;
            } else {
                handleFailure(record, "HTTP状态码: " + response.getStatus() + ", 响应: " + response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("回调执行异常 callbackId={}", record.getCallbackId(), e);
            handleFailure(record, e.getMessage());
            return false;
        }
    }

    private void handleFailure(CallbackRecord record, String reason) {
        record.setFailureReason(reason);
        if (record.getRetryCount() >= record.getMaxRetries()) {
            record.setStatus("FAILED");
            record.setNextRetryAt(null);
        } else {
            record.setStatus("RETRYING");
            long delay = (long) (initialInterval * Math.pow(multiplier, record.getRetryCount() - 1));
            record.setNextRetryAt(LocalDateTime.now().plusSeconds(delay / 1000));
        }
        record.setUpdatedAt(LocalDateTime.now());
        callbackMapper.updateById(record);
    }

    @Scheduled(fixedDelay = 60000)
    public void retryFailedCallbacks() {
        LambdaQueryWrapper<CallbackRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(CallbackRecord::getStatus, "PENDING", "RETRYING")
                .le(CallbackRecord::getNextRetryAt, LocalDateTime.now());
        List<CallbackRecord> records = callbackMapper.selectList(wrapper);

        for (CallbackRecord record : records) {
            try {
                executeCallback(record);
            } catch (Exception e) {
                log.error("重试回调异常 callbackId={}", record.getCallbackId(), e);
            }
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public CallbackRecord manualRetry(Long id) {
        CallbackRecord record = callbackMapper.selectById(id);
        if (record == null) {
            throw new RuntimeException("回调记录不存在");
        }
        record.setStatus("RETRYING");
        record.setRetryCount(0);
        record.setNextRetryAt(LocalDateTime.now());
        record.setFailureReason(null);
        record.setUpdatedAt(LocalDateTime.now());
        callbackMapper.updateById(record);
        executeCallback(record);
        return record;
    }

    public CallbackRecord getCallbackDetail(Long id) {
        return callbackMapper.selectById(id);
    }
}
