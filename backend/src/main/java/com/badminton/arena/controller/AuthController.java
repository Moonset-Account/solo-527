package com.badminton.arena.controller;

import com.badminton.arena.common.Result;
import com.badminton.arena.dto.LoginDTO;
import com.badminton.arena.entity.SysUser;
import com.badminton.arena.service.SysUserService;
import com.badminton.arena.vo.LoginVO;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private SysUserService sysUserService;

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO loginDTO) {
        LoginVO loginVO = sysUserService.login(loginDTO);
        return Result.success(loginVO);
    }

    @PostMapping("/register")
    public Result<SysUser> register(@RequestBody SysUser user) {
        SysUser register = sysUserService.register(user);
        register.setPassword(null);
        return Result.success(register);
    }

    @GetMapping("/userInfo")
    public Result<LoginVO> getUserInfo() {
        LoginVO loginVO = sysUserService.getCurrentUserInfo();
        return Result.success(loginVO);
    }
}
