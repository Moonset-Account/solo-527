package com.finance.approval.controller;

import com.finance.approval.config.JwtConfig;
import com.finance.approval.dto.ApiResponse;
import com.finance.approval.dto.LoginRequest;
import com.finance.approval.dto.TokenResponse;
import com.finance.approval.dto.UserDTO;
import com.finance.approval.entity.SysRole;
import com.finance.approval.entity.SysUser;
import com.finance.approval.entity.SysUserRole;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.SysRoleRepository;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.repository.SysUserRoleRepository;
import com.finance.approval.security.JwtTokenProvider;
import com.finance.approval.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtConfig jwtConfig;
    private final SysUserRepository sysUserRepository;
    private final SysRoleRepository sysRoleRepository;
    private final SysUserRoleRepository sysUserRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        String username = authentication.getName();
        String accessToken = jwtTokenProvider.generateToken(username);
        String refreshToken = jwtTokenProvider.generateRefreshToken(username);
        long expiresIn = jwtTokenProvider.getExpirationFromToken(accessToken);

        redisTemplate.opsForValue().set("token:" + username, accessToken, expiresIn, TimeUnit.MILLISECONDS);
        redisTemplate.opsForValue().set("refresh:" + username, refreshToken, jwtConfig.getRefreshExpiration(), TimeUnit.MILLISECONDS);

        TokenResponse response = new TokenResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(expiresIn);

        return ApiResponse.success(response);
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refreshToken(@RequestHeader("Authorization") String authHeader) {
        String refreshToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BusinessException("刷新令牌无效或已过期");
        }

        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        String storedRefreshToken = redisTemplate.opsForValue().get("refresh:" + username);

        if (!refreshToken.equals(storedRefreshToken)) {
            throw new BusinessException("刷新令牌无效");
        }

        String accessToken = jwtTokenProvider.generateToken(username);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(username);
        long expiresIn = jwtTokenProvider.getExpirationFromToken(accessToken);

        redisTemplate.opsForValue().set("token:" + username, accessToken, expiresIn, TimeUnit.MILLISECONDS);
        redisTemplate.opsForValue().set("refresh:" + username, newRefreshToken, jwtConfig.getRefreshExpiration(), TimeUnit.MILLISECONDS);

        TokenResponse response = new TokenResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(newRefreshToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(expiresIn);

        return ApiResponse.success(response);
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> logout() {
        String username = SecurityUtils.getCurrentUsername();
        if (username != null) {
            redisTemplate.delete("token:" + username);
            redisTemplate.delete("refresh:" + username);
        }
        return ApiResponse.success();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserDTO> getCurrentUser() {
        String username = SecurityUtils.getCurrentUsername();
        SysUser user = sysUserRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        List<SysUserRole> userRoles = sysUserRoleRepository.findByUserId(user.getId());
        List<Long> roleIds = userRoles.stream().map(SysUserRole::getRoleId).collect(Collectors.toList());
        List<SysRole> roles = sysRoleRepository.findAllById(roleIds);

        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setRealName(user.getRealName());
        userDTO.setEmail(user.getEmail());
        userDTO.setPhone(user.getPhone());
        userDTO.setDepartment(user.getDepartment());
        userDTO.setRoles(roles.stream().map(role -> role.getRoleCode().name()).collect(Collectors.toList()));

        return ApiResponse.success(userDTO);
    }
}
