package com.decoration.crm.controller;

import com.decoration.crm.dto.Result;
import com.decoration.crm.entity.LeadAttachment;
import com.decoration.crm.service.LeadAttachmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/attachments")
public class LeadAttachmentController {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Autowired
    private LeadAttachmentService leadAttachmentService;

    @GetMapping("/lead/{leadId}")
    public Result<List<LeadAttachment>> getByLeadId(@PathVariable Long leadId) {
        return Result.success(leadAttachmentService.getByLeadId(leadId));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN','SALES','DESIGNER','MANAGER')")
    public Result<LeadAttachment> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("leadId") Long leadId,
            @RequestParam(value = "category", required = false, defaultValue = "其他") String category) {
        return Result.success(leadAttachmentService.upload(file, leadId, category));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        LeadAttachment attachment = leadAttachmentService.getById(id);
        if (attachment == null) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = Paths.get(uploadDir, attachment.getFilePath());
        File file = filePath.toFile();
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        FileSystemResource resource = new FileSystemResource(file);
        String encodedName = URLEncoder.encode(attachment.getFileName(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encodedName)
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        leadAttachmentService.delete(id);
        return Result.success();
    }
}
