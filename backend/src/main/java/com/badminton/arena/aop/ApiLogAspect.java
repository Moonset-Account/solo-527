package com.badminton.arena.aop;

import cn.hutool.core.util.IdUtil;
import cn.hutool.json.JSONUtil;
import com.badminton.arena.context.UserContext;
import com.badminton.arena.entity.ApiLog;
import com.badminton.arena.service.ApiLogService;
import javax.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
public class ApiLogAspect {

    private static final Logger log = LoggerFactory.getLogger(ApiLogAspect.class);

    @Autowired
    private ApiLogService apiLogService;

    private static final int MAX_RETRY = 3;

    @Around("execution(* com.badminton.arena.controller..*.*(..))")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String traceId = IdUtil.simpleUUID();

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

        ApiLog apiLog = new ApiLog();
        apiLog.setTraceId(traceId);

        if (request != null) {
            apiLog.setApiPath(request.getRequestURI());
            apiLog.setApiMethod(request.getMethod());
        }

        try {
            Object[] args = joinPoint.getArgs();
            if (args != null && args.length > 0) {
                try {
                    apiLog.setRequestParams(JSONUtil.toJsonStr(args));
                } catch (Exception e) {
                    apiLog.setRequestParams("参数序列化失败");
                }
            }
        } catch (Exception e) {
            log.warn("获取请求参数失败", e);
        }

        Long userId = null;
        try {
            userId = UserContext.getUserId();
        } catch (Exception e) {
            log.debug("获取用户ID失败", e);
        }
        apiLog.setUserId(userId);

        Object result = null;
        try {
            result = joinPoint.proceed();
            apiLog.setStatus(0);
            apiLog.setNeedRetry(0);
        } catch (Throwable e) {
            apiLog.setStatus(1);
            apiLog.setErrorMsg(e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 1000)) : null);
            apiLog.setNeedRetry(1);
            apiLog.setMaxRetry(MAX_RETRY);
            apiLog.setRetryCount(0);
            throw e;
        } finally {
            long costTime = System.currentTimeMillis() - startTime;
            apiLog.setCostTime((int) costTime);

            if (result != null) {
                try {
                    String responseStr = JSONUtil.toJsonStr(result);
                    if (responseStr.length() > 5000) {
                        responseStr = responseStr.substring(0, 5000) + "...";
                    }
                    apiLog.setResponseData(responseStr);
                } catch (Exception e) {
                    apiLog.setResponseData("响应序列化失败");
                }
            }

            try {
                apiLogService.save(apiLog);
            } catch (Exception e) {
                log.error("保存接口日志失败", e);
            }
        }

        return result;
    }
}
