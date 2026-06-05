package com.gym.controller;

import com.gym.common.response.Result;
import com.gym.entity.Member;
import com.gym.entity.MemberPackage;
import com.gym.repository.MemberPackageRepository;
import com.gym.repository.MemberRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/member-packages")
public class MemberPackageController {

    private final MemberPackageRepository memberPackageRepository;
    private final MemberRepository memberRepository;

    public MemberPackageController(MemberPackageRepository memberPackageRepository, MemberRepository memberRepository) {
        this.memberPackageRepository = memberPackageRepository;
        this.memberRepository = memberRepository;
    }

    @GetMapping("/member/{memberId}")
    @PreAuthorize("isAuthenticated()")
    public Result<List<MemberPackage>> getByMemberId(@PathVariable Long memberId) {
        return Result.success(memberPackageRepository.findByMemberIdAndActiveTrueOrderByPurchaseDateDesc(memberId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTION')")
    @Transactional
    public Result<MemberPackage> create(@RequestBody MemberPackage memberPackage) {
        memberPackage.setId(null);
        if (memberPackage.getRemainingSessions() == null) {
            memberPackage.setRemainingSessions(memberPackage.getTotalSessions());
        }
        MemberPackage saved = memberPackageRepository.save(memberPackage);

        Member member = memberRepository.findById(saved.getMember().getId()).orElse(null);
        if (member != null) {
            Integer total = memberPackageRepository.sumRemainingSessionsByMemberId(member.getId());
            member.setTotalRemainingSessions(total != null ? total : 0);
            memberRepository.save(member);
        }

        return Result.success(saved);
    }
}
