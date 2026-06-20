package com.property.workorder.controller;

import com.property.workorder.common.PageResult;
import com.property.workorder.common.Result;
import com.property.workorder.entity.InspectionTask;
import com.property.workorder.service.ExportService;
import com.property.workorder.service.InspectionService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;
    private final ExportService exportService;

    @GetMapping("/query")
    public Result<PageResult<InspectionTask>> queryTasks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String inspectionType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate planDate,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size) {
        return Result.success(inspectionService.queryTasks(title, inspectionType, status, planDate, assigneeId, current, size));
    }

    @GetMapping("/export")
    public void exportTasks(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String inspectionType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate planDate,
            @RequestParam(required = false) Long assigneeId,
            HttpServletResponse response) throws IOException {
        List<InspectionTask> list = inspectionService.queryTasksForExport(title, inspectionType, status, planDate, assigneeId);
        exportService.exportInspections(list, response);
    }

    @PostMapping
    public Result<InspectionTask> createTask(@RequestBody InspectionTask task) {
        return Result.success(inspectionService.createTask(task));
    }

    @PutMapping("/{id}/start")
    public Result<InspectionTask> startTask(@PathVariable Long id) {
        return Result.success(inspectionService.startTask(id));
    }

    @PutMapping("/{id}/complete")
    public Result<InspectionTask> completeTask(
            @PathVariable Long id,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String issuesFound) {
        return Result.success(inspectionService.completeTask(id, result, issuesFound));
    }
}
