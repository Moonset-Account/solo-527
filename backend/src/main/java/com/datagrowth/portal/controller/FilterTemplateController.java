package com.datagrowth.portal.controller;

import com.datagrowth.portal.dto.ApiResponse;
import com.datagrowth.portal.entity.FilterTemplate;
import com.datagrowth.portal.service.FilterTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/filter-templates")
@RequiredArgsConstructor
public class FilterTemplateController {

    private final FilterTemplateService templateService;

    @GetMapping
    public ApiResponse<Page<FilterTemplate>> getTemplateList(
        @RequestParam(required = false) String pageCode,
        @RequestParam(required = false) Boolean isPublic,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "useCount", "createdAt"));
        return templateService.getTemplateList(pageCode, isPublic, pageable);
    }

    @GetMapping("/my")
    public ApiResponse<List<FilterTemplate>> getMyTemplates(
        @RequestParam String pageCode
    ) {
        return templateService.getMyTemplates(pageCode);
    }

    @GetMapping("/{id}")
    public ApiResponse<FilterTemplate> getTemplateDetail(@PathVariable Long id) {
        return templateService.getTemplateDetail(id);
    }

    @GetMapping("/{id}/use")
    public ApiResponse<Map<String, Object>> useTemplate(@PathVariable Long id) {
        return templateService.useTemplate(id);
    }

    @PostMapping
    public ApiResponse<FilterTemplate> createTemplate(@RequestBody FilterTemplate template) {
        return templateService.createTemplate(template);
    }

    @PutMapping("/{id}")
    public ApiResponse<FilterTemplate> updateTemplate(
        @PathVariable Long id,
        @RequestBody FilterTemplate template
    ) {
        return templateService.updateTemplate(id, template);
    }

    @PutMapping("/{id}/rename")
    public ApiResponse<FilterTemplate> renameTemplate(
        @PathVariable Long id,
        @RequestBody Map<String, String> body
    ) {
        String newName = body.get("templateName");
        return templateService.renameTemplate(id, newName);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTemplate(@PathVariable Long id) {
        return templateService.deleteTemplate(id);
    }

    @PutMapping("/{id}/share")
    public ApiResponse<Void> shareTemplate(
        @PathVariable Long id,
        @RequestBody Map<String, List<String>> body
    ) {
        List<String> roleCodes = body.get("roleCodes");
        return templateService.shareTemplate(id, roleCodes);
    }
}
