package com.pm.workstation.repository;

import com.pm.workstation.entity.SysUser;
import com.pm.workstation.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SysUserRepository extends JpaRepository<SysUser, Long> {

    Optional<SysUser> findByUsername(String username);

    List<SysUser> findByRoleType(RoleType roleType);

    List<SysUser> findByStatus(Integer status);

    List<SysUser> findByDepartment(String department);

    boolean existsByUsername(String username);

    List<SysUser> findByUsernameContainingOrRealNameContaining(String username, String realName);
}
