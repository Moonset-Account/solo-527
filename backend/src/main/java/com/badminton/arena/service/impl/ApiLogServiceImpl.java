package com.badminton.arena.service.impl;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.badminton.arena.common.Result;
import com.badminton.arena.dto.ApiLogQueryDTO;
import com.badminton.arena.dto.RetryResultDTO;
import com.badminton.arena.entity.ApiLog;
import com.badminton.arena.exception.BusinessException;
import com.badminton.arena.mapper.ApiLogMapper;
import com.badminton.arena.service.ApiLogService;
import com.badminton.arena.utils.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class ApiLogServiceImpl extends ServiceImpl<ApiLogMapper, ApiLog> implements ApiLogService {

    private static final Logger log = LoggerFactory.getLogger(ApiLogServiceImpl.class);

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private JwtUtils jwtUtils;

    @Value("${server.port:8080}")
    private int serverPort;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

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
        if (apiLog.getRetryCount() != null && apiLog.getMaxRetry() != null
                && apiLog.getRetryCount() >= apiLog.getMaxRetry()) {
            throw new BusinessException("已达到最大重试次数");
        }

        long startTime = System.currentTimeMillis();
        boolean success = false;
        String errorMsg = null;
        String responseData = null;

        try {
            StringBuilder urlBuilder = new StringBuilder("http://localhost:").append(serverPort).append(apiLog.getApiPath());
            if (apiLog.getQueryParams() != null && !apiLog.getQueryParams().isEmpty()) {
                try {
                    java.util.Map<String, Object> queryMap = JSONUtil.toBean(apiLog.getQueryParams(), java.util.Map.class);
                    if (queryMap != null && !queryMap.isEmpty()) {
                        StringBuilder qs = new StringBuilder();
                        for (java.util.Map.Entry<String, Object> e : queryMap.entrySet()) {
                            if (e.getValue() == null) continue;
                            if (qs.length() > 0) qs.append('&');
                            qs.append(java.net.URLEncoder.encode(e.getKey(), "UTF-8"))
                                    .append('=')
                                    .append(java.net.URLEncoder.encode(String.valueOf(e.getValue()), "UTF-8"));
                        }
                        if (qs.length() > 0) {
                            urlBuilder.append(urlBuilder.indexOf("?") >= 0 ? '&' : '?').append(qs);
                        }
                    }
                } catch (Exception e) {
                    log.warn("组装查询参数失败", e);
                }
            }
            String url = urlBuilder.toString();
            String token = generateTokenForUser(apiLog.getUserId());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (token != null) {
                headers.set("Authorization", token);
            }

            String body = apiLog.getRequestBody();
            if (body == null || body.isEmpty()) {
                body = apiLog.getRequestParams();
            }

            String method = apiLog.getApiMethod() != null ? apiLog.getApiMethod().toUpperCase() : "GET";
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response;
            if ("GET".equals(method)) {
                response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            } else if ("POST".equals(method)) {
                response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            } else if ("PUT".equals(method)) {
                response = restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
            } else if ("DELETE".equals(method)) {
                response = restTemplate.exchange(url, HttpMethod.DELETE, entity, String.class);
            } else {
                response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            }

            responseData = response.getBody();
            if (responseData != null && responseData.length() > 5000) {
                responseData = responseData.substring(0, 5000) + "...";
            }

            if (response.getStatusCode() == HttpStatus.OK) {
                try {
                    Result<?> result = JSONUtil.toBean(response.getBody(), Result.class);
                    success = (result != null && result.getCode() != null && result.getCode() == 200);
                    if (!success && result != null) {
                        errorMsg = result.getMessage();
                    }
                } catch (Exception e) {
                    success = true;
                }
            } else {
                errorMsg = "HTTP状态码: " + response.getStatusCodeValue();
            }
        } catch (Exception e) {
            log.error("重试接口失败: {}", apiLog.getApiPath(), e);
            errorMsg = e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 1000)) : "重试失败";
        }

        int costTime = (int) (System.currentTimeMillis() - startTime);
        int newRetryCount = (apiLog.getRetryCount() == null ? 0 : apiLog.getRetryCount()) + 1;

        apiLog.setRetryCount(newRetryCount);
        apiLog.setCostTime(costTime);
        apiLog.setResponseData(responseData);

        if (success) {
            apiLog.setStatus(0);
            apiLog.setNeedRetry(0);
            apiLog.setErrorMsg(null);
        } else {
            apiLog.setStatus(1);
            apiLog.setErrorMsg(errorMsg);
            if (apiLog.getMaxRetry() != null && newRetryCount >= apiLog.getMaxRetry()) {
                apiLog.setNeedRetry(0);
            }
        }

        return updateById(apiLog);
    }

    private String generateTokenForUser(Long userId) {
        if (userId == null) {
            return null;
        }
        try {
            return jwtUtils.generateToken(userId, "retry_user_" + userId);
        } catch (Exception e) {
            log.warn("生成重试token失败", e);
            return null;
        }
    }

    @Override
    public boolean updateRetryResult(Long id, RetryResultDTO resultDTO) {
        ApiLog apiLog = getById(id);
        if (apiLog == null) {
            throw new BusinessException("日志不存在");
        }

        int newRetryCount = (apiLog.getRetryCount() == null ? 0 : apiLog.getRetryCount()) + 1;
        apiLog.setRetryCount(newRetryCount);

        if (resultDTO.getCostTime() != null) {
            apiLog.setCostTime(resultDTO.getCostTime());
        }
        if (resultDTO.getResponseData() != null) {
            String rd = resultDTO.getResponseData();
            apiLog.setResponseData(rd.length() > 5000 ? rd.substring(0, 5000) + "..." : rd);
        }

        boolean success = Boolean.TRUE.equals(resultDTO.getSuccess());
        if (success) {
            apiLog.setStatus(0);
            apiLog.setNeedRetry(0);
            apiLog.setErrorMsg(null);
        } else {
            apiLog.setStatus(1);
            String em = resultDTO.getErrorMsg();
            apiLog.setErrorMsg(em != null && em.length() > 1000 ? em.substring(0, 1000) : em);
            if (apiLog.getMaxRetry() != null && newRetryCount >= apiLog.getMaxRetry()) {
                apiLog.setNeedRetry(0);
            }
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
