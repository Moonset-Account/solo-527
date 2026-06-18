package com.emailgenerator.controller;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.common.Result;
import com.emailgenerator.dto.EmailTemplateDTO;
import com.emailgenerator.entity.EmailTemplate;
import com.emailgenerator.entity.EmailTemplateVersion;
import com.emailgenerator.service.EmailTemplateService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/templates")
public class EmailTemplateController {

    private final EmailTemplateService templateService;

    public EmailTemplateController(EmailTemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public Result<PageResult<EmailTemplate>> list(BaseQuery query) {
        return Result.success(templateService.list(query));
    }

    @GetMapping("/{id}")
    public Result<EmailTemplate> getById(@PathVariable Long id) {
        return Result.success(templateService.getById(id));
    }

    @PostMapping
    public Result<EmailTemplate> create(@RequestBody EmailTemplateDTO dto) {
        String operator = "admin";
        return Result.success(templateService.create(dto, operator));
    }

    @PutMapping
    public Result<EmailTemplate> update(@RequestBody EmailTemplateDTO dto) {
        String operator = "admin";
        return Result.success(templateService.update(dto, operator));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        templateService.delete(id);
        return Result.success();
    }

    @GetMapping("/{id}/versions")
    public Result<List<EmailTemplateVersion>> listVersions(@PathVariable Long id) {
        return Result.success(templateService.listVersions(id));
    }

    @GetMapping("/{id}/versions/{version}")
    public Result<EmailTemplateVersion> getVersion(@PathVariable Long id, @PathVariable Integer version) {
        return Result.success(templateService.getVersion(id, version));
    }

    @PostMapping("/{id}/versions/{version}/revert")
    public Result<EmailTemplate> revertToVersion(@PathVariable Long id, @PathVariable Integer version) {
        String operator = "admin";
        return Result.success(templateService.revertToVersion(id, version, operator));
    }
}
