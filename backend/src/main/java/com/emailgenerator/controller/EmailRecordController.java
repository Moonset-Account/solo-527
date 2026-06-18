package com.emailgenerator.controller;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.common.Result;
import com.emailgenerator.entity.EmailRecord;
import com.emailgenerator.service.EmailRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/records")
public class EmailRecordController {

    private final EmailRecordService emailRecordService;

    public EmailRecordController(EmailRecordService emailRecordService) {
        this.emailRecordService = emailRecordService;
    }

    @GetMapping
    public Result<PageResult<EmailRecord>> list(BaseQuery query,
                                                @RequestParam(required = false) Long taskId) {
        return Result.success(emailRecordService.list(query, taskId));
    }

    @GetMapping("/{id}")
    public Result<EmailRecord> getById(@PathVariable Long id) {
        return Result.success(emailRecordService.getById(id));
    }

    @GetMapping("/stats/by-legal-owner")
    public Result<Map<String, Object>> getStatsByLegalOwner() {
        return Result.success(emailRecordService.getStatsByLegalOwner());
    }
}
