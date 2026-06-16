package com.pm.workstation.repository;

import com.pm.workstation.entity.SysRole;
import com.pm.workstation.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SysRoleRepository extends JpaRepository<SysRole, Long> {

    Optional<SysRole> findByRoleCode(String roleCode);

    List<SysRole> findByRoleType(RoleType roleType);
}
