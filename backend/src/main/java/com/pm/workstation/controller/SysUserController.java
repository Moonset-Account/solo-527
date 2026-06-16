package com.pm.workstation.controller;

import com.pm.workstation.dto.ApiResponseDTO;
import com.pm.workstation.entity.SysUser;
import com.pm.workstation.repository.SysUserRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class SysUserController {

    @Autowired
    private SysUserRepository sysUserRepository;

    @GetMapping
    public ApiResponseDTO<List<SysUser>> listUsers() {
        return ApiResponseDTO.success(sysUserRepository.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponseDTO<SysUser> getUserById(@PathVariable Long id) {
        return ApiResponseDTO.success(sysUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在")));
    }

    @GetMapping("/search")
    public ApiResponseDTO<List<SysUser>> searchUsers(@RequestParam String keyword) {
        return ApiResponseDTO.success(sysUserRepository.findByUsernameContainingOrRealNameContaining(keyword, keyword));
    }
}
