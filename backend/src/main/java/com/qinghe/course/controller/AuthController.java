package com.qinghe.course.controller;

import com.qinghe.course.common.Result;
import com.qinghe.course.service.AuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest request) {
        return Result.success(authService.login(request.getUsername(), request.getPassword()));
    }

    @PostMapping("/register")
    public Result<?> register(@RequestBody RegisterRequest request) {
        return Result.success(authService.register(
                request.getUsername(),
                request.getPassword(),
                request.getNickname(),
                request.getPhone()
        ));
    }

    @GetMapping("/me")
    public Result<?> getCurrentUser() {
        return Result.success(authService.getCurrentUserInfo());
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    public static class RegisterRequest {
        private String username;
        private String password;
        private String nickname;
        private String phone;
    }
}
