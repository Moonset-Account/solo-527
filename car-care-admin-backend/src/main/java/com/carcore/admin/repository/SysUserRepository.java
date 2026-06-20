package com.carcore.admin.repository;

import com.carcore.admin.entity.SysUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SysUserRepository extends JpaRepository<SysUser, Long> {

    Optional<SysUser> findByUsername(String username);

    Optional<SysUser> findByPhone(String phone);

    List<SysUser> findByRoleCode(String roleCode);

    List<SysUser> findByStatus(Integer status);
}
