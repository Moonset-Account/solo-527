package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.SysPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<SysPermission, Long> {
    Optional<SysPermission> findByPermissionCode(String permissionCode);
    List<SysPermission> findByPermissionCodeIn(Collection<String> permissionCodes);
    boolean existsByPermissionCode(String permissionCode);
}
