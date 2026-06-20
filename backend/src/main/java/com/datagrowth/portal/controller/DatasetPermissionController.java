package com.datagrowth.portal.controller;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.DatasetPermission;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.service.DatasetPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dataset-permissions")
@RequiredArgsConstructor
public class DatasetPermissionController {

    private final DatasetPermissionService permissionService;

    @GetMapping
    public ApiResponse<Page<DatasetPermission>> getPermissionList(
        @RequestParam(required = false) String datasetCode,
        @RequestParam(required = false) Boolean enabled,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return permissionService.getPermissionList(datasetCode, enabled, pageable);
    }

    @GetMapping("/my")
    public ApiResponse<List<DatasetPermission>> getMyPermissions() {
        return permissionService.getMyPermissions();
    }

    @GetMapping("/{id}")
    public ApiResponse<DatasetPermission> getPermissionDetail(@PathVariable Long id) {
        return permissionService.getPermissionDetail(id);
    }

    @PostMapping
    public ApiResponse<DatasetPermission> createPermission(@RequestBody DatasetPermission permission) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            permission.setCreatedBy(user.getUsername());
            permission.setUpdatedBy(user.getUsername());
        }
        return permissionService.createPermission(permission);
    }

    @PutMapping("/{id}")
    public ApiResponse<DatasetPermission> updatePermission(
        @PathVariable Long id,
        @RequestBody DatasetPermission permission
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            permission.setUpdatedBy(user.getUsername());
        }
        return permissionService.updatePermission(id, permission);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePermission(@PathVariable Long id) {
        return permissionService.deletePermission(id);
    }

    @PutMapping("/{id}/toggle")
    public ApiResponse<DatasetPermission> togglePermission(
        @PathVariable Long id,
        @RequestParam boolean enabled
    ) {
        return permissionService.togglePermission(id, enabled);
    }
}
