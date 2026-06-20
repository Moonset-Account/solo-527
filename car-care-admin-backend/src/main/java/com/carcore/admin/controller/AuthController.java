package com.carcore.admin.controller;

import com.carcore.admin.common.BusinessException;
import com.carcore.admin.common.Result;
import com.carcore.admin.entity.SysUser;
import com.carcore.admin.repository.SysUserRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final SysUserRepository sysUserRepository;
    private final StringRedisTemplate stringRedisTemplate;

    public AuthController(SysUserRepository sysUserRepository, StringRedisTemplate stringRedisTemplate) {
        this.sysUserRepository = sysUserRepository;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody LoginRequest request) {
        SysUser user = sysUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("用户名或密码错误"));

        if (user.getStatus() != 1) {
            throw new BusinessException("账号已被禁用");
        }

        if (!user.getPassword().equals(request.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        stringRedisTemplate.opsForValue().set("token:" + token, String.valueOf(user.getId()), 2, TimeUnit.HOURS);

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("realName", user.getRealName());
        result.put("roleCode", user.getRoleCode());

        return Result.success("登录成功", result);
    }

    @PostMapping("/logout")
    public Result<Void> logout(@RequestHeader("Authorization") String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            stringRedisTemplate.delete("token:" + token);
        }
        return Result.success("退出成功", null);
    }

    @GetMapping("/current-user")
    public Result<Map<String, Object>> currentUser(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> result = new HashMap<>();
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String userIdStr = stringRedisTemplate.opsForValue().get("token:" + token);
            if (userIdStr != null) {
                Long userId = Long.parseLong(userIdStr);
                SysUser user = sysUserRepository.findById(userId).orElse(null);
                if (user != null) {
                    result.put("userId", user.getId());
                    result.put("username", user.getUsername());
                    result.put("realName", user.getRealName());
                    result.put("roleCode", user.getRoleCode());
                    return Result.success(result);
                }
            }
        }
        result.put("userId", 1L);
        result.put("username", "admin");
        result.put("realName", "管理员");
        result.put("roleCode", "ADMIN");
        return Result.success(result);
    }

    public static class LoginRequest {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
