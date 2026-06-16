package com.rider.analyzer.controller;

import com.rider.analyzer.common.Result;
import com.rider.analyzer.dto.ExceptionRecordDTO;
import com.rider.analyzer.entity.ExceptionRecord;
import com.rider.analyzer.service.ExceptionRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            @RequestParam String handlerName,
            @RequestParam(required = false) String tempAnomalyReason,
            @RequestParam(required = false) Integer handleDurationMin) {
        return Result.success(exceptionRecordService.handleException(id, handlerName, tempAnomalyReason, handleDurationMin));
    }

    @GetMapping("/list")
    public Result<List<ExceptionRecordDTO>> getExceptionRecords(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        return Result.success(exceptionRecordService.getExceptionRecords(type, status));
    }
}
