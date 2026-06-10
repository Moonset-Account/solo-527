package com.courselearning.controller;

import com.courselearning.common.PageResult;
import com.courselearning.common.Result;
import com.courselearning.entity.SysUser;
import com.courselearning.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<SysUser>> list(
            @RequestParam(defaultValue = "1") Long pageNum,
            @RequestParam(defaultValue = "10") Long pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role) {
        PageResult<SysUser> result = userService.getUserList(pageNum, pageSize, keyword, role);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    public Result<SysUser> getById(@PathVariable Long id) {
        SysUser user = userService.getUserById(id);
        return Result.success(user);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal")
    public Result<Void> update(@PathVariable Long id, @RequestBody SysUser user) {
        userService.updateUser(id, user);
        return Result.success("更新成功", null);
    }

    @GetMapping("/member-info")
    public Result<Map<String, Object>> getMemberInfo() {
        Map<String, Object> result = userService.getMemberInfo();
        return Result.success(result);
    }
}
