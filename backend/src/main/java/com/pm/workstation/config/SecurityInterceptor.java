package com.pm.workstation.config;

import com.pm.workstation.enums.RoleType;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;

public class SecurityInterceptor implements HandlerInterceptor {

    private static final Set<String> ADMIN_PATHS = Set.of(
            "/api/processes/definitions",
            "/api/roles"
    );

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String role = request.getHeader("X-User-Role");
        String path = request.getRequestURI();

        if (role == null || role.isEmpty()) {
            return true;
        }

        try {
            RoleType roleType = RoleType.valueOf(role);
            if (roleType == RoleType.GENERAL_OFFICE) {
                return true;
            }
            boolean isAdminPath = ADMIN_PATHS.stream().anyMatch(path::startsWith);
            if (isAdminPath && roleType != RoleType.ADMIN && roleType != RoleType.GENERAL_OFFICE) {
                sendError(response, 403, "权限不足");
                return false;
            }
        } catch (IllegalArgumentException e) {
            sendError(response, 403, "无效的角色类型");
            return false;
        }

        return true;
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        java.util.Map<String, Object> body = java.util.Map.of("code", status, "message", message, "data", "");
        new com.fasterxml.jackson.databind.ObjectMapper().writeValue(response.getOutputStream(), body);
    }
}
