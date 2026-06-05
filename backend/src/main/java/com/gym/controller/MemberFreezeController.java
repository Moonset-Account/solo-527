package com.gym.controller;

import com.gym.common.enums.MemberStatusEnum;
import com.gym.common.response.Result;
import com.gym.entity.Member;
import com.gym.entity.MemberFreeze;
import com.gym.repository.MemberFreezeRepository;
import com.gym.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/member-freezes")
@RequiredArgsConstructor
public class MemberFreezeController {

    private final MemberFreezeRepository memberFreezeRepository;
    private final MemberRepository memberRepository;

    @GetMapping("/member/{memberId}")
    @PreAuthorize("isAuthenticated()")
    public Result<List<MemberFreeze>> getByMemberId(@PathVariable Long memberId) {
        return Result.success(memberFreezeRepository.findByMemberIdOrderByStartDateDesc(memberId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION')")
    @Transactional
    public Result<MemberFreeze> create(@RequestBody MemberFreeze freeze) {
        freeze.setId(null);

        Member member = memberRepository.findById(freeze.getMember().getId())
                .orElseThrow(() -> new RuntimeException("会员不存在"));

        LocalDate startDate = freeze.getStartDate() != null ? freeze.getStartDate() : LocalDate.now();
        LocalDate endDate = freeze.getEndDate();
        if (endDate == null || endDate.isBefore(startDate)) {
            throw new RuntimeException("冻结结束日期无效");
        }

        int freezeDays = (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
        freeze.setStartDate(startDate);
        freeze.setFreezeDays(freezeDays);
        freeze.setActive(true);

        LocalDate today = LocalDate.now();
        if (!startDate.isAfter(today)) {
            member.setStatus(MemberStatusEnum.FROZEN);
            memberRepository.save(member);
        }

        if (member.getExpireDate() != null) {
            member.setExpireDate(member.getExpireDate().plusDays(freezeDays));
        }

        return Result.success(memberFreezeRepository.save(freeze));
    }

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Transactional
    public Result<MemberFreeze> deactivate(@PathVariable Long id) {
        return memberFreezeRepository.findById(id).map(freeze -> {
            freeze.setActive(false);
            memberFreezeRepository.save(freeze);

            Member member = freeze.getMember();
            LocalDate today = LocalDate.now();
            List<MemberFreeze> activeFreezes = memberFreezeRepository
                    .findActiveFreezesForMemberAndDate(member.getId(), today);
            if (activeFreezes.isEmpty()) {
                member.setStatus(MemberStatusEnum.ACTIVE);
                memberRepository.save(member);
            }

            return Result.success(freeze);
        }).orElse(Result.error("冻结记录不存在"));
    }
}
