package com.finance.approval.controller;

import com.finance.approval.dto.ApiResponse;
import com.finance.approval.entity.ExpenseApplication;
import com.finance.approval.entity.ExpenseAttachment;
import com.finance.approval.entity.SysUser;
import com.finance.approval.enums.ApplicationStatus;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ExpenseApplicationRepository;
import com.finance.approval.repository.ExpenseAttachmentRepository;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.security.SecurityUtils;
import com.finance.approval.util.FileUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final ExpenseAttachmentRepository attachmentRepository;
    private final ExpenseApplicationRepository applicationRepository;
    private final SysUserRepository userRepository;
    private final FileUtil fileUtil;

    @PostMapping("/upload/{applicationId}")
    @PreAuthorize("hasRole('APPLICANT') or hasRole('ADMIN')")
    public ApiResponse<ExpenseAttachment> uploadAttachment(
            @PathVariable Long applicationId,
            @RequestParam("file") MultipartFile file) {
        ExpenseApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("只能为草稿状态的申请上传附件");
        }

        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!application.getApplicantId().equals(user.getId()) && !SecurityUtils.hasRole("ADMIN")) {
            throw new BusinessException("无权限为该申请上传附件");
        }

        String fileName = fileUtil.uploadFile(file);

        ExpenseAttachment attachment = ExpenseAttachment.builder()
                .applicationId(applicationId)
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .fileUrl("/api/files/" + fileName)
                .uploadedBy(user.getId())
                .build();

        attachment = attachmentRepository.save(attachment);
        return ApiResponse.success(attachment);
    }

    @GetMapping("/application/{applicationId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<ExpenseAttachment>> getAttachmentsByApplicationId(@PathVariable Long applicationId) {
        ExpenseApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!application.getApplicantId().equals(user.getId()) &&
                !SecurityUtils.hasRole("ADMIN") &&
                !SecurityUtils.hasRole("FINANCE_MANAGER") &&
                !SecurityUtils.hasRole("APPROVER")) {
            throw new BusinessException("无权限查看该申请的附件");
        }

        List<ExpenseAttachment> attachments = attachmentRepository.findByApplicationId(applicationId);
        return ApiResponse.success(attachments);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('APPLICANT') or hasRole('ADMIN')")
    public ApiResponse<Void> deleteAttachment(@PathVariable Long id) {
        ExpenseAttachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("附件不存在"));

        ExpenseApplication application = applicationRepository.findById(attachment.getApplicationId())
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("只能删除草稿状态申请的附件");
        }

        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!application.getApplicantId().equals(user.getId()) && !SecurityUtils.hasRole("ADMIN")) {
            throw new BusinessException("无权限删除该附件");
        }

        String fileName = attachment.getFileUrl().substring(attachment.getFileUrl().lastIndexOf("/") + 1);
        fileUtil.deleteFile(fileName);
        attachmentRepository.delete(attachment);

        return ApiResponse.success();
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) {
        ExpenseAttachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("附件不存在"));

        ExpenseApplication application = applicationRepository.findById(attachment.getApplicationId())
                .orElseThrow(() -> new BusinessException("申请不存在"));

        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!application.getApplicantId().equals(user.getId()) &&
                !SecurityUtils.hasRole("ADMIN") &&
                !SecurityUtils.hasRole("FINANCE_MANAGER") &&
                !SecurityUtils.hasRole("APPROVER")) {
            throw new BusinessException("无权限下载该附件");
        }

        String fileName = attachment.getFileUrl().substring(attachment.getFileUrl().lastIndexOf("/") + 1);
        Resource resource = fileUtil.loadFileAsResource(fileName);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }
}
