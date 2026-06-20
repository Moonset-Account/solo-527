package com.decoration.crm.service.impl;

import com.decoration.crm.dto.LoginRequest;
import com.decoration.crm.dto.LoginResponse;
import com.decoration.crm.entity.SysUser;
import com.decoration.crm.exception.BusinessException;
import com.decoration.crm.mapper.SysUserMapper;
import com.decoration.crm.security.UserDetailsImpl;
import com.decoration.crm.service.AuthService;
import com.decoration.crm.util.JwtUtil;
import com.decoration.crm.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.ZoneId;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RedisUtil redisUtil;

    @Override
    public LoginResponse login(LoginRequest request) {
        SysUser user = sysUserMapper.selectByUsername(request.getUsername());
        if (user == null) {
            throw new BusinessException("用户名或密码错误");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }

        if (user.getStatus() == null || !user.getStatus()) {
            throw new BusinessException("账号已被禁用");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());
        Date expiration = jwtUtil.getExpirationFromToken(token);

        redisUtil.set("token:" + token, user.getId(), 86400, TimeUnit.SECONDS);

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setRole(user.getRole());
        response.setAvatar(user.getAvatar());
        response.setExpiresAt(expiration.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());

        return response;
    }

    @Override
    public void logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        redisUtil.delete("token:" + token);
    }

    @Override
    public LoginResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            LoginResponse response = new LoginResponse();
            response.setUserId(userDetails.getId());
            response.setUsername(userDetails.getUsername());
            response.setRealName(userDetails.getRealName());
            response.setRole(userDetails.getRole());
            response.setAvatar(userDetails.getAvatar());
            return response;
        }
        throw new BusinessException("未登录");
    }
}
