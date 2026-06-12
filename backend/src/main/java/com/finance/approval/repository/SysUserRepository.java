package com.finance.approval.repository;

import com.finance.approval.entity.SysUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SysUserRepository extends JpaRepository<SysUser, Long> {

    Optional<SysUser> findByUsername(String username);

    boolean existsByUsername(String username);

    @Query("SELECT u FROM SysUser u WHERE (:keyword IS NULL OR :keyword = '' OR " +
           "u.username LIKE %:keyword% OR u.realName LIKE %:keyword% OR u.email LIKE %:keyword%)")
    Page<SysUser> findByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT u FROM SysUser u JOIN SysUserRole ur ON u.id = ur.userId " +
           "JOIN SysRole r ON ur.roleId = r.id WHERE r.roleCode = :roleCode")
    List<SysUser> findByRoleCode(@Param("roleCode") com.finance.approval.enums.RoleCode roleCode);
}
