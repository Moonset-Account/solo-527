package com.approval.workflow.repository;

import com.approval.workflow.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findByDeptCode(String deptCode);

    boolean existsByDeptCode(String deptCode);
}
