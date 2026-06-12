package com.finance.approval.service;

import com.finance.approval.audit.AuditOperation;
import com.finance.approval.dto.ApplicationRequest;
import com.finance.approval.entity.ExpenseApplication;
import com.finance.approval.entity.SysUser;
import com.finance.approval.enums.ApplicationStatus;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.ExpenseApplicationRepository;
import com.finance.approval.util.SnowflakeIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ExpenseApplicationRepository expenseApplicationRepository;
    private final UserService userService;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SnowflakeIdGenerator snowflakeIdGenerator;

    private static final String APPLICATION_CACHE_PREFIX = "application:";

    @Transactional
    @AuditOperation(module = "费用申请", operation = "创建申请")
    public ExpenseApplication createApplication(ApplicationRequest request) {
        SysUser currentUser = userService.getCurrentUser();

        ExpenseApplication application = ExpenseApplication.builder()
                .applicationNo("APP" + snowflakeIdGenerator.generateId())
                .title(request.getTitle())
                .amount(request.getAmount())
                .expenseType(request.getExpenseType().name())
                .description(request.getDescription())
                .applicantId(currentUser.getId())
                .applicantName(currentUser.getRealName())
                .department(currentUser.getDepartment())
                .status(ApplicationStatus.DRAFT)
                .build();

        return expenseApplicationRepository.save(application);
    }

    @Transactional
    @AuditOperation(module = "费用申请", operation = "提交申请")
    public ExpenseApplication submitApplication(Long id) {
        ExpenseApplication application = getApplicationById(id);

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("只有草稿状态的申请可以提交");
        }

        SysUser currentUser = userService.getCurrentUser();
        if (!application.getApplicantId().equals(currentUser.getId())) {
            throw new BusinessException("只能提交自己的申请");
        }

        application.setStatus(ApplicationStatus.PENDING);
        application.setSubmittedAt(LocalDateTime.now());

        redisTemplate.delete(APPLICATION_CACHE_PREFIX + id);
        return expenseApplicationRepository.save(application);
    }

    @Transactional(readOnly = true)
    public ExpenseApplication getApplicationById(Long id) {
        String cacheKey = APPLICATION_CACHE_PREFIX + id;
        ExpenseApplication application = (ExpenseApplication) redisTemplate.opsForValue().get(cacheKey);
        if (application != null) {
            return application;
        }
        application = expenseApplicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("申请不存在"));
        redisTemplate.opsForValue().set(cacheKey, application, 30, TimeUnit.MINUTES);
        return application;
    }

    @Transactional(readOnly = true)
    public Page<ExpenseApplication> getMyApplications(String status, String keyword, Pageable pageable) {
        SysUser currentUser = userService.getCurrentUser();
        ApplicationStatus applicationStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                applicationStatus = ApplicationStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException("无效的状态值");
            }
        }
        return expenseApplicationRepository.findMyApplications(
                currentUser.getId(), applicationStatus, keyword, pageable);
    }

    @Transactional
    @AuditOperation(module = "费用申请", operation = "更新申请")
    public ExpenseApplication updateApplication(Long id, ApplicationRequest request) {
        ExpenseApplication application = getApplicationById(id);

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("只能更新草稿状态的申请");
        }

        SysUser currentUser = userService.getCurrentUser();
        if (!application.getApplicantId().equals(currentUser.getId())) {
            throw new BusinessException("只能更新自己的申请");
        }

        application.setTitle(request.getTitle());
        application.setAmount(request.getAmount());
        application.setExpenseType(request.getExpenseType().name());
        application.setDescription(request.getDescription());

        redisTemplate.delete(APPLICATION_CACHE_PREFIX + id);
        return expenseApplicationRepository.save(application);
    }

    @Transactional
    @AuditOperation(module = "费用申请", operation = "删除申请")
    public void deleteApplication(Long id) {
        ExpenseApplication application = getApplicationById(id);

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("只能删除草稿状态的申请");
        }

        SysUser currentUser = userService.getCurrentUser();
        if (!application.getApplicantId().equals(currentUser.getId())) {
            throw new BusinessException("只能删除自己的申请");
        }

        expenseApplicationRepository.deleteById(id);
        redisTemplate.delete(APPLICATION_CACHE_PREFIX + id);
    }

    @Transactional(readOnly = true)
    public Page<ExpenseApplication> getApplicationsByStatus(ApplicationStatus status, Pageable pageable) {
        return expenseApplicationRepository.findByStatus(status, pageable);
    }

    @Transactional(readOnly = true)
    public Page<ExpenseApplication> getApplicationsForApprover(Pageable pageable) {
        SysUser currentUser = userService.getCurrentUser();
        com.finance.approval.enums.RoleCode roleCode = null;

        var roles = userService.getUserRoles(currentUser.getId());
        if (!roles.isEmpty()) {
            roleCode = roles.get(0).getRoleCode();
        }

        return expenseApplicationRepository.findApplicationsForApprover(
                currentUser.getId(), roleCode, pageable);
    }
}
