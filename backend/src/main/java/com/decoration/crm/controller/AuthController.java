package com.decoration.crm.controller;

import com.decoration.crm.dto.LoginRequest;
import com.decoration.crm.dto.LoginResponse;
import com.decoration.crm.dto.Result;
import com.decoration.crm.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return Result.success(authService.login(request));
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        authService.logout(token);
        return Result.success();
    }

    @GetMapping("/me")
    public Result<LoginResponse> getCurrentUser() {
        return Result.success(authService.getCurrentUser());
    }
}
