package com.property.common;

import com.property.entity.SysUser;

public class UserContext {

    private static final ThreadLocal<SysUser> USER_HOLDER = new ThreadLocal<>();

    public static void setUser(SysUser user) {
        USER_HOLDER.set(user);
    }

    public static SysUser getUser() {
        return USER_HOLDER.get();
    }

    public static Long getUserId() {
        SysUser user = USER_HOLDER.get();
        return user != null ? user.getId() : null;
    }

    public static String getUsername() {
        SysUser user = USER_HOLDER.get();
        return user != null ? user.getUsername() : null;
    }

    public static String getRole() {
        SysUser user = USER_HOLDER.get();
        return user != null ? user.getRole() : null;
    }

    public static void clear() {
        USER_HOLDER.remove();
    }
}
