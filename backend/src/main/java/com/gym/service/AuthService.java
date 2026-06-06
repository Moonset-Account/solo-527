package com.gym.service;

import com.gym.common.BusinessException;
import com.gym.dto.LoginRequest;
import com.gym.dto.LoginResponse;
import com.gym.entity.User;
import com.gym.enums.UserRole;
import com.gym.repository.UserRepository;
import com.gym.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("用户名或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new BusinessException("账号已被禁用");
        }

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole(), user.getId());

        auditLogService.log("LOGIN", "AUTH", user.getId(), "USER", null, user.getUsername());

        return new LoginResponse(token, user.getUsername(), user.getRealName(), user.getRole(), user.getId());
    }

    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));
    }
}
