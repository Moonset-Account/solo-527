package com.sales.email.controller;

import com.sales.email.common.Result;
import com.sales.email.entity.PromptTemplate;
import com.sales.email.entity.PromptVersion;
import com.sales.email.service.PromptTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/prompt")
@RequiredArgsConstructor
public class PromptTemplateController {

    private final PromptTemplateService templateService;

    @GetMapping("/templates")
    public Result<List<PromptTemplate>> getAllTemplates() {
        return Result.success(templateService.getAllTemplates());
    }

    @GetMapping("/template/{templateId}/versions")
    public Result<List<PromptVersion>> getTemplateVersions(@PathVariable Long templateId) {
        return Result.success(templateService.getTemplateVersions(templateId));
    }

    @GetMapping("/template/{templateId}/active-version")
    public Result<PromptVersion> getActiveVersion(@PathVariable Long templateId) {
        return Result.success(templateService.getActiveVersion(templateId));
    }

    @GetMapping("/version/{versionId}")
    public Result<PromptVersion> getVersionById(@PathVariable Long versionId) {
        return Result.success(templateService.getVersionById(versionId));
    }

    @PostMapping("/template")
    public Result<PromptTemplate> addTemplate(@RequestBody PromptTemplate template,
                                               @RequestParam Long operatorId,
                                               @RequestParam String operatorName) {
        return Result.success(templateService.addTemplate(template, operatorId, operatorName));
    }

    @PostMapping("/version")
    public Result<PromptVersion> addVersion(@RequestBody PromptVersion version) {
        return Result.success(templateService.addVersion(version, version.getOperatorId(), version.getOperatorName()));
    }

    @PutMapping("/version/{versionId}/status")
    public Result<Void> updateVersionStatus(@PathVariable Long versionId, @RequestBody Map<String, Object> body) {
        String status = (String) body.get("status");
        Long operatorId = body.get("operatorId") != null ? Long.valueOf(body.get("operatorId").toString()) : null;
        String operatorName = (String) body.get("operatorName");
        String sourceOrderNo = (String) body.get("sourceOrderNo");
        String remark = (String) body.get("remark");
        templateService.updateVersionStatus(versionId, status, operatorId, operatorName, sourceOrderNo, remark);
        return Result.success();
    }
}
