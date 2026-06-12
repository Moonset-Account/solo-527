package com.finance.approval.dto;

import lombok.Data;

@Data
public class TokenResponse {

    private String accessToken;

    private String refreshToken;

    private String tokenType;

    private Long expiresIn;
}
