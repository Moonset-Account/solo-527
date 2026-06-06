package com.gym.service;

import com.gym.common.BusinessException;
import com.gym.entity.Member;
import com.gym.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public Member createMember(Member member) {
        if (memberRepository.findByPhone(member.getPhone()).isPresent()) {
            throw new BusinessException("该手机号已注册");
        }

        member.setMemberNo("M" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase());
        if (member.getStatus() == null) {
            member.setStatus("ACTIVE");
        }

        Member saved = memberRepository.save(member);
        auditLogService.log("CREATE", "MEMBER", saved.getId(), "MEMBER", null, saved);
        return saved;
    }

    @Transactional
    public Member updateMember(Long id, Member member) {
        Member existing = memberRepository.findById(id)
                .orElseThrow(() -> new BusinessException("会员不存在"));

        Member oldMember = new Member();
        oldMember.setName(existing.getName());
        oldMember.setPhone(existing.getPhone());
        oldMember.setStatus(existing.getStatus());

        existing.setName(member.getName());
        existing.setPhone(member.getPhone());
        existing.setGender(member.getGender());
        existing.setBirthday(member.getBirthday());
        existing.setAddress(member.getAddress());
        existing.setStatus(member.getStatus());
        existing.setSource(member.getSource());
        existing.setRemark(member.getRemark());

        Member saved = memberRepository.save(existing);
        auditLogService.log("UPDATE", "MEMBER", id, "MEMBER", oldMember, saved);
        return saved;
    }

    public List<Member> getAllMembers(String status, String name) {
        if (status != null) {
            return memberRepository.findByStatus(status);
        }
        if (name != null) {
            return memberRepository.findByNameContaining(name);
        }
        return memberRepository.findAll();
    }

    public Member getMemberById(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new BusinessException("会员不存在"));
    }

    public Member getMemberByPhone(String phone) {
        return memberRepository.findByPhone(phone)
                .orElseThrow(() -> new BusinessException("会员不存在"));
    }

    public List<Member> getNewMembers(LocalDate startDate, LocalDate endDate) {
        return memberRepository.findByCreatedAtBetween(startDate, endDate.plusDays(1));
    }

    public long countActiveMembers() {
        return memberRepository.countActiveMembers();
    }
}
