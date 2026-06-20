package com.decoration.crm.controller;

import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.PublicSeaRule;
import com.decoration.crm.service.PublicSeaRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/public-sea-rules")
public class PublicSeaRuleController {

    @Autowired
    private PublicSeaRuleService publicSeaRuleService;

    @GetMapping
    public Result<List<PublicSeaRule>> getAll() {
        return Result.success(publicSeaRuleService.getAll());
    }

    @GetMapping("/enabled")
    public Result<List<PublicSeaRule>> getEnabled() {
        return Result.success(publicSeaRuleService.getEnabled());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<PublicSeaRule> create(@RequestBody PublicSeaRule rule) {
        return Result.success(publicSeaRuleService.create(rule));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<PublicSeaRule> update(@PathVariable Long id, @RequestBody PublicSeaRule rule) {
        return Result.success(publicSeaRuleService.update(id, rule));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        publicSeaRuleService.delete(id);
        return Result.success();
    }
}
