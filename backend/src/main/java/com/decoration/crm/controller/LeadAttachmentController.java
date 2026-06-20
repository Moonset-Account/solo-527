package com.decoration.crm.controller;

import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.LeadAttachment;
import com.decoration.crm.service.LeadAttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/attachments")
public class LeadAttachmentController {

    @Autowired
    private LeadAttachmentService leadAttachmentService;

    @GetMapping("/lead/{leadId}")
    public Result<List<LeadAttachment>> getByLeadId(@PathVariable Long leadId) {
        return Result.success(leadAttachmentService.getByLeadId(leadId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SALES','DESIGNER','MANAGER')")
    public Result<LeadAttachment> create(@RequestBody LeadAttachment attachment) {
        return Result.success(leadAttachmentService.create(attachment));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        leadAttachmentService.delete(id);
        return Result.success();
    }
}
