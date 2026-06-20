package com.datagrowth.portal.service;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.dto.LoginRequest;
import com.datagrowth.portal.dto.LoginResponse;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public ApiResponse<LoginResponse> login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            
            SysUser user = (SysUser) authentication.getPrincipal();
            
            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", user.getId());
            claims.put("roles", user.getRoles().stream()
                .map(role -> role.getRoleCode())
                .collect(Collectors.toList()));
            
            String token = jwtService.generateToken(claims, user);
            
            LoginResponse response = LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .email(user.getEmail())
                .roles(user.getRoles().stream()
                    .map(role -> role.getRoleCode())
                    .collect(Collectors.toList()))
                .permissions(user.getAuthorities().stream()
                    .map(auth -> auth.getAuthority())
                    .collect(Collectors.toList()))
                .build();
            
            return ApiResponse.success("登录成功", response);
        } catch (Exception e) {
            return ApiResponse.error("用户名或密码错误");
        }
    }

    public ApiResponse<Void> logout() {
        return ApiResponse.success("登出成功", null);
    }
}
