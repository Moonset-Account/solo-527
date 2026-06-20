package com.datagrowth.portal.config;

import com.datagrowth.portal.entity.SysPermission;
import com.datagrowth.portal.entity.SysRole;
import com.datagrowth.portal.entity.SysUser;
import com.datagrowth.portal.repository.PermissionRepository;
import com.datagrowth.portal.repository.RoleRepository;
import com.datagrowth.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("开始初始化系统数据...");
        initPermissions();
        initRoles();
        initRolePermissions();
        initUsers();
        initUserRoles();
        log.info("系统数据初始化完成！");
    }

    private void initPermissions() {
        List<SysPermission> permissions = new ArrayList<>();
        permissions.add(createPermissionIfNotExists("anomaly:view", "查看异常原因", "查看数据异常波动原因"));
        permissions.add(createPermissionIfNotExists("anomaly:manage", "管理异常记录", "处理和关闭异常记录"));
        permissions.add(createPermissionIfNotExists("approval:view", "查看审批", "查看权限审批申请"));
        permissions.add(createPermissionIfNotExists("approval:approve", "审批权限", "审批数据访问权限"));
        permissions.add(createPermissionIfNotExists("alert:view", "查看告警规则", "查看告警配置"));
        permissions.add(createPermissionIfNotExists("alert:manage", "管理告警规则", "创建和编辑告警规则"));
        permissions.add(createPermissionIfNotExists("dimension:view", "查看维度配置", "查看分析维度"));
        permissions.add(createPermissionIfNotExists("dimension:manage", "管理维度配置", "创建和编辑维度配置"));
        permissions.add(createPermissionIfNotExists("dataset:view", "查看数据集权限", "查看数据集权限配置"));
        permissions.add(createPermissionIfNotExists("dataset:manage", "管理数据集权限", "配置数据集访问权限"));
        permissions.add(createPermissionIfNotExists("desensitization:view", "查看脱敏配置", "查看数据脱敏规则"));
        permissions.add(createPermissionIfNotExists("desensitization:manage", "管理脱敏配置", "配置数据脱敏规则"));
        permissions.add(createPermissionIfNotExists("delay:view", "查看数据延迟", "查看数据延迟监控"));
        permissions.add(createPermissionIfNotExists("report:view", "查看报表效率", "查看报表生成效率"));
        permissions.add(createPermissionIfNotExists("filter:manage", "管理筛选模板", "保存和管理筛选条件"));
        permissions.add(createPermissionIfNotExists("admin:all", "管理员权限", "全部系统权限"));
        log.info("权限初始化完成，共 {} 个", permissions.size());
    }

    private SysPermission createPermissionIfNotExists(String code, String name, String desc) {
        return permissionRepository.findByPermissionCode(code)
            .orElseGet(() -> {
                SysPermission perm = new SysPermission();
                perm.setPermissionCode(code);
                perm.setPermissionName(name);
                perm.setDescription(desc);
                return permissionRepository.save(perm);
            });
    }

    private void initRoles() {
        createRoleIfNotExists("ADMIN", "系统管理员", "拥有全部系统权限");
        createRoleIfNotExists("OPERATION_LEADER", "运营负责人", "查看数据和审批权限");
        createRoleIfNotExists("DATA_ANALYST", "业务分析师", "数据分析和查看权限");
        createRoleIfNotExists("OPERATION_STAFF", "运营人员", "基础数据查看权限");
        log.info("角色初始化完成");
    }

    private SysRole createRoleIfNotExists(String code, String name, String desc) {
        return roleRepository.findByRoleCode(code)
            .orElseGet(() -> {
                SysRole role = new SysRole();
                role.setRoleCode(code);
                role.setRoleName(name);
                role.setDescription(desc);
                return roleRepository.save(role);
            });
    }

    private void initRolePermissions() {
        SysRole adminRole = roleRepository.findByRoleCode("ADMIN").orElseThrow();
        List<SysPermission> allPermissions = permissionRepository.findAll();
        adminRole.setPermissions(new HashSet<>(allPermissions));
        roleRepository.save(adminRole);

        SysRole leaderRole = roleRepository.findByRoleCode("OPERATION_LEADER").orElseThrow();
        leaderRole.setPermissions(new HashSet<>(permissionRepository.findByPermissionCodeIn(
            List.of("anomaly:view", "anomaly:manage", "approval:view", "approval:approve",
                "alert:view", "dimension:view", "dataset:view", "delay:view", "report:view", "filter:manage")
        )));
        roleRepository.save(leaderRole);

        SysRole analystRole = roleRepository.findByRoleCode("DATA_ANALYST").orElseThrow();
        analystRole.setPermissions(new HashSet<>(permissionRepository.findByPermissionCodeIn(
            List.of("anomaly:view", "alert:view", "dimension:view", "dataset:view",
                "delay:view", "report:view", "filter:manage")
        )));
        roleRepository.save(analystRole);

        SysRole staffRole = roleRepository.findByRoleCode("OPERATION_STAFF").orElseThrow();
        staffRole.setPermissions(new HashSet<>(permissionRepository.findByPermissionCodeIn(
            List.of("anomaly:view", "dimension:view", "filter:manage")
        )));
        roleRepository.save(staffRole);

        log.info("角色权限关联完成");
    }

    private void initUsers() {
        String encodedPassword = passwordEncoder.encode("123456");
        log.info("默认密码 123456 的 BCrypt 编码: {}", encodedPassword);

        createUserIfNotExists("admin", encodedPassword, "系统管理员", "admin@example.com", "13800000000");
        createUserIfNotExists("leader", encodedPassword, "运营负责人", "leader@example.com", "13800000001");
        createUserIfNotExists("analyst", encodedPassword, "业务分析师", "analyst@example.com", "13800000002");
        createUserIfNotExists("staff", encodedPassword, "运营人员", "staff@example.com", "13800000003");

        log.info("用户初始化完成 (admin/leader/analyst/staff 密码: 123456)");
    }

    private SysUser createUserIfNotExists(String username, String password, String realName, String email, String phone) {
        return userRepository.findByUsername(username)
            .map(user -> {
                if (!passwordEncoder.matches("123456", user.getPassword())) {
                    log.info("更新用户 {} 的密码", username);
                    user.setPassword(password);
                    return userRepository.save(user);
                }
                return user;
            })
            .orElseGet(() -> {
                SysUser user = new SysUser();
                user.setUsername(username);
                user.setPassword(password);
                user.setRealName(realName);
                user.setEmail(email);
                user.setPhone(phone);
                user.setEnabled(true);
                return userRepository.save(user);
            });
    }

    private void initUserRoles() {
        assignRoleToUser("admin", "ADMIN");
        assignRoleToUser("leader", "OPERATION_LEADER");
        assignRoleToUser("analyst", "DATA_ANALYST");
        assignRoleToUser("staff", "OPERATION_STAFF");
        log.info("用户角色关联完成");
    }

    private void assignRoleToUser(String username, String roleCode) {
        SysUser user = userRepository.findByUsername(username).orElseThrow();
        SysRole role = roleRepository.findByRoleCode(roleCode).orElseThrow();
        Set<SysRole> roles = user.getRoles();
        if (roles == null) {
            roles = new HashSet<>();
        }
        if (roles.stream().noneMatch(r -> r.getRoleCode().equals(roleCode))) {
            roles.add(role);
            user.setRoles(roles);
            userRepository.save(user);
            log.info("用户 {} 已关联角色 {}", username, roleCode);
        }
    }
}
