package com.courselearning.controller;

import com.courselearning.common.Result;
import com.courselearning.dto.LoginDTO;
import com.courselearning.dto.RegisterDTO;
import com.courselearning.entity.SysUser;
import com.courselearning.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@Valid @RequestBody LoginDTO dto) {
        Map<String, Object> result = authService.login(dto);
        return Result.success("登录成功", result);
    }

    @PostMapping("/register")
    public Result<Map<String, Object>> register(@Valid @RequestBody RegisterDTO dto) {
        Map<String, Object> result = authService.register(dto);
        return Result.success("注册成功", result);
    }

    @GetMapping("/me")
    public Result<SysUser> me() {
        SysUser user = authService.getCurrentUser();
        return Result.success(user);
    }
}
