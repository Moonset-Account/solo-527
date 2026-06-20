package com.datagrowth.portal.util;

import com.datagrowth.portal.entity.SysUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtils {

    private SecurityUtils() {
    }

    public static SysUser getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser) {
            return (SysUser) auth.getPrincipal();
        }
        return null;
    }

    public static Long getCurrentUserId() {
        SysUser user = getCurrentUser();
        return user != null ? user.getId() : null;
    }

    public static String getCurrentUsername() {
        SysUser user = getCurrentUser();
        return user != null ? user.getUsername() : null;
    }
}
