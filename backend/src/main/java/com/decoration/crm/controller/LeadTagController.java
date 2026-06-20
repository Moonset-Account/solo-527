package com.decoration.crm.controller;

import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.LeadTag;
import com.decoration.crm.service.LeadTagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/tags")
public class LeadTagController {

    @Autowired
    private LeadTagService leadTagService;

    @GetMapping
    public Result<List<LeadTag>> getAll() {
        return Result.success(leadTagService.getAll());
    }

    @GetMapping("/category/{category}")
    public Result<List<LeadTag>> getByCategory(@PathVariable String category) {
        return Result.success(leadTagService.getByCategory(category));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<LeadTag> create(@RequestBody LeadTag tag) {
        return Result.success(leadTagService.create(tag));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<LeadTag> update(@PathVariable Long id, @RequestBody LeadTag tag) {
        return Result.success(leadTagService.update(id, tag));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        leadTagService.delete(id);
        return Result.success();
    }
}
