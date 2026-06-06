package com.gym.controller;

import com.gym.common.ApiResponse;
import com.gym.entity.Member;
import com.gym.service.MemberService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<Member> createMember(@RequestBody Member member) {
        return ApiResponse.success(memberService.createMember(member));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<Member> updateMember(@PathVariable Long id, @RequestBody Member member) {
        return ApiResponse.success(memberService.updateMember(id, member));
    }

    @GetMapping
    public ApiResponse<List<Member>> getMembers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String name) {
        return ApiResponse.success(memberService.getAllMembers(status, name));
    }

    @GetMapping("/{id}")
    public ApiResponse<Member> getMemberById(@PathVariable Long id) {
        return ApiResponse.success(memberService.getMemberById(id));
    }

    @GetMapping("/phone/{phone}")
    public ApiResponse<Member> getMemberByPhone(@PathVariable String phone) {
        return ApiResponse.success(memberService.getMemberByPhone(phone));
    }

    @GetMapping("/new")
    public ApiResponse<List<Member>> getNewMembers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.success(memberService.getNewMembers(startDate, endDate));
    }

    @GetMapping("/count/active")
    public ApiResponse<Long> countActiveMembers() {
        return ApiResponse.success(memberService.countActiveMembers());
    }
}
