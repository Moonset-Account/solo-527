package com.decoration.crm.service;

import com.decoration.crm.dto.LoginRequest;
import com.decoration.crm.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    void logout(String token);
    LoginResponse getCurrentUser();
}
