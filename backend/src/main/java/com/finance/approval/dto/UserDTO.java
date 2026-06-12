package com.finance.approval.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserDTO {

    private Long id;

    private String username;

    private String realName;

    private String email;

    private String phone;

    private String department;

    private List<String> roles;
}
