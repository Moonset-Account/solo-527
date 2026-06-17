package com.sales.email.controller;

import com.sales.email.common.PageResult;
import com.sales.email.common.Result;
import com.sales.email.dto.EmailDraftDTO;
import com.sales.email.dto.EmailDraftQueryDTO;
import com.sales.email.entity.EmailDraft;
import com.sales.email.entity.EmailVersion;
import com.sales.email.service.EmailDraftService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/email-draft")
@RequiredArgsConstructor
public class EmailDraftController {

    private final EmailDraftService draftService;

    @PostMapping
    public Result<EmailDraft> createDraft(@RequestBody EmailDraftDTO dto) {
        return Result.success(draftService.createDraft(dto));
    }

    @PutMapping("/{id}")
    public Result<EmailDraft> saveDraft(@PathVariable Long id, @RequestBody EmailDraftDTO dto) {
        return Result.success(draftService.saveDraft(id, dto));
    }

    @PostMapping("/{id}/ai-generate")
    public Result<EmailDraft> generateByAI(@PathVariable Long id, @RequestBody EmailDraftDTO dto) {
        return Result.success(draftService.generateByAI(id, dto));
    }

    @PostMapping("/query")
    public Result<PageResult<EmailDraft>> queryDrafts(@RequestBody EmailDraftQueryDTO query) {
        return Result.success(draftService.queryDrafts(query));
    }

    @GetMapping("/{id}")
    public Result<EmailDraft> getDraftById(@PathVariable Long id) {
        return Result.success(draftService.getDraftById(id));
    }

    @GetMapping("/{id}/versions")
    public Result<List<EmailVersion>> getDraftVersions(@PathVariable Long id) {
        return Result.success(draftService.getDraftVersions(id));
    }

    @GetMapping("/{id}/versions/{version}")
    public Result<EmailVersion> getDraftVersion(@PathVariable Long id, @PathVariable Integer version) {
        return Result.success(draftService.getDraftVersion(id, version));
    }

    @PostMapping("/{id}/revert/{version}")
    public Result<EmailDraft> revertToVersion(@PathVariable Long id, @PathVariable Integer version,
                                               @RequestBody Map<String, Object> body) {
        Long operatorId = body.get("operatorId") != null ? Long.valueOf(body.get("operatorId").toString()) : null;
        String operatorName = body.get("operatorName") != null ? body.get("operatorName").toString() : null;
        return Result.success(draftService.revertToVersion(id, version, operatorId, operatorName));
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String status = body.get("status") != null ? body.get("status").toString() : null;
        String remark = body.get("remark") != null ? body.get("remark").toString() : null;
        draftService.updateStatus(id, status, remark);
        return Result.success();
    }
}
