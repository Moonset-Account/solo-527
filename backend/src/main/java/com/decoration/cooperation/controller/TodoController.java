package com.decoration.cooperation.controller;

import com.decoration.cooperation.common.Result;
import com.decoration.cooperation.entity.BizTodoTask;
import com.decoration.cooperation.service.TodoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public Result<List<BizTodoTask>> myTodos() {
        return Result.success(todoService.myTodos());
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Result<Long> create(@RequestBody BizTodoTask todo) {
        return Result.success(todoService.create(todo));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> complete(@PathVariable Long id) {
        todoService.complete(id);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam String status) {
        todoService.updateStatus(id, status);
        return Result.success();
    }
}
