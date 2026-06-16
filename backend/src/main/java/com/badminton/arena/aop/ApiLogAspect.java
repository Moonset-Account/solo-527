package com.badminton.arena.aop;

import cn.hutool.core.util.IdUtil;
import cn.hutool.json.JSONUtil;
import com.badminton.arena.context.UserContext;
import com.badminton.arena.entity.ApiLog;
import com.badminton.arena.service.ApiLogService;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import javax.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
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

        if (request != null && request.getRequestURI() != null && request.getRequestURI().contains("/api-log/")) {
            return joinPoint.proceed();
        }

        ApiLog apiLog = new ApiLog();
        apiLog.setTraceId(traceId);

        if (request != null) {
            apiLog.setApiPath(request.getRequestURI());
            apiLog.setApiMethod(request.getMethod());
            try {
                java.util.Map<String, String[]> parameterMap = request.getParameterMap();
                if (parameterMap != null && !parameterMap.isEmpty()) {
                    java.util.Map<String, Object> queryParams = new java.util.HashMap<>();
                    for (java.util.Map.Entry<String, String[]> entry : parameterMap.entrySet()) {
                        String[] values = entry.getValue();
                        if (values != null && values.length > 0) {
                            queryParams.put(entry.getKey(), values.length == 1 ? values[0] : values);
                        }
                    }
                    if (!queryParams.isEmpty()) {
                        apiLog.setQueryParams(JSONUtil.toJsonStr(queryParams));
                    }
                }
            } catch (Exception e) {
                log.warn("保存查询参数失败", e);
            }
        }

        try {
            Object[] args = joinPoint.getArgs();
            if (args != null && args.length > 0) {
                try {
                    MethodSignature signature = (MethodSignature) joinPoint.getSignature();
                    Method method = signature.getMethod();
                    Annotation[][] paramAnnotations = method.getParameterAnnotations();
                    String[] paramNames = signature.getParameterNames();

                    java.util.List<Object> allArgsForFallback = new java.util.ArrayList<>();
                    boolean foundRequestBody = false;
                    java.util.Map<String, Object> additionalQueryParams = new java.util.HashMap<>();

                    for (int i = 0; i < args.length; i++) {
                        Object arg = args[i];
                        if (arg == null) continue;

                        if (arg instanceof javax.servlet.http.HttpServletRequest
                                || arg instanceof javax.servlet.http.HttpServletResponse
                                || arg instanceof org.springframework.web.multipart.MultipartFile
                                || arg instanceof org.springframework.validation.BindingResult) {
                            continue;
                        }

                        Annotation[] annotations = paramAnnotations[i];
                        boolean isRequestBody = false;
                        boolean isRequestParam = false;
                        String requestParamName = paramNames != null ? paramNames[i] : null;

                        if (annotations != null) {
                            for (Annotation ann : annotations) {
                                if (ann instanceof RequestBody) {
                                    isRequestBody = true;
                                }
                                if (ann instanceof RequestParam) {
                                    isRequestParam = true;
                                    String rpName = ((RequestParam) ann).value();
                                    if (rpName != null && !rpName.isEmpty()) {
                                        requestParamName = rpName;
                                    }
                                }
                            }
                        }

                        if (isRequestBody) {
                            try {
                                String json = JSONUtil.toJsonStr(arg);
                                if (json.length() > 5000) {
                                    json = json.substring(0, 5000) + "...";
                                }
                                apiLog.setRequestBody(json);
                                foundRequestBody = true;
                            } catch (Exception e) {
                                log.warn("序列化 @RequestBody 失败", e);
                            }
                            continue;
                        }

                        if (isRequestParam || isSimpleValueType(arg)) {
                            if (requestParamName != null) {
                                additionalQueryParams.put(requestParamName, arg);
                            }
                        }

                        allArgsForFallback.add(arg);
                    }

                    if (!foundRequestBody && !allArgsForFallback.isEmpty()) {
                        Object first = allArgsForFallback.get(0);
                        if (!isSimpleValueType(first)) {
                            try {
                                String json = JSONUtil.toJsonStr(first);
                                if (json.length() > 5000) {
                                    json = json.substring(0, 5000) + "...";
                                }
                                apiLog.setRequestBody(json);
                            } catch (Exception e) {
                                log.warn("回退序列化请求体失败", e);
                            }
                        }
                    }

                    if (!additionalQueryParams.isEmpty()) {
                        java.util.Map<String, Object> mergedQuery = new java.util.HashMap<>();
                        String existing = apiLog.getQueryParams();
                        if (existing != null && !existing.isEmpty()) {
                            try {
                                java.util.Map<String, Object> m = JSONUtil.toBean(existing, java.util.Map.class);
                                if (m != null) mergedQuery.putAll(m);
                            } catch (Exception ignore) {
                            }
                        }
                        mergedQuery.putAll(additionalQueryParams);
                        apiLog.setQueryParams(JSONUtil.toJsonStr(mergedQuery));
                    }

                    try {
                        apiLog.setRequestParams(JSONUtil.toJsonStr(allArgsForFallback));
                    } catch (Exception ignore) {
                    }

                } catch (Exception e) {
                    log.warn("获取请求参数失败", e);
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

    private static boolean isSimpleValueType(Object obj) {
        if (obj == null) return true;
        Class<?> c = obj.getClass();
        return c.isPrimitive()
                || c.isEnum()
                || Number.class.isAssignableFrom(c)
                || CharSequence.class.isAssignableFrom(c)
                || Boolean.class == c
                || Character.class == c
                || java.util.Date.class.isAssignableFrom(c)
                || LocalDateClassHolder.LocalDate != null && LocalDateClassHolder.LocalDate.isAssignableFrom(c)
                || LocalDateTimeClassHolder.LocalDateTime != null && LocalDateTimeClassHolder.LocalDateTime.isAssignableFrom(c)
                || java.time.temporal.Temporal.class.isAssignableFrom(c);
    }

    private static class LocalDateClassHolder {
        static final Class<?> LocalDate;
        static {
            Class<?> c = null;
            try { c = Class.forName("java.time.LocalDate"); } catch (Exception ignore) {}
            LocalDate = c;
        }
    }

    private static class LocalDateTimeClassHolder {
        static final Class<?> LocalDateTime;
        static {
            Class<?> c = null;
            try { c = Class.forName("java.time.LocalDateTime"); } catch (Exception ignore) {}
            LocalDateTime = c;
        }
    }
}
