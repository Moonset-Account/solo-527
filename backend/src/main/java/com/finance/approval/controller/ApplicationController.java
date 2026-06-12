package com.finance.approval.controller;

import com.finance.approval.dto.ApiResponse;
import com.finance.approval.dto.ApplicationDTO;
import com.finance.approval.dto.ApplicationRequest;
import com.finance.approval.dto.PageResult;
import com.finance.approval.entity.ExpenseApplication;
import com.finance.approval.entity.ExpenseAttachment;
import com.finance.approval.entity.SysUser;
import com.finance.approval.enums.ApplicationStatus;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ExpenseApplicationRepository;
import com.finance.approval.repository.ExpenseAttachmentRepository;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.security.SecurityUtils;
import com.finance.approval.util.SnowflakeIdGenerator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ExpenseApplicationRepository applicationRepository;
    private final ExpenseAttachmentRepository attachmentRepository;
    private final SysUserRepository userRepository;
    private final SnowflakeIdGenerator idGenerator;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResult<ApplicationDTO>> getMyApplications(
            @RequestParam(required = false) ApplicationStatus status,
            Pageable pageable) {
        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        Page<ExpenseApplication> applicationPage;
        if (status != null) {
            applicationPage = applicationRepository.findByDepartmentAndStatus(user.getDepartment(), status, pageable);
        } else {
            applicationPage = applicationRepository.findByApplicantId(user.getId(), pageable);
        }

        List<ApplicationDTO> dtos = applicationPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResult<ApplicationDTO> result = PageResult.of(
                applicationPage.getTotalElements(),
                dtos,
                applicationPage.getNumber(),
                applicationPage.getSize()
        );

        return ApiResponse.success(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ApplicationDTO> getApplicationById(@PathVariable Long id) {
        ExpenseApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!application.getApplicantId().equals(user.getId()) &&
                !SecurityUtils.hasRole("ADMIN") &&
                !SecurityUtils.hasRole("FINANCE_MANAGER") &&
                !SecurityUtils.hasRole("APPROVER")) {
            throw new BusinessException("无权限查看该申请");
        }

        return ApiResponse.success(convertToDTO(application));
    }

    @PostMapping
    @PreAuthorize("hasRole('APPLICANT') or hasRole('ADMIN')")
    public ApiResponse<ApplicationDTO> createApplication(@Valid @RequestBody ApplicationRequest request) {
        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        ExpenseApplication application = ExpenseApplication.builder()
                .applicationNo("EXP" + idGenerator.generateId())
                .title(request.getTitle())
                .amount(request.getAmount())
                .expenseType(request.getExpenseType().name())
                .description(request.getDescription())
                .applicantId(user.getId())
                .applicantName(user.getRealName())
                .department(user.getDepartment())
                .status(ApplicationStatus.DRAFT)
                .build();

        application = applicationRepository.save(application);

        if (request.getAttachments() != null) {
            for (String fileUrl : request.getAttachments()) {
                ExpenseAttachment attachment = ExpenseAttachment.builder()
                        .applicationId(application.getId())
                        .fileName(fileUrl.substring(fileUrl.lastIndexOf("/") + 1))
                        .fileUrl(fileUrl)
                        .uploadedBy(user.getId())
                        .build();
                attachmentRepository.save(attachment);
            }
        }

        return ApiResponse.success(convertToDTO(application));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('APPLICANT') or hasRole('ADMIN')")
    public ApiResponse<ApplicationDTO> updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationRequest request) {
        ExpenseApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("只能修改草稿状态的申请");
        }

        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!application.getApplicantId().equals(user.getId()) && !SecurityUtils.hasRole("ADMIN")) {
            throw new BusinessException("无权限修改该申请");
        }

        application.setTitle(request.getTitle());
        application.setAmount(request.getAmount());
        application.setExpenseType(request.getExpenseType().name());
        application.setDescription(request.getDescription());

        application = applicationRepository.save(application);

        List<ExpenseAttachment> existingAttachments = attachmentRepository.findByApplicationId(id);
        attachmentRepository.deleteAll(existingAttachments);

        if (request.getAttachments() != null) {
            for (String fileUrl : request.getAttachments()) {
                ExpenseAttachment attachment = ExpenseAttachment.builder()
                        .applicationId(application.getId())
                        .fileName(fileUrl.substring(fileUrl.lastIndexOf("/") + 1))
                        .fileUrl(fileUrl)
                        .uploadedBy(user.getId())
                        .build();
                attachmentRepository.save(attachment);
            }
        }

        return ApiResponse.success(convertToDTO(application));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('APPLICANT') or hasRole('ADMIN')")
    public ApiResponse<Void> deleteApplication(@PathVariable Long id) {
        ExpenseApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("只能删除草稿状态的申请");
        }

        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!application.getApplicantId().equals(user.getId()) && !SecurityUtils.hasRole("ADMIN")) {
            throw new BusinessException("无权限删除该申请");
        }

        List<ExpenseAttachment> attachments = attachmentRepository.findByApplicationId(id);
        attachmentRepository.deleteAll(attachments);
        applicationRepository.delete(application);

        return ApiResponse.success();
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('APPLICANT') or hasRole('ADMIN')")
    public ApiResponse<ApplicationDTO> submitApplication(@PathVariable Long id) {
        ExpenseApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("只能提交草稿状态的申请");
        }

        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (!application.getApplicantId().equals(user.getId()) && !SecurityUtils.hasRole("ADMIN")) {
            throw new BusinessException("无权限提交该申请");
        }

        application.setStatus(ApplicationStatus.PENDING);
        application.setSubmittedAt(LocalDateTime.now());

        application = applicationRepository.save(application);
        return ApiResponse.success(convertToDTO(application));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('APPROVER') or hasRole('FINANCE_MANAGER') or hasRole('ADMIN')")
    public ApiResponse<PageResult<ApplicationDTO>> getPendingApplications(Pageable pageable) {
        Page<ExpenseApplication> applicationPage = applicationRepository.findByStatus(ApplicationStatus.PENDING, pageable);

        List<ApplicationDTO> dtos = applicationPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResult<ApplicationDTO> result = PageResult.of(
                applicationPage.getTotalElements(),
                dtos,
                applicationPage.getNumber(),
                applicationPage.getSize()
        );

        return ApiResponse.success(result);
    }

    @GetMapping("/approved")
    @PreAuthorize("hasRole('APPROVER') or hasRole('FINANCE_MANAGER') or hasRole('ADMIN')")
    public ApiResponse<PageResult<ApplicationDTO>> getApprovedApplications(Pageable pageable) {
        String username = SecurityUtils.getCurrentUsername();
        SysUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        Page<ExpenseApplication> applicationPage = applicationRepository.findByStatus(ApplicationStatus.APPROVED, pageable);

        List<ApplicationDTO> dtos = applicationPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResult<ApplicationDTO> result = PageResult.of(
                applicationPage.getTotalElements(),
                dtos,
                applicationPage.getNumber(),
                applicationPage.getSize()
        );

        return ApiResponse.success(result);
    }

    private ApplicationDTO convertToDTO(ExpenseApplication application) {
        List<ExpenseAttachment> attachments = attachmentRepository.findByApplicationId(application.getId());

        ApplicationDTO dto = new ApplicationDTO();
        dto.setId(application.getId());
        dto.setTitle(application.getTitle());
        dto.setAmount(application.getAmount());
        dto.setExpenseType(com.finance.approval.enums.ExpenseType.valueOf(application.getExpenseType()));
        dto.setDescription(application.getDescription());
        dto.setAttachments(attachments.stream().map(ExpenseAttachment::getFileUrl).collect(Collectors.toList()));
        dto.setStatus(application.getStatus());
        dto.setApplicantId(application.getApplicantId());
        dto.setApplicantName(application.getApplicantName());
        dto.setCreatedAt(application.getCreatedAt());
        dto.setUpdatedAt(application.getUpdatedAt());
        dto.setApprovedAt(application.getCompletedAt());
        return dto;
    }
}
