package com.gym.service;

import com.gym.common.BusinessException;
import com.gym.entity.MemberPackage;
import com.gym.repository.MemberPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MemberPackageService {

    private final MemberPackageRepository memberPackageRepository;
    private final AuditLogService auditLogService;

    public MemberPackageService(MemberPackageRepository memberPackageRepository, AuditLogService auditLogService) {
        this.memberPackageRepository = memberPackageRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public MemberPackage createPackage(MemberPackage memberPackage) {
        if (memberPackage.getRemainingSessions() == null) {
            memberPackage.setRemainingSessions(memberPackage.getTotalSessions());
        }
        if (memberPackage.getUsedSessions() == null) {
            memberPackage.setUsedSessions(0);
        }
        if (memberPackage.getStatus() == null) {
            memberPackage.setStatus("ACTIVE");
        }
        if (memberPackage.getFreezeDays() == null) {
            memberPackage.setFreezeDays(0);
        }

        MemberPackage saved = memberPackageRepository.save(memberPackage);
        auditLogService.log("CREATE", "PACKAGE", saved.getId(), "MEMBER_PACKAGE", null, saved);
        return saved;
    }

    @Transactional
    public MemberPackage updatePackage(Long id, MemberPackage memberPackage) {
        MemberPackage existing = memberPackageRepository.findById(id)
                .orElseThrow(() -> new BusinessException("课包不存在"));

        MemberPackage old = new MemberPackage();
        old.setStatus(existing.getStatus());
        old.setRemainingSessions(existing.getRemainingSessions());

        existing.setStatus(memberPackage.getStatus());
        existing.setRemark(memberPackage.getRemark());
        existing.setExpireDate(memberPackage.getExpireDate());
        existing.setCoachId(memberPackage.getCoachId());

        MemberPackage saved = memberPackageRepository.save(existing);
        auditLogService.log("UPDATE", "PACKAGE", id, "MEMBER_PACKAGE", old, saved);
        return saved;
    }

    public List<MemberPackage> getPackagesByMember(Long memberId) {
        return memberPackageRepository.findByMemberId(memberId);
    }

    public List<MemberPackage> getActivePackagesByMember(Long memberId) {
        return memberPackageRepository.findActivePackagesByMemberId(memberId);
    }

    public List<MemberPackage> getPackagesByCoach(Long coachId) {
        return memberPackageRepository.findByCoachId(coachId);
    }

    public List<MemberPackage> getExpiringPackages(LocalDate start, LocalDate end) {
        return memberPackageRepository.findExpiringPackages(start, end);
    }

    public MemberPackage getPackageById(Long id) {
        return memberPackageRepository.findById(id)
                .orElseThrow(() -> new BusinessException("课包不存在"));
    }

    public List<MemberPackage> getAllPackages(String status) {
        if (status != null) {
            return memberPackageRepository.findByStatus(status);
        }
        return memberPackageRepository.findAll();
    }
}
