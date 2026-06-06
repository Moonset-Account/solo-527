package com.ceramic.kiln.controller;

import com.ceramic.kiln.dto.ApiResponse;
import com.ceramic.kiln.dto.LoginDTO;
import com.ceramic.kiln.entity.User;
import com.ceramic.kiln.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody LoginDTO dto) {
        return ApiResponse.success(authService.login(dto));
    }

    @GetMapping("/me")
    public ApiResponse<User> getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return ApiResponse.success(authService.getCurrentUser(username));
    }
}
