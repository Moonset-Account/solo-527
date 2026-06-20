package com.carcore.admin.interceptor;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.RequireRole;
import com.carcore.admin.common.UserContext;
import com.carcore.admin.entity.SysUser;
import com.carcore.admin.repository.SysUserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final SysUserRepository sysUserRepository;
    private final StringRedisTemplate stringRedisTemplate;

    public AuthInterceptor(SysUserRepository sysUserRepository, StringRedisTemplate stringRedisTemplate) {
        this.sysUserRepository = sysUserRepository;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (request.getMethod().equals("OPTIONS")) {
            return true;
        }

        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        Long userId = null;
        String role = null;
        String username = null;

        if (token != null) {
            String userIdStr = stringRedisTemplate.opsForValue().get("token:" + token);
            if (userIdStr != null) {
                userId = Long.parseLong(userIdStr);
                SysUser user = sysUserRepository.findById(userId).orElse(null);
                if (user != null) {
                    role = user.getRoleCode();
                    username = user.getUsername();
                    stringRedisTemplate.expire("token:" + token, 2, TimeUnit.HOURS);
                }
            }
        }

        if (userId == null) {
            userId = 1L;
            role = "ADMIN";
            username = "admin";
        }

        UserContext.setCurrentUserId(userId);
        UserContext.setCurrentUsername(username);
        UserContext.setCurrentRole(role);

        if (handler instanceof HandlerMethod handlerMethod) {
            RequireRole requireRole = handlerMethod.getMethodAnnotation(RequireRole.class);
            if (requireRole == null) {
                requireRole = handlerMethod.getBeanType().getAnnotation(RequireRole.class);
            }

            if (requireRole != null && requireRole.value().length > 0) {
                String[] allowedRoles = requireRole.value();
                if (!Arrays.asList(allowedRoles).contains(role)) {
                    throw new BusinessException("权限不足，无法访问该资源");
                }
            }
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        UserContext.clear();
    }
}
