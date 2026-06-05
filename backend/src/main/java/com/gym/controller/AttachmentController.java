package com.gym.controller;

import com.gym.common.response.Result;
import com.gym.entity.Attachment;
import com.gym.repository.AttachmentRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/attachments")
public class AttachmentController {

    private final AttachmentRepository attachmentRepository;

    public AttachmentController(AttachmentRepository attachmentRepository) {
        this.attachmentRepository = attachmentRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Result<List<Attachment>> list(
            @RequestParam(required = false) String relatedType,
            @RequestParam(required = false) Long relatedId) {
        if (relatedType != null && relatedId != null) {
            return Result.success(attachmentRepository.findByRelatedTypeAndRelatedIdOrderByCreatedAtDesc(relatedType, relatedId));
        }
        return Result.success(attachmentRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<Attachment> getById(@PathVariable Long id) {
        return attachmentRepository.findById(id)
                .map(Result::success)
                .orElse(Result.error("附件不存在"));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Result<Attachment> create(@RequestBody AttachmentCreateRequest request) {
        Attachment attachment = new Attachment();
        attachment.setFileName(request.getFileName());
        attachment.setOriginalFileName(request.getOriginalFileName());
        attachment.setFilePath(request.getFilePath());
        attachment.setFileType(request.getFileType());
        attachment.setFileSize(request.getFileSize());
        attachment.setRelatedType(request.getRelatedType());
        attachment.setRelatedId(request.getRelatedId());
        attachment.setUploadStatus(request.getUploadStatus() != null ? request.getUploadStatus() : "PENDING");
        attachment.setErrorMessage(request.getErrorMessage());
        return Result.success(attachmentRepository.save(attachment));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public Result<Attachment> updateStatus(@PathVariable Long id, @RequestBody UpdateStatusRequest request) {
        return attachmentRepository.findById(id).map(attachment -> {
            attachment.setUploadStatus(request.getStatus());
            attachment.setErrorMessage(request.getErrorMessage());
            return Result.success(attachmentRepository.save(attachment));
        }).orElse(Result.error("附件不存在"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Result<Void> delete(@PathVariable Long id) {
        attachmentRepository.deleteById(id);
        return Result.success(null);
    }

    public static class AttachmentCreateRequest {
        private String fileName;
        private String originalFileName;
        private String filePath;
        private String fileType;
        private Long fileSize;
        private String relatedType;
        private Long relatedId;
        private String uploadStatus;
        private String errorMessage;

        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getOriginalFileName() { return originalFileName; }
        public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
        public String getFilePath() { return filePath; }
        public void setFilePath(String filePath) { this.filePath = filePath; }
        public String getFileType() { return fileType; }
        public void setFileType(String fileType) { this.fileType = fileType; }
        public Long getFileSize() { return fileSize; }
        public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
        public String getRelatedType() { return relatedType; }
        public void setRelatedType(String relatedType) { this.relatedType = relatedType; }
        public Long getRelatedId() { return relatedId; }
        public void setRelatedId(Long relatedId) { this.relatedId = relatedId; }
        public String getUploadStatus() { return uploadStatus; }
        public void setUploadStatus(String uploadStatus) { this.uploadStatus = uploadStatus; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }

    public static class UpdateStatusRequest {
        private String status;
        private String errorMessage;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }
}
