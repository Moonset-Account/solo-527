package com.finance.approval.service;

import com.finance.approval.audit.AuditOperation;
import com.finance.approval.entity.SysRole;
import com.finance.approval.entity.SysUser;
import com.finance.approval.entity.SysUserRole;
import com.finance.approval.enums.RoleCode;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.SysRoleRepository;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.repository.SysUserRoleRepository;
import com.finance.approval.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class UserService {

    private final SysUserRepository sysUserRepository;
    private final SysRoleRepository sysRoleRepository;
    private final SysUserRoleRepository sysUserRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String USER_CACHE_PREFIX = "user:";
    private static final String USER_ROLES_CACHE_PREFIX = "user_roles:";

    @Transactional(readOnly = true)
    public SysUser getCurrentUser() {
        String username = SecurityUtils.getCurrentUsername();
        if (username == null) {
            throw new BusinessException("用户未登录");
        }
        return sysUserRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    @Transactional(readOnly = true)
    public SysUser getUserById(Long id) {
        String cacheKey = USER_CACHE_PREFIX + id;
        SysUser user = (SysUser) redisTemplate.opsForValue().get(cacheKey);
        if (user != null) {
            return user;
        }
        user = sysUserRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        redisTemplate.opsForValue().set(cacheKey, user, 1, TimeUnit.HOURS);
        return user;
    }

    @Transactional(readOnly = true)
    public Page<SysUser> getUserList(String keyword, Pageable pageable) {
        return sysUserRepository.findByKeyword(keyword, pageable);
    }

    @Transactional
    @AuditOperation(module = "用户管理", operation = "创建用户")
    public SysUser createUser(SysUser user, List<Long> roleIds) {
        if (sysUserRepository.existsByUsername(user.getUsername())) {
            throw new BusinessException("用户名已存在");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setEnabled(true);
        SysUser savedUser = sysUserRepository.save(user);

        if (roleIds != null && !roleIds.isEmpty()) {
            assignRoles(savedUser.getId(), roleIds);
        }

        return savedUser;
    }

    @Transactional
    @AuditOperation(module = "用户管理", operation = "更新用户")
    public SysUser updateUser(SysUser user) {
        SysUser existingUser = sysUserRepository.findById(user.getId())
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!existingUser.getUsername().equals(user.getUsername())
                && sysUserRepository.existsByUsername(user.getUsername())) {
            throw new BusinessException("用户名已存在");
        }

        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        } else {
            user.setPassword(existingUser.getPassword());
        }

        SysUser updatedUser = sysUserRepository.save(user);
        redisTemplate.delete(USER_CACHE_PREFIX + user.getId());
        return updatedUser;
    }

    @Transactional
    @AuditOperation(module = "用户管理", operation = "删除用户")
    public void deleteUser(Long id) {
        if (!sysUserRepository.existsById(id)) {
            throw new BusinessException("用户不存在");
        }
        sysUserRoleRepository.deleteByUserId(id);
        sysUserRepository.deleteById(id);
        redisTemplate.delete(USER_CACHE_PREFIX + id);
        redisTemplate.delete(USER_ROLES_CACHE_PREFIX + id);
    }

    @Transactional
    @AuditOperation(module = "用户管理", operation = "分配角色")
    public void assignRoles(Long userId, List<Long> roleIds) {
        if (!sysUserRepository.existsById(userId)) {
            throw new BusinessException("用户不存在");
        }

        sysUserRoleRepository.deleteByUserId(userId);

        if (roleIds != null && !roleIds.isEmpty()) {
            List<SysRole> roles = sysRoleRepository.findByIdIn(roleIds);
            for (SysRole role : roles) {
                SysUserRole userRole = SysUserRole.builder()
                        .userId(userId)
                        .roleId(role.getId())
                        .build();
                sysUserRoleRepository.save(userRole);
            }
        }

        redisTemplate.delete(USER_ROLES_CACHE_PREFIX + userId);
    }

    @Transactional(readOnly = true)
    public List<SysRole> getUserRoles(Long userId) {
        String cacheKey = USER_ROLES_CACHE_PREFIX + userId;
        @SuppressWarnings("unchecked")
        List<SysRole> roles = (List<SysRole>) redisTemplate.opsForValue().get(cacheKey);
        if (roles != null) {
            return roles;
        }
        roles = sysUserRoleRepository.findRolesByUserId(userId);
        redisTemplate.opsForValue().set(cacheKey, roles, 1, TimeUnit.HOURS);
        return roles;
    }

    @Transactional(readOnly = true)
    public List<SysUser> getUsersByRole(RoleCode roleCode) {
        return sysUserRepository.findByRoleCode(roleCode);
    }
}
