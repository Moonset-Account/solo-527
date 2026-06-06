package com.gym.service;

import com.gym.common.BusinessException;
import com.gym.entity.MemberFreeze;
import com.gym.entity.MemberPackage;
import com.gym.repository.MemberFreezeRepository;
import com.gym.repository.MemberPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class MemberFreezeService {

    private final MemberFreezeRepository memberFreezeRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final AuditLogService auditLogService;

    public MemberFreezeService(MemberFreezeRepository memberFreezeRepository, MemberPackageRepository memberPackageRepository, AuditLogService auditLogService) {
        this.memberFreezeRepository = memberFreezeRepository;
        this.memberPackageRepository = memberPackageRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public MemberFreeze createFreeze(MemberFreeze freeze) {
        int freezeDays = (int) ChronoUnit.DAYS.between(freeze.getStartDate(), freeze.getEndDate()) + 1;
        if (freezeDays <= 0) {
            throw new BusinessException("冻结日期不合法");
        }
        freeze.setFreezeDays(freezeDays);
        freeze.setFreezeNo("FZ" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase());
        freeze.setStatus("ACTIVE");

        if (freeze.getMemberPackageId() != null) {
            MemberPackage mp = memberPackageRepository.findById(freeze.getMemberPackageId())
                    .orElseThrow(() -> new BusinessException("课包不存在"));
            mp.setFreezeDays(mp.getFreezeDays() + freezeDays);
            if (mp.getExpireDate() != null) {
                mp.setExpireDate(mp.getExpireDate().plusDays(freezeDays));
            }
            memberPackageRepository.save(mp);
        }

        MemberFreeze saved = memberFreezeRepository.save(freeze);
        auditLogService.log("CREATE", "FREEZE", saved.getId(), "MEMBER_FREEZE", null, saved);
        return saved;
    }

    @Transactional
    public MemberFreeze cancelFreeze(Long id) {
        MemberFreeze freeze = memberFreezeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("冻结记录不存在"));

        if (!"ACTIVE".equals(freeze.getStatus())) {
            throw new BusinessException("当前状态无法取消");
        }

        MemberFreeze oldFreeze = new MemberFreeze();
        oldFreeze.setStatus(freeze.getStatus());

        freeze.setStatus("CANCELLED");

        if (freeze.getMemberPackageId() != null) {
            MemberPackage mp = memberPackageRepository.findById(freeze.getMemberPackageId()).orElse(null);
            if (mp != null) {
                mp.setFreezeDays(Math.max(0, mp.getFreezeDays() - freeze.getFreezeDays()));
                if (mp.getExpireDate() != null) {
                    mp.setExpireDate(mp.getExpireDate().minusDays(freeze.getFreezeDays()));
                }
                memberPackageRepository.save(mp);
            }
        }

        MemberFreeze saved = memberFreezeRepository.save(freeze);
        auditLogService.log("CANCEL", "FREEZE", id, "MEMBER_FREEZE", oldFreeze, saved);
        return saved;
    }

    public List<MemberFreeze> getFreezesByMember(Long memberId) {
        return memberFreezeRepository.findByMemberId(memberId);
    }

    public List<MemberFreeze> getActiveFreezesByMember(Long memberId) {
        return memberFreezeRepository.findActiveFreezesByMemberId(memberId);
    }

    public boolean isMemberFrozenOnDate(Long memberId, LocalDate date) {
        return memberFreezeRepository.isMemberFrozenOnDate(memberId, date);
    }

    public List<MemberFreeze> getAllFreezes(String status) {
        if (status != null) {
            return memberFreezeRepository.findByStatus(status);
        }
        return memberFreezeRepository.findAll();
    }

    public MemberFreeze getFreezeById(Long id) {
        return memberFreezeRepository.findById(id)
                .orElseThrow(() -> new BusinessException("冻结记录不存在"));
    }
}
