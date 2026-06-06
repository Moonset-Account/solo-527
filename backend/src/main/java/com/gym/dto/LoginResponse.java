package com.gym.dto;

import com.gym.enums.UserRole;

public class LoginResponse {
    private String token;
    private String username;
    private String realName;
    private UserRole role;
    private Long userId;

    public LoginResponse(String token, String username, String realName, UserRole role, Long userId) {
        this.token = token;
        this.username = username;
        this.realName = realName;
        this.role = role;
        this.userId = userId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRealName() {
        return realName;
    }

    public void setRealName(String realName) {
        this.realName = realName;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
