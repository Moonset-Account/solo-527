package com.approval.workflow.dto;

import lombok.Data;

@Data
public class LoginResponse {

    private String token;
    private Long userId;
    private String username;
    private String realName;
    private String role;
    private Long deptId;
}
