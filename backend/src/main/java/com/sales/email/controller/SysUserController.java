package com.sales.email.controller;

import com.sales.email.common.Result;
import com.sales.email.entity.SysUser;
import com.sales.email.service.SysUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class SysUserController {

    private final SysUserService userService;

    @GetMapping("/all")
    public Result<List<SysUser>> getAllUsers() {
        return Result.success(userService.getAllUsers());
    }

    @GetMapping("/role/{role}")
    public Result<List<SysUser>> getUsersByRole(@PathVariable String role) {
        return Result.success(userService.getUsersByRole(role));
    }

    @GetMapping("/{id}")
    public Result<SysUser> getUserById(@PathVariable Long id) {
        return Result.success(userService.getUserById(id));
    }
}
