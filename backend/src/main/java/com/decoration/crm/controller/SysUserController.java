package com.decoration.crm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.SysUser;
import com.decoration.crm.service.SysUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class SysUserController {

    @Autowired
    private SysUserService sysUserService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<IPage<SysUser>> getPage(PageQuery query) {
        return Result.success(sysUserService.getPage(query));
    }

    @GetMapping("/all")
    public Result<List<SysUser>> getAll() {
        return Result.success(sysUserService.getAll());
    }

    @GetMapping("/role/{role}")
    public Result<List<SysUser>> getByRole(@PathVariable String role) {
        return Result.success(sysUserService.getByRole(role));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<SysUser> getById(@PathVariable Long id) {
        return Result.success(sysUserService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<SysUser> create(@RequestBody SysUser user) {
        return Result.success(sysUserService.create(user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<SysUser> update(@PathVariable Long id, @RequestBody SysUser user) {
        return Result.success(sysUserService.update(id, user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> delete(@PathVariable Long id) {
        sysUserService.delete(id);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        sysUserService.updateStatus(id, body.get("status"));
        return Result.success();
    }
}
