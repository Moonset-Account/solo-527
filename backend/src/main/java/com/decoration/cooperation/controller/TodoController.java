package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.PageQuery;
import com.decoration.cooperation.common.PageResult;
import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.entity.BizTodoTask;
import com.decoration.cooperation.entity.SysUser;
import com.decoration.cooperation.service.BizTodoTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/todos")
@RequiredArgsConstructor
public class TodoController {

    private final BizTodoTaskService bizTodoTaskService;

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('todo:my')")
    public Result<PageResult<BizTodoTask>> myTodos(PageQuery pageQuery) {
        SysUser user = (SysUser) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return Result.success(bizTodoTaskService.listMyTodos(pageQuery, user.getId()));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('todo:create')")
    public Result<Long> create(@RequestBody BizTodoTask todo) {
        return Result.success(bizTodoTaskService.createTodo(todo).getId());
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('todo:edit')")
    public Result<Void> complete(@PathVariable Long id, @RequestParam(required = false) String remark) {
        bizTodoTaskService.completeTodo(id, remark);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('todo:edit')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        bizTodoTaskService.updateStatus(id, status);
        return Result.success();
    }
}
