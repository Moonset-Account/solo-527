package com.finance.approval.service;

import com.finance.approval.audit.AuditOperation;
import com.finance.approval.entity.ExpenseApplication;
import com.finance.approval.entity.ExpenseAttachment;
import com.finance.approval.entity.SysUser;
import com.finance.approval.enums.ApplicationStatus;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ExpenseApplicationRepository;
import com.finance.approval.repository.ExpenseAttachmentRepository;
import com.finance.approval.util.FileUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final ExpenseAttachmentRepository expenseAttachmentRepository;
    private final ExpenseApplicationRepository expenseApplicationRepository;
    private final UserService userService;
    private final FileUtil fileUtil;

    @Transactional
    @AuditOperation(module = "附件管理", operation = "上传附件")
    public ExpenseAttachment uploadAttachment(Long applicationId, MultipartFile file) {
        ExpenseApplication application = expenseApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("只能为草稿状态的申请上传附件");
        }

        SysUser currentUser = userService.getCurrentUser();
        if (!application.getApplicantId().equals(currentUser.getId())) {
            throw new BusinessException("只能为自己的申请上传附件");
        }

        String fileName = fileUtil.uploadFile(file);

        ExpenseAttachment attachment = ExpenseAttachment.builder()
                .applicationId(applicationId)
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .fileUrl(fileName)
                .uploadedBy(currentUser.getId())
                .build();

        return expenseAttachmentRepository.save(attachment);
    }

    @Transactional(readOnly = true)
    public List<ExpenseAttachment> getAttachmentsByApplicationId(Long applicationId) {
        if (!expenseApplicationRepository.existsById(applicationId)) {
            throw new BusinessException("申请不存在");
        }
        return expenseAttachmentRepository.findByApplicationId(applicationId);
    }

    @Transactional
    @AuditOperation(module = "附件管理", operation = "删除附件")
    public void deleteAttachment(Long id) {
        ExpenseAttachment attachment = expenseAttachmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("附件不存在"));

        ExpenseApplication application = expenseApplicationRepository.findById(attachment.getApplicationId())
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("只能删除草稿状态申请的附件");
        }

        SysUser currentUser = userService.getCurrentUser();
        if (!attachment.getUploadedBy().equals(currentUser.getId())) {
            throw new BusinessException("只能删除自己上传的附件");
        }

        fileUtil.deleteFile(attachment.getFileUrl());
        expenseAttachmentRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Resource downloadAttachment(Long id) {
        ExpenseAttachment attachment = expenseAttachmentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("附件不存在"));

        return fileUtil.loadFileAsResource(attachment.getFileUrl());
    }
}
