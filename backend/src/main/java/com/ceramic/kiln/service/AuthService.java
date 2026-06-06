package com.ceramic.kiln.service;

import com.ceramic.kiln.dto.LoginDTO;
import com.ceramic.kiln.entity.User;
import com.ceramic.kiln.exception.BusinessException;
import com.ceramic.kiln.repository.UserRepository;
import com.ceramic.kiln.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public Map<String, Object> login(LoginDTO dto) {
        User user = userRepository.findByUsername(dto.getUsername())
            .orElseThrow(() -> new BusinessException("用户名或密码错误"));

        if (!user.getIsActive()) {
            throw new BusinessException("账号已被禁用");
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }

        String token = jwtTokenProvider.generateTokenByUsername(user.getUsername());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "name", user.getName(),
            "role", user.getRole(),
            "email", user.getEmail()
        ));

        return result;
    }

    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new BusinessException("用户不存在"));
    }
}
