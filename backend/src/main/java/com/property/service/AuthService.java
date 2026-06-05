package com.property.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.property.common.Result;
import com.property.entity.SysUser;
import com.property.mapper.SysUserMapper;
import com.property.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    public Result<Map<String, Object>> login(String username, String password) {
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getUsername, username)
                        .eq(SysUser::getStatus, 1)
        );

        if (user == null) {
            return Result.validateError("用户不存在或已禁用");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return Result.validateError("密码错误");
        }

        String token = jwtUtils.generateToken(user.getId(), user.getUsername(), user.getRole());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("realName", user.getRealName());
        result.put("role", user.getRole());
        result.put("avatar", user.getAvatar());

        log.info("用户登录成功: username={}, role={}", username, user.getRole());

        return Result.success("登录成功", result);
    }

    public Result<SysUser> getCurrentUserInfo(SysUser user) {
        user.setPassword(null);
        return Result.success(user);
    }
}
