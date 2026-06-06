package com.gym.dto;

import com.gym.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String realName;
    private UserRole role;
    private Long userId;
}
