package com.decoration.crm.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LoginResponse {
    private String token;
    private Long userId;
    private String username;
    private String realName;
    private String role;
    private String avatar;
    private LocalDateTime expiresAt;
}
