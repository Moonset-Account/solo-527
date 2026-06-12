package com.finance.approval.audit;

import com.finance.approval.entity.AuditLog;
import com.finance.approval.entity.SysUser;
import com.finance.approval.repository.AuditLogRepository;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.security.SecurityUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogRepository auditLogRepository;
    private final SysUserRepository sysUserRepository;
    private final ObjectMapper objectMapper;

    @Around("@annotation(com.finance.approval.audit.AuditOperation)")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        Object result = null;
        Exception exception = null;

        try {
            result = joinPoint.proceed();
            return result;
        } catch (Exception e) {
            exception = e;
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            saveAuditLog(joinPoint, result, exception, duration);
        }
    }

    @Async
    protected void saveAuditLog(ProceedingJoinPoint joinPoint, Object result, Exception exception, long duration) {
        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Method method = signature.getMethod();
            AuditOperation auditLogAnnotation = method.getAnnotation(AuditOperation.class);

            HttpServletRequest request = getRequest();
            String username = SecurityUtils.getCurrentUsername();

            Long userId = null;
            String realUsername = username;
            if (username != null) {
                SysUser user = sysUserRepository.findByUsername(username).orElse(null);
                if (user != null) {
                    userId = user.getId();
                    realUsername = user.getUsername();
                }
            }

            String detail = buildDetail(joinPoint, result, exception, duration);

            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .username(realUsername)
                    .module(auditLogAnnotation.module())
                    .operation(auditLogAnnotation.operation())
                    .detail(detail)
                    .ipAddress(getIpAddress(request))
                    .userAgent(request != null ? request.getHeader("User-Agent") : null)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("保存审计日志失败", e);
        }
    }

    private String buildDetail(ProceedingJoinPoint joinPoint, Object result, Exception exception, long duration) {
        try {
            StringBuilder sb = new StringBuilder();
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] parameterNames = signature.getParameterNames();
            Object[] args = joinPoint.getArgs();

            sb.append("方法: ").append(signature.getDeclaringTypeName()).append(".").append(signature.getName());
            sb.append(", 耗时: ").append(duration).append("ms");

            if (parameterNames != null && parameterNames.length > 0) {
                sb.append(", 参数: ");
                for (int i = 0; i < parameterNames.length; i++) {
                    if (i > 0) sb.append(", ");
                    sb.append(parameterNames[i]).append("=");
                    if (args[i] instanceof HttpServletRequest) {
                        sb.append("HttpServletRequest");
                    } else {
                        sb.append(objectMapper.writeValueAsString(args[i]));
                    }
                }
            }

            if (exception != null) {
                sb.append(", 异常: ").append(exception.getMessage());
            }

            return sb.toString();
        } catch (Exception e) {
            return "构建详情失败: " + e.getMessage();
        }
    }

    private HttpServletRequest getRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    private String getIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String[] headers = {"X-Forwarded-For", "X-Real-IP", "Proxy-Client-IP", "WL-Proxy-Client-IP", "HTTP_CLIENT_IP", "HTTP_X_FORWARDED_FOR"};
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
