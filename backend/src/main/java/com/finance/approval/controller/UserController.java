package com.finance.approval.controller;

import com.finance.approval.dto.ApiResponse;
import com.finance.approval.dto.PageResult;
import com.finance.approval.dto.UserDTO;
import com.finance.approval.entity.SysRole;
import com.finance.approval.entity.SysUser;
import com.finance.approval.entity.SysUserRole;
import com.finance.approval.enums.RoleCode;
import com.finance.approval.exception.BusinessException;
import com.finance.approval.repository.SysRoleRepository;
import com.finance.approval.repository.SysUserRepository;
import com.finance.approval.repository.SysUserRoleRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final SysUserRepository sysUserRepository;
    private final SysRoleRepository sysRoleRepository;
    private final SysUserRoleRepository sysUserRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    @Data
    public static class CreateUserRequest {
        @NotBlank(message = "用户名不能为空")
        private String username;
        @NotBlank(message = "密码不能为空")
        private String password;
        private String realName;
        private String email;
        private String phone;
        private String department;
        private Boolean enabled;
    }

    @Data
    public static class UpdateUserRequest {
        private String realName;
        private String email;
        private String phone;
        private String department;
        private Boolean enabled;
        private String password;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PageResult<UserDTO>> getUserList(
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        Page<SysUser> userPage;
        if (keyword != null && !keyword.isEmpty()) {
            userPage = sysUserRepository.findAll(pageable);
        } else {
            userPage = sysUserRepository.findAll(pageable);
        }

        List<UserDTO> userDTOs = userPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        PageResult<UserDTO> result = PageResult.of(
                userPage.getTotalElements(),
                userDTOs,
                userPage.getNumber(),
                userPage.getSize()
        );

        return ApiResponse.success(result);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ApiResponse<UserDTO> getUserById(@PathVariable Long id) {
        SysUser user = sysUserRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        return ApiResponse.success(convertToDTO(user));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserDTO> createUser(@Valid @RequestBody CreateUserRequest request) {
        if (sysUserRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("用户名已存在");
        }

        SysUser user = SysUser.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .realName(request.getRealName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .department(request.getDepartment())
                .enabled(request.getEnabled() != null ? request.getEnabled() : true)
                .build();

        user = sysUserRepository.save(user);
        return ApiResponse.success(convertToDTO(user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ApiResponse<UserDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        SysUser user = sysUserRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (request.getRealName() != null) {
            user.setRealName(request.getRealName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
            if (!request.getEnabled()) {
                redisTemplate.delete("token:" + user.getUsername());
                redisTemplate.delete("refresh:" + user.getUsername());
            }
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user = sysUserRepository.save(user);
        return ApiResponse.success(convertToDTO(user));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        SysUser user = sysUserRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        sysUserRoleRepository.deleteAll(sysUserRoleRepository.findByUserId(id));
        sysUserRepository.delete(user);
        redisTemplate.delete("token:" + user.getUsername());
        redisTemplate.delete("refresh:" + user.getUsername());

        return ApiResponse.success();
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> assignRoles(
            @PathVariable Long id,
            @RequestBody List<String> roleCodes) {
        SysUser user = sysUserRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        sysUserRoleRepository.deleteAll(sysUserRoleRepository.findByUserId(id));

        for (String roleCode : roleCodes) {
            SysRole role = sysRoleRepository.findAll().stream()
                    .filter(r -> r.getRoleCode().name().equals(roleCode))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("角色不存在: " + roleCode));

            SysUserRole userRole = SysUserRole.builder()
                    .userId(id)
                    .roleId(role.getId())
                    .build();
            sysUserRoleRepository.save(userRole);
        }

        redisTemplate.delete("token:" + user.getUsername());
        return ApiResponse.success();
    }

    @GetMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public ApiResponse<List<String>> getUserRoles(@PathVariable Long id) {
        List<SysUserRole> userRoles = sysUserRoleRepository.findByUserId(id);
        List<Long> roleIds = userRoles.stream()
                .map(SysUserRole::getRoleId)
                .collect(Collectors.toList());
        List<SysRole> roles = sysRoleRepository.findAllById(roleIds);
        List<String> roleCodes = roles.stream()
                .map(role -> role.getRoleCode().name())
                .collect(Collectors.toList());
        return ApiResponse.success(roleCodes);
    }

    @GetMapping("/by-role/{roleCode}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<List<UserDTO>> getUsersByRole(@PathVariable String roleCode) {
        RoleCode code = RoleCode.valueOf(roleCode);
        SysRole role = sysRoleRepository.findAll().stream()
                .filter(r -> r.getRoleCode() == code)
                .findFirst()
                .orElseThrow(() -> new BusinessException("角色不存在"));

        List<SysUserRole> userRoles = sysUserRoleRepository.findAll().stream()
                .filter(ur -> ur.getRoleId().equals(role.getId()))
                .collect(Collectors.toList());

        List<Long> userIds = userRoles.stream()
                .map(SysUserRole::getUserId)
                .collect(Collectors.toList());

        List<SysUser> users = sysUserRepository.findAllById(userIds);
        List<UserDTO> userDTOs = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return ApiResponse.success(userDTOs);
    }

    private UserDTO convertToDTO(SysUser user) {
        List<SysUserRole> userRoles = sysUserRoleRepository.findByUserId(user.getId());
        List<Long> roleIds = userRoles.stream()
                .map(SysUserRole::getRoleId)
                .collect(Collectors.toList());
        List<SysRole> roles = sysRoleRepository.findAllById(roleIds);

        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setRealName(user.getRealName());
        userDTO.setEmail(user.getEmail());
        userDTO.setPhone(user.getPhone());
        userDTO.setDepartment(user.getDepartment());
        userDTO.setRoles(roles.stream()
                .map(role -> role.getRoleCode().name())
                .collect(Collectors.toList()));
        return userDTO;
    }
}
