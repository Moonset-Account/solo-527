package com.finance.approval.runner;

import com.finance.approval.entity.ApprovalConfig;
import com.finance.approval.entity.ApprovalRule;
import com.finance.approval.entity.SysRole;
import com.finance.approval.entity.SysUser;
import com.finance.approval.entity.SysUserRole;
import com.finance.approval.enums.ConfigType;
import com.finance.approval.enums.RoleCode;
import com.finance.approval.repository.ApprovalConfigRepository;
import com.finance.approval.repository.ApprovalRuleRepository;
import com.finance.approval.repository.SysRoleRepository;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.repository.SysUserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final SysRoleRepository sysRoleRepository;
    private final SysUserRepository sysUserRepository;
    private final SysUserRoleRepository sysUserRoleRepository;
    private final ApprovalRuleRepository approvalRuleRepository;
    private final ApprovalConfigRepository approvalConfigRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("开始初始化系统数据...");

        initRoles();
        initAdminUser();
        initDefaultRules();
        initDefaultConfigs();

        log.info("系统数据初始化完成");
    }

    private void initRoles() {
        log.info("初始化角色数据...");

        for (RoleCode roleCode : RoleCode.values()) {
            if (sysRoleRepository.findByRoleCode(roleCode).isEmpty()) {
                SysRole role = SysRole.builder()
                        .roleCode(roleCode)
                        .roleName(getRoleName(roleCode))
                        .description(getRoleDescription(roleCode))
                        .build();
                sysRoleRepository.save(role);
                log.info("创建角色: {}", roleCode);
            }
        }
    }

    private String getRoleName(RoleCode roleCode) {
        return switch (roleCode) {
            case ADMIN -> "系统管理员";
            case FINANCE_MANAGER -> "财务经理";
            case APPROVER -> "审批人";
            case APPLICANT -> "申请人";
        };
    }

    private String getRoleDescription(RoleCode roleCode) {
        return switch (roleCode) {
            case ADMIN -> "拥有系统所有权限";
            case FINANCE_MANAGER -> "负责财务审批和管理";
            case APPROVER -> "负责审批报销申请";
            case APPLICANT -> "可以提交报销申请";
        };
    }

    private void initAdminUser() {
        log.info("初始化管理员用户...");

        if (!sysUserRepository.existsByUsername("admin")) {
            SysUser admin = SysUser.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .realName("系统管理员")
                    .email("admin@company.com")
                    .phone("13800138000")
                    .department("技术部")
                    .enabled(true)
                    .build();
            admin = sysUserRepository.save(admin);

            SysRole adminRole = sysRoleRepository.findByRoleCode(RoleCode.ADMIN)
                    .orElseThrow(() -> new RuntimeException("管理员角色不存在"));

            SysUserRole userRole = SysUserRole.builder()
                    .userId(admin.getId())
                    .roleId(adminRole.getId())
                    .build();
            sysUserRoleRepository.save(userRole);

            log.info("创建管理员用户: admin / admin123");
        }
    }

    private void initDefaultRules() {
        log.info("初始化默认审批规则...");

        if (approvalRuleRepository.count() == 0) {
            ApprovalRule rule1 = ApprovalRule.builder()
                    .ruleName("小额报销-通用")
                    .expenseType("GENERAL")
                    .minAmount(BigDecimal.ZERO)
                    .maxAmount(new BigDecimal("1000"))
                    .department(null)
                    .enabled(true)
                    .createdBy(1L)
                    .build();
            approvalRuleRepository.save(rule1);
            log.info("创建审批规则: 小额报销-通用");

            ApprovalRule rule2 = ApprovalRule.builder()
                    .ruleName("中额报销-通用")
                    .expenseType("GENERAL")
                    .minAmount(new BigDecimal("1000"))
                    .maxAmount(new BigDecimal("10000"))
                    .department(null)
                    .enabled(true)
                    .createdBy(1L)
                    .build();
            approvalRuleRepository.save(rule2);
            log.info("创建审批规则: 中额报销-通用");

            ApprovalRule rule3 = ApprovalRule.builder()
                    .ruleName("大额报销-通用")
                    .expenseType("GENERAL")
                    .minAmount(new BigDecimal("10000"))
                    .maxAmount(new BigDecimal("99999999.99"))
                    .department(null)
                    .enabled(true)
                    .createdBy(1L)
                    .build();
            approvalRuleRepository.save(rule3);
            log.info("创建审批规则: 大额报销-通用");

            ApprovalRule rule4 = ApprovalRule.builder()
                    .ruleName("差旅报销")
                    .expenseType("TRAVEL")
                    .minAmount(BigDecimal.ZERO)
                    .maxAmount(new BigDecimal("5000"))
                    .department(null)
                    .enabled(true)
                    .createdBy(1L)
                    .build();
            approvalRuleRepository.save(rule4);
            log.info("创建审批规则: 差旅报销");

            ApprovalRule rule5 = ApprovalRule.builder()
                    .ruleName("招待报销")
                    .expenseType("ENTERTAINMENT")
                    .minAmount(BigDecimal.ZERO)
                    .maxAmount(new BigDecimal("3000"))
                    .department(null)
                    .enabled(true)
                    .createdBy(1L)
                    .build();
            approvalRuleRepository.save(rule5);
            log.info("创建审批规则: 招待报销");
        }
    }

    private void initDefaultConfigs() {
        log.info("初始化默认系统配置...");

        initAttachmentConfigs();
        initRejectReasonConfigs();
        initResourceConfigs();
    }

    private void initAttachmentConfigs() {
        String[][] attachments = {
                {"INVOICE", "发票", "必须提供正规发票"},
                {"RECEIPT", "收据", "可作为辅助凭证"},
                {"TRAVEL_ITINERARY", "行程单", "差旅报销需提供"},
                {"HOTEL_BILL", "酒店账单", "住宿费用明细"},
                {"MEAL_RECEIPT", "餐饮小票", "招待费明细"}
        };

        int sortOrder = 1;
        for (String[] attachment : attachments) {
            if (!approvalConfigRepository.existsByConfigTypeAndConfigKey(ConfigType.ATTACHMENT, attachment[0])) {
                ApprovalConfig config = ApprovalConfig.builder()
                        .configType(ConfigType.ATTACHMENT)
                        .configKey(attachment[0])
                        .configValue(attachment[1])
                        .description(attachment[2])
                        .sortOrder(sortOrder++)
                        .enabled(true)
                        .build();
                approvalConfigRepository.save(config);
                log.info("创建附件配置: {}", attachment[1]);
            }
        }
    }

    private void initRejectReasonConfigs() {
        String[][] reasons = {
                {"INCOMPLETE_INFO", "信息不完整", "请补充完整的报销信息"},
                {"INVALID_ATTACHMENT", "附件无效", "请提供有效的发票或凭证"},
                {"EXCEED_LIMIT", "超出限额", "该费用超出报销标准"},
                {"WRONG_CATEGORY", "类别错误", "请选择正确的费用类别"},
                {"POLICY_VIOLATION", "违反政策", "不符合公司报销政策"},
                {"OTHER", "其他原因", "请在备注中说明具体原因"}
        };

        int sortOrder = 1;
        for (String[] reason : reasons) {
            if (!approvalConfigRepository.existsByConfigTypeAndConfigKey(ConfigType.REJECT_REASON, reason[0])) {
                ApprovalConfig config = ApprovalConfig.builder()
                        .configType(ConfigType.REJECT_REASON)
                        .configKey(reason[0])
                        .configValue(reason[1])
                        .description(reason[2])
                        .sortOrder(sortOrder++)
                        .enabled(true)
                        .build();
                approvalConfigRepository.save(config);
                log.info("创建退回原因配置: {}", reason[1]);
            }
        }
    }

    private void initResourceConfigs() {
        String[][] resources = {
                {"MAX_FILE_SIZE", "10485760", "单个文件最大大小（字节）"},
                {"ALLOWED_EXTENSIONS", ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt", "允许上传的文件扩展名"},
                {"DAILY_ALLOWANCE", "200", "每日出差补助标准（元）"},
                {"HOTEL_STANDARD", "500", "酒店住宿标准（元/天）"},
                {"MEAL_STANDARD", "150", "餐饮标准（元/天）"},
                {"TRANSPORT_STANDARD", "300", "交通标准（元/天）"},
                {"APPROVAL_TIMEOUT_HOURS", "24", "审批超时时间（小时）"},
                {"REMINDER_ENABLED", "true", "是否启用提醒功能"}
        };

        int sortOrder = 1;
        for (String[] resource : resources) {
            if (!approvalConfigRepository.existsByConfigTypeAndConfigKey(ConfigType.RESOURCE, resource[0])) {
                ApprovalConfig config = ApprovalConfig.builder()
                        .configType(ConfigType.RESOURCE)
                        .configKey(resource[0])
                        .configValue(resource[1])
                        .description(resource[2])
                        .sortOrder(sortOrder++)
                        .enabled(true)
                        .build();
                approvalConfigRepository.save(config);
                log.info("创建资源配置: {}", resource[0]);
            }
        }
    }
}
