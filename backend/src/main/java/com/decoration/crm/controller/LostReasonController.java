package com.decoration.crm.controller;

import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.LostReason;
import com.decoration.crm.service.LostReasonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/lost-reasons")
public class LostReasonController {

    @Autowired
    private LostReasonService lostReasonService;

    @GetMapping
    public Result<List<LostReason>> getAll() {
        return Result.success(lostReasonService.getAll());
    }

    @GetMapping("/enabled")
    public Result<List<LostReason>> getEnabled() {
        return Result.success(lostReasonService.getEnabled());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<LostReason> create(@RequestBody LostReason reason) {
        return Result.success(lostReasonService.create(reason));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<LostReason> update(@PathVariable Long id, @RequestBody LostReason reason) {
        return Result.success(lostReasonService.update(id, reason));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        lostReasonService.delete(id);
        return Result.success();
    }
}
