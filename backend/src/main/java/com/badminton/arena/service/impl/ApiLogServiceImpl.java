package com.badminton.arena.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.dto.ApiLogQueryDTO;
import com.badminton.arena.entity.ApiLog;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.ApiLogMapper;
import com.badminton.arena.service.ApiLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class ApiLogServiceImpl extends ServiceImpl<ApiLogMapper, ApiLog> implements ApiLogService {

    private static final Logger log = LoggerFactory.getLogger(ApiLogServiceImpl.class);

    @Override
    public Page<ApiLog> getApiLogPage(int pageNum, int pageSize, ApiLogQueryDTO queryDTO) {
        LambdaQueryWrapper<ApiLog> wrapper = buildQueryWrapper(queryDTO);
        wrapper.orderByDesc(ApiLog::getCreateTime);
        return page(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public List<ApiLog> getRetryList() {
        LambdaQueryWrapper<ApiLog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ApiLog::getStatus, 1)
                .eq(ApiLog::getNeedRetry, 1)
                .apply("retry_count < max_retry")
                .orderByAsc(ApiLog::getCreateTime);
        return list(wrapper);
    }

    @Override
    public boolean markForRetry(Long id) {
        ApiLog apiLog = getById(id);
        if (apiLog == null) {
            throw new BusinessException("日志不存在");
        }
        if (apiLog.getStatus() == 0) {
            throw new BusinessException("成功的日志不需要重试");
        }
        apiLog.setNeedRetry(1);
        return updateById(apiLog);
    }

    @Override
    public boolean retry(Long id) {
        ApiLog apiLog = getById(id);
        if (apiLog == null) {
            throw new BusinessException("日志不存在");
        }
        if (apiLog.getStatus() == 0) {
            throw new BusinessException("日志已成功，无需重试");
        }
        if (apiLog.getRetryCount() >= apiLog.getMaxRetry()) {
            throw new BusinessException("已达到最大重试次数");
        }
        apiLog.setRetryCount(apiLog.getRetryCount() + 1);
        if (apiLog.getRetryCount() >= apiLog.getMaxRetry()) {
            apiLog.setNeedRetry(0);
        }
        return updateById(apiLog);
    }

    @Override
    public List<ApiLog> getExportList(ApiLogQueryDTO queryDTO) {
        LambdaQueryWrapper<ApiLog> wrapper = buildQueryWrapper(queryDTO);
        wrapper.orderByDesc(ApiLog::getCreateTime);
        return list(wrapper);
    }

    private LambdaQueryWrapper<ApiLog> buildQueryWrapper(ApiLogQueryDTO queryDTO) {
        LambdaQueryWrapper<ApiLog> wrapper = new LambdaQueryWrapper<>();
        if (queryDTO != null) {
            if (StringUtils.hasText(queryDTO.getApiPath())) {
                wrapper.like(ApiLog::getApiPath, queryDTO.getApiPath());
            }
            if (StringUtils.hasText(queryDTO.getApiMethod())) {
                wrapper.eq(ApiLog::getApiMethod, queryDTO.getApiMethod());
            }
            if (queryDTO.getStatus() != null) {
                wrapper.eq(ApiLog::getStatus, queryDTO.getStatus());
            }
            if (queryDTO.getNeedRetry() != null) {
                wrapper.eq(ApiLog::getNeedRetry, queryDTO.getNeedRetry());
            }
            if (queryDTO.getUserId() != null) {
                wrapper.eq(ApiLog::getUserId, queryDTO.getUserId());
            }
            if (queryDTO.getStartTime() != null) {
                wrapper.ge(ApiLog::getCreateTime, queryDTO.getStartTime());
            }
            if (queryDTO.getEndTime() != null) {
                wrapper.le(ApiLog::getCreateTime, queryDTO.getEndTime());
            }
        }
        return wrapper;
    }
}
