package com.emailgenerator.controller;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.common.Result;
import com.emailgenerator.entity.EmailRecord;
import com.emailgenerator.entity.EmailRecordVersion;
import com.emailgenerator.service.EmailRecordService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    @PutMapping("/{id}/draft")
    public Result<EmailRecord> updateDraft(@PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        String operator = "admin";
        return Result.success(emailRecordService.updateDraft(
            id,
            body.get("subject"),
            body.get("content"),
            body.get("recipientEmail"),
            body.get("recipientName"),
            body.get("changeLog"),
            operator
        ));
    }

    @GetMapping("/{id}/versions")
    public Result<List<EmailRecordVersion>> listVersions(@PathVariable Long id) {
        return Result.success(emailRecordService.listVersions(id));
    }

    @GetMapping("/{id}/versions/{version}")
    public Result<EmailRecordVersion> getVersion(@PathVariable Long id,
                                                  @PathVariable Integer version) {
        return Result.success(emailRecordService.getVersion(id, version));
    }

    @PostMapping("/{id}/versions/{version}/revert")
    public Result<EmailRecord> revertToVersion(@PathVariable Long id,
                                                @PathVariable Integer version) {
        String operator = "admin";
        return Result.success(emailRecordService.revertToVersion(id, version, operator));
    }

    @GetMapping("/stats/by-legal-owner")
    public Result<Map<String, Object>> getStatsByLegalOwner() {
        return Result.success(emailRecordService.getStatsByLegalOwner());
    }
}
