package com.datagrowth.portal.controller;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.DimensionConfig;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.service.DimensionService;
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
@RequestMapping("/dimensions")
@RequiredArgsConstructor
public class DimensionController {

    private final DimensionService dimensionService;

    @GetMapping
    public ApiResponse<Page<DimensionConfig>> getDimensionList(
        @RequestParam(required = false) String dimensionName,
        @RequestParam(required = false) Boolean enabled,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return dimensionService.getDimensionList(dimensionName, enabled, pageable);
    }

    @GetMapping("/enabled")
    public ApiResponse<List<DimensionConfig>> getEnabledDimensions() {
        return dimensionService.getEnabledDimensions();
    }

    @GetMapping("/{id}")
    public ApiResponse<DimensionConfig> getDimensionDetail(@PathVariable Long id) {
        return dimensionService.getDimensionDetail(id);
    }

    @PostMapping
    public ApiResponse<DimensionConfig> createDimension(@RequestBody DimensionConfig config) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            config.setCreatedBy(user.getUsername());
            config.setUpdatedBy(user.getUsername());
        }
        return dimensionService.createDimension(config);
    }

    @PutMapping("/{id}")
    public ApiResponse<DimensionConfig> updateDimension(@PathVariable Long id, @RequestBody DimensionConfig config) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof SysUser user) {
            config.setUpdatedBy(user.getUsername());
        }
        return dimensionService.updateDimension(id, config);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDimension(@PathVariable Long id) {
        return dimensionService.deleteDimension(id);
    }

    @PutMapping("/{id}/toggle")
    public ApiResponse<DimensionConfig> toggleDimension(
        @PathVariable Long id,
        @RequestParam boolean enabled
    ) {
        return dimensionService.toggleDimension(id, enabled);
    }
}
