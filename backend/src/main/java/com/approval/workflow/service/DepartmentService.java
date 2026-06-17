package com.approval.workflow.service;

import com.approval.workflow.entity.Department;
import com.approval.workflow.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("部门不存在"));
    }

    public Department createDepartment(Department department) {
        if (departmentRepository.existsByDeptCode(department.getDeptCode())) {
            throw new RuntimeException("部门编码已存在");
        }
        return departmentRepository.save(department);
    }

    public Department updateDepartment(Long id, Department department) {
        Department existing = getDepartmentById(id);
        if (department.getDeptName() != null) {
            existing.setDeptName(department.getDeptName());
        }
        if (department.getDescription() != null) {
            existing.setDescription(department.getDescription());
        }
        if (department.getManagerId() != null) {
            existing.setManagerId(department.getManagerId());
        }
        return departmentRepository.save(existing);
    }

    public void deleteDepartment(Long id) {
        departmentRepository.deleteById(id);
    }

    public Department getDepartmentByCode(String code) {
        return departmentRepository.findByDeptCode(code)
                .orElseThrow(() -> new RuntimeException("部门不存在"));
    }
}
