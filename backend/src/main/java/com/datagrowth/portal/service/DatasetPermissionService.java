package com.datagrowth.portal.service;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.DatasetPermission;
import com.datagrowth.portal.entity.SysRole;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.repository.DatasetPermissionRepository;
import com.datagrowth.portal.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DatasetPermissionService {

    private final DatasetPermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "dataset_perm:";

    public ApiResponse<Page<DatasetPermission>> getPermissionList(
        String datasetCode, Boolean enabled, Pageable pageable
    ) {
        Page<DatasetPermission> result;
        
        if (datasetCode != null) {
            result = permissionRepository.findByDatasetCodeContaining(datasetCode, pageable);
        } else if (enabled != null) {
            result = permissionRepository.findByEnabled(enabled, pageable);
        } else {
            result = permissionRepository.findAll(pageable);
        }
        
        return ApiResponse.success(result);
    }

    @SuppressWarnings("unchecked")
    public ApiResponse<List<DatasetPermission>> getMyPermissions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof SysUser user)) {
            return ApiResponse.error("用户未登录");
        }
        
        Set<Long> roleIds = user.getRoles().stream()
            .map(SysRole::getId)
            .collect(Collectors.toSet());
        
        String cacheKey = CACHE_PREFIX + "user:" + user.getId();
        List<DatasetPermission> cached = (List<DatasetPermission>) redisTemplate.opsForValue().get(cacheKey);
        
        if (cached != null) {
            return ApiResponse.success(cached);
        }
        
        List<DatasetPermission> result = permissionRepository.findByRoleIdInAndEnabledTrue(roleIds.stream().toList());
        redisTemplate.opsForValue().set(cacheKey, result, 30, TimeUnit.MINUTES);
        
        return ApiResponse.success(result);
    }

    public ApiResponse<DatasetPermission> getPermissionDetail(Long id) {
        return permissionRepository.findById(id)
            .map(ApiResponse::success)
            .orElse(ApiResponse.error("数据集权限不存在"));
    }

    public ApiResponse<DatasetPermission> createPermission(DatasetPermission permission) {
        permission.setEnabled(true);
        DatasetPermission saved = permissionRepository.save(permission);
        clearCache();
        return ApiResponse.success("数据集权限已创建", saved);
    }

    public ApiResponse<DatasetPermission> updatePermission(Long id, DatasetPermission permission) {
        return permissionRepository.findById(id)
            .map(existing -> {
                existing.setDatasetCode(permission.getDatasetCode());
                existing.setDatasetName(permission.getDatasetName());
                existing.setDescription(permission.getDescription());
                existing.setDataLevel(permission.getDataLevel());
                existing.setRoleId(permission.getRoleId());
                existing.setPermissionType(permission.getPermissionType());
                existing.setRowFilterCondition(permission.getRowFilterCondition());
                existing.setColumnMaskConfig(permission.getColumnMaskConfig());
                existing.setEffectiveCondition(permission.getEffectiveCondition());
                existing.setEnabled(permission.getEnabled());
                existing.setUpdatedBy(permission.getUpdatedBy());
                DatasetPermission saved = permissionRepository.save(existing);
                clearCache();
                return ApiResponse.success("数据集权限已更新", saved);
            })
            .orElse(ApiResponse.error("数据集权限不存在"));
    }

    public ApiResponse<Void> deletePermission(Long id) {
        if (permissionRepository.existsById(id)) {
            permissionRepository.deleteById(id);
            clearCache();
            return ApiResponse.success("数据集权限已删除", null);
        }
        return ApiResponse.error("数据集权限不存在");
    }

    public ApiResponse<DatasetPermission> togglePermission(Long id, boolean enabled) {
        return permissionRepository.findById(id)
            .map(perm -> {
                perm.setEnabled(enabled);
                DatasetPermission saved = permissionRepository.save(perm);
                clearCache();
                return ApiResponse.success(enabled ? "权限已启用" : "权限已禁用", saved);
            })
            .orElse(ApiResponse.error("数据集权限不存在"));
    }

    private void clearCache() {
        Set<String> keys = redisTemplate.keys(CACHE_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
