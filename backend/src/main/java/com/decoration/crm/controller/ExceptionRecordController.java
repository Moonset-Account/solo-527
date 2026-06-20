package com.decoration.crm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.decoration.crm.dto.PageQuery;
import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.ExceptionRecord;
import com.decoration.crm.service.ExceptionRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/exceptions")
public class ExceptionRecordController {

    @Autowired
    private ExceptionRecordService exceptionRecordService;

    @GetMapping
    public Result<IPage<ExceptionRecord>> getPage(PageQuery query) {
        return Result.success(exceptionRecordService.getPage(query));
    }

    @GetMapping("/{id}")
    public Result<ExceptionRecord> getById(@PathVariable Long id) {
        return Result.success(exceptionRecordService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<ExceptionRecord> create(@RequestBody ExceptionRecord record) {
        return Result.success(exceptionRecordService.create(record));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<ExceptionRecord> update(@PathVariable Long id, @RequestBody ExceptionRecord record) {
        return Result.success(exceptionRecordService.update(id, record));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        exceptionRecordService.delete(id);
        return Result.success();
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> resolve(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String overdueReason = body.get("overdueReason") != null ? body.get("overdueReason").toString() : null;
        Integer handlingCostMinutes = body.get("handlingCostMinutes") != null ?
                Integer.valueOf(body.get("handlingCostMinutes").toString()) : null;
        exceptionRecordService.resolve(id, overdueReason, handlingCostMinutes);
        return Result.success();
    }
}
