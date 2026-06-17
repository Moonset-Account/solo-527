package com.citytour.inventory.controller;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.dto.Result;
import com.citytour.inventory.entity.ConfigVersion;
import com.citytour.inventory.service.ConfigVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/configs")
@RequiredArgsConstructor
public class ConfigVersionController {

    private final ConfigVersionService configVersionService;

    @GetMapping
    public Result<PageResult<ConfigVersion>> list(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size,
                                               @RequestParam(required = false) String configType,
                                               @RequestParam(required = false) String configKey,
                                               @RequestParam(required = false) String status) {
        return Result.success(configVersionService.list(page, size, configType, configKey, status));
    }

    @GetMapping("/{id}")
    public Result<ConfigVersion> getById(@PathVariable Long id) {
        return Result.success(configVersionService.getById(id));
    }

    @GetMapping("/versions")
    public Result<List<ConfigVersion>> getVersions(@RequestParam String configType,
                                                    @RequestParam String configKey) {
        return Result.success(configVersionService.getVersions(configType, configKey));
    }

    @GetMapping("/active")
    public Result<ConfigVersion> getActiveConfig(@RequestParam String configType,
                                                @RequestParam String configKey) {
        return Result.success(configVersionService.getActiveConfig(configType, configKey));
    }

    @PostMapping
    public Result<ConfigVersion> createVersion(@RequestBody ConfigVersion config,
                                              @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        return Result.success(configVersionService.createVersion(config, operator));
    }

    @PutMapping("/{id}/status")
    public Result<ConfigVersion> updateStatus(@PathVariable Long id,
                                           @RequestParam String status,
                                           @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        return Result.success(configVersionService.updateStatus(id, status, operator));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        configVersionService.delete(id);
        return Result.success();
    }
}
