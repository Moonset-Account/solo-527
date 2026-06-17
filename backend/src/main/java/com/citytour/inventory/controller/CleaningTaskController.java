package com.citytour.inventory.controller;

import com.citytour.inventory.dto.PageResult;
import com.citytour.inventory.dto.Result;
import com.citytour.inventory.entity.CleaningTask;
import com.citytour.inventory.service.CleaningTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/cleaning-tasks")
@RequiredArgsConstructor
public class CleaningTaskController {

    private final CleaningTaskService cleaningTaskService;

    @GetMapping
    public Result<PageResult<CleaningTask>> list(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size,
                                                @RequestParam(required = false) String hotelCode,
                                                @RequestParam(required = false) String roomNumber,
                                                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate taskDate,
                                                @RequestParam(required = false) String taskStatus,
                                                @RequestParam(required = false) String taskType,
                                                @RequestParam(required = false) String assignee) {
        return Result.success(cleaningTaskService.list(page, size, hotelCode, roomNumber,
                taskDate, taskStatus, taskType, assignee));
    }

    @GetMapping("/{id}")
    public Result<CleaningTask> getById(@PathVariable Long id) {
        return Result.success(cleaningTaskService.getById(id));
    }

    @GetMapping("/today")
    public Result<List<CleaningTask>> getTodayTasks(@RequestParam(required = false, defaultValue = "PENDING") String status) {
        return Result.success(cleaningTaskService.getTodayTasks(status));
    }

    @PostMapping
    public Result<CleaningTask> create(@RequestBody CleaningTask task,
                                       @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        task.setCreatedBy(operator);
        return Result.success(cleaningTaskService.create(task));
    }

    @PutMapping
    public Result<CleaningTask> update(@RequestBody CleaningTask task,
                                      @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        task.setUpdatedBy(operator);
        return Result.success(cleaningTaskService.update(task));
    }

    @PutMapping("/{id}/status")
    public Result<CleaningTask> updateStatus(@PathVariable Long id,
                                            @RequestParam String status,
                                            @RequestHeader(value = "X-User", defaultValue = "admin") String operator) {
        return Result.success(cleaningTaskService.updateStatus(id, status, operator));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        cleaningTaskService.delete(id);
        return Result.success();
    }
}
