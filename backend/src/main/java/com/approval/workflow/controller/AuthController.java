package com.approval.workflow.controller;

import com.approval.workflow.dto.ApiResponse;
import com.approval.workflow.dto.LoginRequest;
import com.approval.workflow.dto.LoginResponse;
import com.approval.workflow.entity.User;
import com.approval.workflow.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ApiResponse.success(response);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ApiResponse<User> register(@RequestBody User user) {
        try {
            User saved = authService.register(user);
            saved.setPassword(null);
            return ApiResponse.success(saved);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/users")
    public ApiResponse<List<User>> getAllUsers() {
        List<User> users = authService.getAllUsers();
        users.forEach(u -> u.setPassword(null));
        return ApiResponse.success(users);
    }

    @GetMapping("/users/{id}")
    public ApiResponse<User> getUserById(@PathVariable Long id) {
        User user = authService.getUserById(id);
        user.setPassword(null);
        return ApiResponse.success(user);
    }
}
