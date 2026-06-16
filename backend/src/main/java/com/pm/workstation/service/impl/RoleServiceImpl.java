package com.pm.workstation.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pm.workstation.dto.RoleDTO;
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

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Autowired
    private SysRoleRepository sysRoleRepository;

    @Autowired
    private SysUserRepository sysUserRepository;

    @Override
    public List<SysRole> listRoles() {
        return sysRoleRepository.findAll();
    }

    @Override
    @Transactional
    public SysRole createRole(RoleDTO dto) {
        SysRole role = new SysRole();
        role.setRoleName(dto.getRoleName());
        role.setRoleCode(dto.getRoleCode());
        role.setRoleType(dto.getRoleType());
        role.setDescription(dto.getDescription());
        if (dto.getPermissions() != null) {
            try {
                role.setPermissions(OBJECT_MAPPER.writeValueAsString(dto.getPermissions()));
            } catch (JsonProcessingException e) {
                throw new RuntimeException("权限数据序列化失败", e);
            }
        }
        LocalDateTime now = LocalDateTime.now();
        role.setCreatedAt(now);
        role.setUpdatedAt(now);
        return sysRoleRepository.save(role);
    }

    @Override
    @Transactional
    public SysRole updateRole(Long id, RoleDTO dto) {
        SysRole existing = sysRoleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("角色不存在"));
        if (dto.getRoleName() != null) {
            existing.setRoleName(dto.getRoleName());
        }
        if (dto.getRoleCode() != null) {
            existing.setRoleCode(dto.getRoleCode());
        }
        if (dto.getRoleType() != null) {
            existing.setRoleType(dto.getRoleType());
        }
        if (dto.getDescription() != null) {
            existing.setDescription(dto.getDescription());
        }
        if (dto.getPermissions() != null) {
            try {
                existing.setPermissions(OBJECT_MAPPER.writeValueAsString(dto.getPermissions()));
            } catch (JsonProcessingException e) {
                throw new RuntimeException("权限数据序列化失败", e);
            }
        }
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
