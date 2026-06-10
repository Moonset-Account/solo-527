package com.energy.dashboard.controller;

import com.energy.dashboard.common.Result;
import com.energy.dashboard.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        try {
            return Result.success(authService.login(
                    credentials.get("username"),
                    credentials.get("password")
            ));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        authService.logout();
        return Result.success(null);
    }
}
