package com.datagrowth.portal.controller;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.dto.LoginRequest;
import com.datagrowth.portal.dto.LoginResponse;
import com.datagrowth.portal.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        return authService.logout();
    }
}
