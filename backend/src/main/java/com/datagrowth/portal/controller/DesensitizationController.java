package com.datagrowth.portal.controller;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.DesensitizationConfig;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.service.DesensitizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/desensitization")
@RequiredArgsConstructor
public class DesensitizationController {

    private final DesensitizationService desensitizationService;

    @GetMapping
    public ApiResponse<Page<DesensitizationConfig>> getConfigList(
        @RequestParam(required = false) String datasetCode,
        @RequestParam(required = false) Boolean enabled,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(desensitizationService.getConfigList(datasetCode, enabled, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<DesensitizationConfig> getConfigDetail(@PathVariable Long id) {
        return desensitizationService.getConfigList(null, null, Pageable.unpaged())
            .getData()
            .getContent()
            .stream()
            .filter(c -> c.getId().equals(id))
            .findFirst()
            .map(ApiResponse::success)
            .orElse(ApiResponse.error("脱敏配置不存在"));
    }

    @PostMapping
    public ApiResponse<DesensitizationConfig> createConfig(@RequestBody DesensitizationConfig config) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            config.setCreatedBy(user.getUsername());
            config.setUpdatedBy(user.getUsername());
        }
        return ApiResponse.success("脱敏配置已创建", desensitizationService.createConfig(config));
    }

    @PutMapping("/{id}")
    public ApiResponse<DesensitizationConfig> updateConfig(
        @PathVariable Long id,
        @RequestBody DesensitizationConfig config
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            config.setUpdatedBy(user.getUsername());
        }
        return ApiResponse.success("脱敏配置已更新", desensitizationService.updateConfig(id, config));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteConfig(@PathVariable Long id) {
        desensitizationService.deleteConfig(id);
        return ApiResponse.success("脱敏配置已删除", null);
    }

    @PostMapping("/apply")
    public ApiResponse<Map<String, Object>> applyDesensitization(
        @RequestParam String datasetCode,
        @RequestBody Map<String, Object> data,
        @RequestParam(defaultValue = "PUBLIC") String userDataLevel
    ) {
        return ApiResponse.success(desensitizationService.desensitize(datasetCode, data, userDataLevel));
    }

    @PostMapping("/apply-list")
    public ApiResponse<List<Map<String, Object>>> applyDesensitizationList(
        @RequestParam String datasetCode,
        @RequestBody List<Map<String, Object>> dataList,
        @RequestParam(defaultValue = "PUBLIC") String userDataLevel
    ) {
        return ApiResponse.success(desensitizationService.desensitizeList(datasetCode, dataList, userDataLevel));
    }
}
