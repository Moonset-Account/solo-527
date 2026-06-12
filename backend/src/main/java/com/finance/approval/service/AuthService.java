package com.finance.approval.service;

import com.finance.approval.audit.AuditOperation;
import com.finance.approval.config.JwtConfig;
import com.finance.approval.dto.LoginRequest;
import com.finance.approval.dto.TokenResponse;
import com.finance.approval.entity.SysUser;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtConfig jwtConfig;
    private final SysUserRepository sysUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String REFRESH_TOKEN_PREFIX = "refresh_token:";
    private static final String BLACKLIST_TOKEN_PREFIX = "blacklist_token:";

    @Transactional
    @AuditOperation(module = "认证", operation = "用户登录")
    public TokenResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SysUser user = sysUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!user.getEnabled()) {
            throw new BusinessException("用户已被禁用");
        }

        String accessToken = jwtTokenProvider.generateToken(request.getUsername());
        String refreshToken = jwtTokenProvider.generateRefreshToken(request.getUsername());

        redisTemplate.opsForValue().set(
                REFRESH_TOKEN_PREFIX + refreshToken,
                request.getUsername(),
                jwtConfig.getRefreshExpiration(),
                TimeUnit.MILLISECONDS
        );

        TokenResponse response = new TokenResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(jwtConfig.getExpiration() / 1000);

        return response;
    }

    @Transactional(readOnly = true)
    public TokenResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BusinessException("无效的刷新令牌");
        }

        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
        String storedUsername = (String) redisTemplate.opsForValue().get(REFRESH_TOKEN_PREFIX + refreshToken);

        if (storedUsername == null || !storedUsername.equals(username)) {
            throw new BusinessException("刷新令牌已过期或无效");
        }

        String newAccessToken = jwtTokenProvider.generateToken(username);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(username);

        redisTemplate.delete(REFRESH_TOKEN_PREFIX + refreshToken);
        redisTemplate.opsForValue().set(
                REFRESH_TOKEN_PREFIX + newRefreshToken,
                username,
                jwtConfig.getRefreshExpiration(),
                TimeUnit.MILLISECONDS
        );

        TokenResponse response = new TokenResponse();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(jwtConfig.getExpiration() / 1000);

        return response;
    }

    @Transactional
    @AuditOperation(module = "认证", operation = "用户登出")
    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null && accessToken.startsWith("Bearer ")) {
            accessToken = accessToken.substring(7);
        }

        if (accessToken != null) {
            long expiration = jwtTokenProvider.getExpirationFromToken(accessToken);
            if (expiration > 0) {
                redisTemplate.opsForValue().set(
                        BLACKLIST_TOKEN_PREFIX + accessToken,
                        "blacklisted",
                        expiration,
                        TimeUnit.MILLISECONDS
                );
            }
        }

        if (refreshToken != null) {
            redisTemplate.delete(REFRESH_TOKEN_PREFIX + refreshToken);
        }
    }

    @Transactional
    @AuditOperation(module = "认证", operation = "用户注册")
    public SysUser register(SysUser user) {
        if (sysUserRepository.existsByUsername(user.getUsername())) {
            throw new BusinessException("用户名已存在");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setEnabled(true);

        return sysUserRepository.save(user);
    }
}
