package com.courselearning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.courselearning.common.ResultCode;
import com.courselearning.dto.LoginDTO;
import com.courselearning.dto.RegisterDTO;
import com.courselearning.entity.SysUser;
import com.courselearning.mapper.SysUserMapper;
import com.courselearning.security.JwtUtil;
import com.courselearning.util.SecurityUtils;
import cn.hutool.core.util.IdUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private SysUserMapper sysUserMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public Map<String, Object> login(LoginDTO dto) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, dto.getUsername());
        SysUser user = sysUserMapper.selectOne(wrapper);

        if (user == null) {
            throw new RuntimeException(ResultCode.USERNAME_NOT_EXIST.getMessage());
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException(ResultCode.PASSWORD_ERROR.getMessage());
        }

        if (user.getStatus() != 1) {
            throw new RuntimeException(ResultCode.USER_DISABLED.getMessage());
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("nickname", user.getNickname());
        result.put("avatar", user.getAvatar());
        result.put("role", user.getRole());

        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> register(RegisterDTO dto) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getUsername, dto.getUsername());
        if (sysUserMapper.selectCount(wrapper) > 0) {
            throw new RuntimeException(ResultCode.USERNAME_EXIST.getMessage());
        }

        SysUser user = new SysUser();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname());
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setRole("MEMBER");
        user.setStatus(1);
        user.setInviteCode(IdUtil.randomString(8).toUpperCase());

        if (dto.getInviteCode() != null && !dto.getInviteCode().isEmpty()) {
            LambdaQueryWrapper<SysUser> referrerWrapper = new LambdaQueryWrapper<>();
            referrerWrapper.eq(SysUser::getInviteCode, dto.getInviteCode());
            SysUser referrer = sysUserMapper.selectOne(referrerWrapper);
            if (referrer != null) {
                user.setReferrerId(referrer.getId());
            } else {
                throw new RuntimeException(ResultCode.INVITE_CODE_INVALID.getMessage());
            }
        }

        sysUserMapper.insert(user);

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("userId", user.getId());
        result.put("username", user.getUsername());
        result.put("nickname", user.getNickname());
        result.put("role", user.getRole());

        return result;
    }

    public SysUser getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            return null;
        }
        SysUser user = sysUserMapper.selectById(userId);
        if (user != null) {
            user.setPassword(null);
        }
        return user;
    }

    public boolean isMemberActive(SysUser user) {
        if (user == null || user.getMemberExpireTime() == null) {
            return false;
        }
        return user.getMemberExpireTime().isAfter(LocalDateTime.now());
    }
}
