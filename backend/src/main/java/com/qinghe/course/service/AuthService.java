package com.qinghe.course.service;

import com.qinghe.course.entity.SysUser;
import com.qinghe.course.repository.SysUserRepository;
import com.qinghe.course.security.JwtTokenProvider;
import com.qinghe.course.security.SecurityUtils;
import com.qinghe.course.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SysUserRepository sysUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public Map<String, Object> login(String username, String password) {
        SysUser user = sysUserRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("密码错误");
        }

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new RuntimeException("用户已禁用");
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("user", user);
        return result;
    }

    public SysUser register(String username, String password, String nickname, String phone) {
        if (sysUserRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("用户名已存在");
        }

        SysUser user = new SysUser();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setNickname(nickname);
        user.setPhone(phone);
        user.setRole("STUDENT");
        user.setStatus("ACTIVE");

        return sysUserRepository.save(user);
    }

    public SysUser getCurrentUserInfo() {
        Long userId = SecurityUtils.getCurrentUserId();
        return sysUserRepository.findById(userId).orElseThrow(() -> new RuntimeException("用户不存在"));
    }
}
