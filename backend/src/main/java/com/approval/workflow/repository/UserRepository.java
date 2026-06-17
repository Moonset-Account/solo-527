package com.approval.workflow.repository;

import com.approval.workflow.entity.User;
import com.approval.workflow.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    List<User> findByDeptId(Long deptId);

    List<User> findByRole(RoleType role);

    List<User> findByDeptIdAndRole(Long deptId, RoleType role);
}
