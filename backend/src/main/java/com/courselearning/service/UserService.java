package com.courselearning.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.courselearning.common.PageResult;
import com.courselearning.entity.SysUser;
import com.courselearning.mapper.SysUserMapper;
import com.courselearning.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private SysUserMapper sysUserMapper;

    public PageResult<SysUser> getUserList(Long pageNum, Long pageSize, String keyword, String role) {
        Page<SysUser> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(SysUser::getUsername, keyword)
                    .or().like(SysUser::getNickname, keyword)
                    .or().like(SysUser::getPhone, keyword));
        }
        if (role != null && !role.isEmpty()) {
            wrapper.eq(SysUser::getRole, role);
        }
        wrapper.orderByDesc(SysUser::getCreatedAt);
        Page<SysUser> result = sysUserMapper.selectPage(page, wrapper);
        result.getRecords().forEach(u -> u.setPassword(null));
        return PageResult.of(result.getTotal(), result.getRecords(), pageNum, pageSize);
    }

    public SysUser getUserById(Long id) {
        SysUser user = sysUserMapper.selectById(id);
        if (user != null) {
            user.setPassword(null);
        }
        return user;
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateUser(Long id, SysUser user) {
        user.setId(id);
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            org.springframework.security.crypto.password.PasswordEncoder encoder =
                    new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
            user.setPassword(encoder.encode(user.getPassword()));
        } else {
            user.setPassword(null);
        }
        sysUserMapper.updateById(user);
    }

    public Map<String, Object> getMemberInfo() {
        Long userId = SecurityUtils.getCurrentUserId();
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            return null;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getId());
        result.put("nickname", user.getNickname());
        result.put("avatar", user.getAvatar());
        result.put("memberExpireTime", user.getMemberExpireTime());
        result.put("isMember", user.getMemberExpireTime() != null &&
                user.getMemberExpireTime().isAfter(LocalDateTime.now()));
        result.put("inviteCode", user.getInviteCode());
        result.put("referrerId", user.getReferrerId());

        if (user.getReferrerId() != null) {
            SysUser referrer = sysUserMapper.selectById(user.getReferrerId());
            if (referrer != null) {
                Map<String, Object> referrerInfo = new HashMap<>();
                referrerInfo.put("id", referrer.getId());
                referrerInfo.put("nickname", referrer.getNickname());
                referrerInfo.put("avatar", referrer.getAvatar());
                result.put("referrer", referrerInfo);
            }
        }

        LambdaQueryWrapper<SysUser> inviteWrapper = new LambdaQueryWrapper<>();
        inviteWrapper.eq(SysUser::getReferrerId, userId);
        Long inviteCount = sysUserMapper.selectCount(inviteWrapper);
        result.put("inviteCount", inviteCount);

        List<SysUser> inviteList = sysUserMapper.selectList(inviteWrapper);
        inviteList.forEach(u -> u.setPassword(null));
        result.put("inviteList", inviteList);

        return result;
    }

    public List<SysUser> getRecommendationTree(Long userId) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysUser::getReferrerId, userId);
        List<SysUser> directUsers = sysUserMapper.selectList(wrapper);
        directUsers.forEach(u -> u.setPassword(null));
        return directUsers;
    }
}
