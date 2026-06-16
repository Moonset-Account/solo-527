package com.pm.workstation.service;

import com.pm.workstation.dto.RoleDTO;
import com.pm.workstation.entity.SysRole;
import com.pm.workstation.enums.RoleType;
import java.util.List;

public interface RoleService {

    List<SysRole> listRoles();

    SysRole createRole(RoleDTO dto);

    SysRole updateRole(Long id, RoleDTO dto);

    void deleteRole(Long id);

    List<SysRole> getRolesByType(RoleType type);

    boolean checkPermission(Long userId, String permission);
}
