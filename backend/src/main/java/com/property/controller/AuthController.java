package com.property.controller;

import com.property.common.Result;
import com.property.common.UserContext;
import com.property.entity.SysUser;
import com.property.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestParam String username, @RequestParam String password) {
        return authService.login(username, password);
    }

    @GetMapping("/userinfo")
    public Result<SysUser> getUserInfo() {
        SysUser user = UserContext.getUser();
        return authService.getCurrentUserInfo(user);
    }
}
