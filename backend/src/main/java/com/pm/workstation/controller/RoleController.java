package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.entity.SysRole;
import com.pm.workstation.enums.RoleType;
import com.pm.workstation.service.RoleService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @PostMapping
    public ApiResponseDTO<SysRole> createRole(@RequestBody SysRole role) {
        return ApiResponseDTO.success(roleService.createRole(role));
    }

    @PutMapping("/{id}")
    public ApiResponseDTO<SysRole> updateRole(@PathVariable Long id, @RequestBody SysRole role) {
        return ApiResponseDTO.success(roleService.updateRole(id, role));
    }

    @DeleteMapping("/{id}")
    public ApiResponseDTO<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ApiResponseDTO.success(null);
    }

    @GetMapping("/type/{type}")
    public ApiResponseDTO<List<SysRole>> getRolesByType(@PathVariable RoleType type) {
        return ApiResponseDTO.success(roleService.getRolesByType(type));
    }
}
