package com.approval.workflow.controller;

import com.approval.workflow.dto.ApiResponse;
import com.approval.workflow.entity.Department;
import com.approval.workflow.service.DepartmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public ApiResponse<List<Department>> getAllDepartments() {
        List<Department> departments = departmentService.getAllDepartments();
        return ApiResponse.success(departments);
    }

    @GetMapping("/{id}")
    public ApiResponse<Department> getDepartmentById(@PathVariable Long id) {
        try {
            Department department = departmentService.getDepartmentById(id);
            return ApiResponse.success(department);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<Department> createDepartment(@RequestBody Department department) {
        try {
            Department saved = departmentService.createDepartment(department);
            return ApiResponse.success(saved);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<Department> updateDepartment(@PathVariable Long id,
                                                     @RequestBody Department department) {
        try {
            Department updated = departmentService.updateDepartment(id, department);
            return ApiResponse.success(updated);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ApiResponse.success();
    }
}
