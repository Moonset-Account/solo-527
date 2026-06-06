package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.entity.MemberFreeze;
import com.gym.service.MemberFreezeService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/freezes")
public class MemberFreezeController {

    private final MemberFreezeService memberFreezeService;

    public MemberFreezeController(MemberFreezeService memberFreezeService) {
        this.memberFreezeService = memberFreezeService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<MemberFreeze> createFreeze(@RequestBody MemberFreeze freeze) {
        return ApiResponse.success(memberFreezeService.createFreeze(freeze));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<MemberFreeze> cancelFreeze(@PathVariable Long id) {
        return ApiResponse.success(memberFreezeService.cancelFreeze(id));
    }

    @GetMapping
    public ApiResponse<List<MemberFreeze>> getFreezes(@RequestParam(required = false) String status) {
        return ApiResponse.success(memberFreezeService.getAllFreezes(status));
    }

    @GetMapping("/{id}")
    public ApiResponse<MemberFreeze> getFreezeById(@PathVariable Long id) {
        return ApiResponse.success(memberFreezeService.getFreezeById(id));
    }

    @GetMapping("/member/{memberId}")
    public ApiResponse<List<MemberFreeze>> getFreezesByMember(@PathVariable Long memberId) {
        return ApiResponse.success(memberFreezeService.getFreezesByMember(memberId));
    }

    @GetMapping("/member/{memberId}/active")
    public ApiResponse<List<MemberFreeze>> getActiveFreezesByMember(@PathVariable Long memberId) {
        return ApiResponse.success(memberFreezeService.getActiveFreezesByMember(memberId));
    }

    @GetMapping("/member/{memberId}/check")
    public ApiResponse<Boolean> checkMemberFrozen(
            @PathVariable Long memberId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success(memberFreezeService.isMemberFrozenOnDate(memberId, date));
    }
}
