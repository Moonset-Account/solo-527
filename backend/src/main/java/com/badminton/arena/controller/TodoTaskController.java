package com.badminton.arena.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.badminton.arena.common.PageResult;
import com.badminton.arena.common.Result;
import com.badminton.arena.dto.TodoTaskDTO;
import com.badminton.arena.entity.TodoTask;
import com.badminton.arena.service.TodoTaskService;
import com.badminton.arena.vo.TodoTaskGroupVO;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/todo-task")
public class TodoTaskController {

    @Autowired
    private TodoTaskService todoTaskService;

    @GetMapping("/page")
    public Result<PageResult<TodoTask>> page(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer priority,
            @RequestParam(required = false) Long assigneeId) {
        Page<TodoTask> page = todoTaskService.page(pageNum, pageSize, type, status, priority, assigneeId);
        PageResult<TodoTask> pageResult = new PageResult<>(
                page.getTotal(),
                page.getPages(),
                page.getCurrent(),
                page.getSize(),
                page.getRecords()
        );
        return Result.success(pageResult);
    }

    @GetMapping("/my")
    public Result<PageResult<TodoTask>> getMyTasks(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String type) {
        Page<TodoTask> page = todoTaskService.getMyTasks(pageNum, pageSize, status, type);
        PageResult<TodoTask> pageResult = new PageResult<>(
                page.getTotal(),
                page.getPages(),
                page.getCurrent(),
                page.getSize(),
                page.getRecords()
        );
        return Result.success(pageResult);
    }

    @GetMapping("/group-by-assignee")
    public Result<List<TodoTaskGroupVO>> getTaskGroupByAssignee() {
        List<TodoTaskGroupVO> list = todoTaskService.getTaskGroupByAssignee();
        return Result.success(list);
    }

    @GetMapping("/{id}")
    public Result<TodoTask> getById(@PathVariable Long id) {
        TodoTask task = todoTaskService.getTaskById(id);
        return Result.success(task);
    }

    @PostMapping
    public Result<TodoTask> create(@Valid @RequestBody TodoTaskDTO dto) {
        TodoTask task = todoTaskService.createTask(dto);
        return Result.success(task);
    }

    @PutMapping("/{id}/complete")
    public Result<TodoTask> complete(@PathVariable Long id, @RequestParam(required = false) String remark) {
        TodoTask task = todoTaskService.completeTask(id, remark);
        return Result.success(task);
    }

    @PutMapping("/{id}/cancel")
    public Result<TodoTask> cancel(@PathVariable Long id, @RequestParam(required = false) String remark) {
        TodoTask task = todoTaskService.cancelTask(id, remark);
        return Result.success(task);
    }
}
