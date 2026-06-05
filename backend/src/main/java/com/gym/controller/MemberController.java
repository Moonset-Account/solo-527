package com.gym.controller;

import com.gym.common.enums.MemberStatusEnum;
import com.gym.common.response.Result;
import com.gym.entity.Member;
import com.gym.repository.MemberRepository;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberRepository memberRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION', 'COACH')")
    public Result<List<Member>> list() {
        return Result.success(memberRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION', 'COACH')")
    public Result<Member> getById(@PathVariable Long id) {
        return memberRepository.findById(id)
                .map(Result::success)
                .orElse(Result.error("会员不存在"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION')")
    public Result<Member> create(@RequestBody MemberCreateRequest request) {
        Member member = new Member();
        member.setMemberNo("M" + System.currentTimeMillis());
        member.setName(request.getName());
        member.setPhone(request.getPhone());
        member.setGender(request.getGender());
        member.setBirthday(request.getBirthday());
        member.setStatus(MemberStatusEnum.ACTIVE);
        member.setJoinDate(LocalDate.now());
        member.setTotalRemainingSessions(0);
        return Result.success(memberRepository.save(member));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION')")
    public Result<Member> update(@PathVariable Long id, @RequestBody MemberUpdateRequest request) {
        return memberRepository.findById(id).map(member -> {
            if (request.getName() != null) member.setName(request.getName());
            if (request.getPhone() != null) member.setPhone(request.getPhone());
            if (request.getGender() != null) member.setGender(request.getGender());
            if (request.getBirthday() != null) member.setBirthday(request.getBirthday());
            if (request.getStatus() != null) member.setStatus(request.getStatus());
            if (request.getExpireDate() != null) member.setExpireDate(request.getExpireDate());
            if (request.getRemark() != null) member.setRemark(request.getRemark());
            return Result.success(memberRepository.save(member));
        }).orElse(Result.error("会员不存在"));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION', 'COACH')")
    public Result<Member> searchByPhoneOrMemberNo(@RequestParam String keyword) {
        Member member = memberRepository.findByPhone(keyword)
                .orElseGet(() -> memberRepository.findByMemberNo(keyword).orElse(null));
        if (member == null) {
            return Result.error("未找到会员");
        }
        return Result.success(member);
    }

    @Data
    public static class MemberCreateRequest {
        @NotBlank(message = "姓名不能为空")
        private String name;
        private String phone;
        private String gender;
        private LocalDate birthday;
    }

    @Data
    public static class MemberUpdateRequest {
        private String name;
        private String phone;
        private String gender;
        private LocalDate birthday;
        private MemberStatusEnum status;
        private LocalDate expireDate;
        private String remark;
    }
}
