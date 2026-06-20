package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.SysRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<SysRole, Long> {
    Optional<SysRole> findByRoleCode(String roleCode);
    boolean existsByRoleCode(String roleCode);
}
