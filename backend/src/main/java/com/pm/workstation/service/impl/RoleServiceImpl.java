package com.pm.workstation.service.impl;

import com.pm.workstation.entity.SysRole;
import com.pm.workstation.entity.SysUser;
import com.pm.workstation.enums.RoleType;
import com.pm.workstation.repository.SysRoleRepository;
import com.pm.workstation.repository.SysUserRepository;
import com.pm.workstation.service.RoleService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoleServiceImpl implements RoleService {

    @Autowired
    private SysRoleRepository sysRoleRepository;

    @Autowired
    private SysUserRepository sysUserRepository;

    @Override
    @Transactional
    public SysRole createRole(SysRole role) {
        LocalDateTime now = LocalDateTime.now();
        role.setCreatedAt(now);
        role.setUpdatedAt(now);
        return sysRoleRepository.save(role);
    }

    @Override
    @Transactional
    public SysRole updateRole(Long id, SysRole role) {
        SysRole existing = sysRoleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("角色不存在"));
        existing.setRoleName(role.getRoleName());
        existing.setRoleCode(role.getRoleCode());
        existing.setRoleType(role.getRoleType());
        existing.setDescription(role.getDescription());
        existing.setPermissions(role.getPermissions());
        existing.setUpdatedAt(LocalDateTime.now());
        return sysRoleRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteRole(Long id) {
        sysRoleRepository.deleteById(id);
    }

    @Override
    public List<SysRole> getRolesByType(RoleType type) {
        return sysRoleRepository.findByRoleType(type);
    }

    @Override
    public boolean checkPermission(Long userId, String permission) {
        SysUser user = sysUserRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        if (user.getRoleType() == RoleType.GENERAL_OFFICE) {
            return true;
        }
        if (user.getRoleType() == RoleType.ADMIN) {
            return permission != null && (permission.startsWith("config:") || permission.startsWith("process:"));
        }
        return false;
    }
}
