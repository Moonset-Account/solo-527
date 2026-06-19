package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.dto.LoginDTO;
import com.decoration.cooperation.entity.SysUser;
import com.decoration.cooperation.service.SysUserService;
import com.decoration.cooperation.vo.LoginVO;
import com.decoration.cooperation.vo.UserInfoVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SysUserService sysUserService;

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
        return Result.success(sysUserService.login(dto.getUsername(), dto.getPassword()));
    }

    @GetMapping("/userinfo")
    public Result<Map<String, Object>> getUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof SysUser user) {
            UserInfoVO userInfo = sysUserService.getUserInfo(user.getId());
            Map<String, Object> result = new HashMap<>();
            result.put("id", userInfo.getId());
            result.put("username", userInfo.getUsername());
            result.put("realName", userInfo.getRealName());
            result.put("phone", userInfo.getPhone());
            result.put("email", userInfo.getEmail());
            result.put("avatar", userInfo.getAvatar());
            result.put("deptId", userInfo.getDeptId());
            result.put("deptName", userInfo.getDeptName());
            result.put("roles", sysUserService.getUserRoles(user.getId()));
            result.put("permissions", sysUserService.getUserPermissions(user.getId()));
            return Result.success(result);
        }
        return Result.error(401, "未登录");
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        SecurityContextHolder.clearContext();
        return Result.success();
    }
}
