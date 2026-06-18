package com.emailgenerator.controller;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.common.Result;
import com.emailgenerator.dto.BatchTaskDTO;
import com.emailgenerator.entity.BatchTask;
import com.emailgenerator.service.BatchTaskService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tasks")
public class BatchTaskController {

    private final BatchTaskService batchTaskService;

    public BatchTaskController(BatchTaskService batchTaskService) {
        this.batchTaskService = batchTaskService;
    }

    @GetMapping
    public Result<PageResult<BatchTask>> list(BaseQuery query) {
        return Result.success(batchTaskService.list(query));
    }

    @GetMapping("/{id}")
    public Result<BatchTask> getById(@PathVariable Long id) {
        return Result.success(batchTaskService.getById(id));
    }

    @PostMapping
    public Result<BatchTask> create(@RequestBody BatchTaskDTO dto) {
        String operator = "admin";
        return Result.success(batchTaskService.create(dto, operator));
    }

    @PutMapping
    public Result<BatchTask> update(@RequestBody BatchTaskDTO dto) {
        String operator = "admin";
        return Result.success(batchTaskService.update(dto, operator));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        batchTaskService.delete(id);
        return Result.success();
    }

    @PostMapping("/{id}/start")
    public Result<BatchTask> startTask(@PathVariable Long id) {
        String operator = "admin";
        return Result.success(batchTaskService.startTask(id, operator));
    }
}
