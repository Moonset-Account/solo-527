package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.entity.MemberPackage;
import com.gym.service.MemberPackageService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/packages")
public class MemberPackageController {

    private final MemberPackageService memberPackageService;

    public MemberPackageController(MemberPackageService memberPackageService) {
        this.memberPackageService = memberPackageService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<MemberPackage> createPackage(@RequestBody MemberPackage memberPackage) {
        return ApiResponse.success(memberPackageService.createPackage(memberPackage));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<MemberPackage> updatePackage(@PathVariable Long id, @RequestBody MemberPackage memberPackage) {
        return ApiResponse.success(memberPackageService.updatePackage(id, memberPackage));
    }

    @GetMapping
    public ApiResponse<List<MemberPackage>> getPackages(@RequestParam(required = false) String status) {
        return ApiResponse.success(memberPackageService.getAllPackages(status));
    }

    @GetMapping("/{id}")
    public ApiResponse<MemberPackage> getPackageById(@PathVariable Long id) {
        return ApiResponse.success(memberPackageService.getPackageById(id));
    }

    @GetMapping("/member/{memberId}")
    public ApiResponse<List<MemberPackage>> getPackagesByMember(@PathVariable Long memberId) {
        return ApiResponse.success(memberPackageService.getPackagesByMember(memberId));
    }

    @GetMapping("/member/{memberId}/active")
    public ApiResponse<List<MemberPackage>> getActivePackagesByMember(@PathVariable Long memberId) {
        return ApiResponse.success(memberPackageService.getActivePackagesByMember(memberId));
    }

    @GetMapping("/coach/{coachId}")
    public ApiResponse<List<MemberPackage>> getPackagesByCoach(@PathVariable Long coachId) {
        return ApiResponse.success(memberPackageService.getPackagesByCoach(coachId));
    }

    @GetMapping("/expiring")
    public ApiResponse<List<MemberPackage>> getExpiringPackages(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ApiResponse.success(memberPackageService.getExpiringPackages(start, end));
    }
}
