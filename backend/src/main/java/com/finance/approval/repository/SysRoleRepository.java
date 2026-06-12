package com.finance.approval.repository;

import com.finance.approval.entity.SysRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SysRoleRepository extends JpaRepository<SysRole, Long> {

    List<SysRole> findByIdIn(List<Long> ids);

    Optional<SysRole> findByRoleCode(com.finance.approval.enums.RoleCode roleCode);
}
