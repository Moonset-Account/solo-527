package com.rider.analyzer.controller;

import com.rider.analyzer.common.Result;
import com.rider.analyzer.dto.ExceptionRecordDTO;
import com.rider.analyzer.dto.ExceptionRecordVO;
import com.rider.analyzer.dto.PageResult;
import com.rider.analyzer.entity.ExceptionRecord;
import com.rider.analyzer.service.ExceptionRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exceptions")
@RequiredArgsConstructor
public class ExceptionRecordController {

    private final ExceptionRecordService exceptionRecordService;

    @PostMapping
    public Result<ExceptionRecord> createRecord(@Valid @RequestBody ExceptionRecordDTO dto) {
        return Result.success(exceptionRecordService.createRecord(dto));
    }

    @PutMapping("/{id}/handle")
    public Result<ExceptionRecord> handleException(
            @PathVariable Long id,
            @RequestBody ExceptionRecordDTO dto) {
        return Result.success(exceptionRecordService.handleException(
                id, dto.getHandlerName(), dto.getTempAnomalyReason(), dto.getHandleDurationMin()));
    }

    @GetMapping("/list")
    public Result<PageResult<ExceptionRecordVO>> getExceptionRecords(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return Result.success(exceptionRecordService.getExceptionRecords(type, status, page, pageSize));
    }
}
