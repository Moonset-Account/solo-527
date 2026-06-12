package com.finance.approval.repository;

import com.finance.approval.entity.SysUserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SysUserRoleRepository extends JpaRepository<SysUserRole, Long> {

    List<SysUserRole> findByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM SysUserRole ur WHERE ur.userId = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM SysRole r JOIN SysUserRole ur ON r.id = ur.roleId WHERE ur.userId = :userId")
    List<com.finance.approval.entity.SysRole> findRolesByUserId(@Param("userId") Long userId);
}
