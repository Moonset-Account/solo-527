package com.pm.workstation.service;

import com.pm.workstation.entity.SysRole;
import com.pm.workstation.enums.RoleType;
import java.util.List;

public interface RoleService {

    List<SysRole> listRoles();

    SysRole createRole(SysRole role);

    SysRole updateRole(Long id, SysRole role);

    void deleteRole(Long id);

    List<SysRole> getRolesByType(RoleType type);

    boolean checkPermission(Long userId, String permission);
}
