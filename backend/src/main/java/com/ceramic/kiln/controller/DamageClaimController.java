package com.ceramic.kiln.controller;

import com.ceramic.kiln.dto.ApiResponse;
import com.ceramic.kiln.dto.DamageClaimCreateDTO;
import com.ceramic.kiln.entity.DamageClaim;
import com.ceramic.kiln.entity.User;
import com.ceramic.kiln.service.AuthService;
import com.ceramic.kiln.service.DamageClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/damage-claims")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INTERNAL')")
public class DamageClaimController {

    private final DamageClaimService damageClaimService;
    private final AuthService authService;

    @PostMapping
    public ApiResponse<DamageClaim> createClaim(@Valid @RequestBody DamageClaimCreateDTO dto,
                                                 Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("赔付申请创建成功", 
            damageClaimService.createClaim(dto, user.getId()));
    }

    @PostMapping("/{id}/process")
    public ApiResponse<DamageClaim> processClaim(@PathVariable Long id,
                                                  @RequestParam Boolean approved,
                                                  @RequestParam(required = false) String notes,
                                                  Authentication authentication) {
        User user = authService.getCurrentUser(authentication.getName());
        return ApiResponse.success("处理完成",
            damageClaimService.processClaim(id, approved, notes, user.getId()));
    }

    @GetMapping
    public ApiResponse<Page<DamageClaim>> searchClaims(@RequestParam(required = false) Map<String, Object> params,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(damageClaimService.searchClaims(params, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<DamageClaim> getClaim(@PathVariable Long id) {
        return ApiResponse.success(damageClaimService.getClaim(id));
    }
}
