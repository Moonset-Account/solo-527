package com.gym.service;

import com.gym.common.BusinessException;
import com.gym.entity.Coach;
import com.gym.repository.CoachRepository;
import com.gym.validation.CoachPermissionValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CoachService {

    private static final Logger log = LoggerFactory.getLogger(CoachService.class);

    private final CoachRepository coachRepository;
    private final AuditLogService auditLogService;
    private final CoachPermissionValidator coachPermissionValidator;

    public CoachService(CoachRepository coachRepository, AuditLogService auditLogService, CoachPermissionValidator coachPermissionValidator) {
        this.coachRepository = coachRepository;
        this.auditLogService = auditLogService;
        this.coachPermissionValidator = coachPermissionValidator;
    }

    @Transactional
    public Coach createCoach(Coach coach) {
        if (coachRepository.findByUserId(coach.getUserId()).isPresent()) {
            throw new BusinessException("该用户已关联教练信息");
        }

        Coach saved = coachRepository.save(coach);
        auditLogService.log("CREATE", "COACH", saved.getId(), "COACH", null, saved);
        return saved;
    }

    @Transactional
    public Coach updateCoach(Long id, Coach coach) {
        Coach existing = coachRepository.findById(id)
                .orElseThrow(() -> new BusinessException("教练不存在"));

        Coach old = new Coach();
        old.setSpecialty(existing.getSpecialty());
        old.setDescription(existing.getDescription());

        existing.setSpecialty(coach.getSpecialty());
        existing.setDescription(coach.getDescription());
        existing.setHireDate(coach.getHireDate());

        Coach saved = coachRepository.save(existing);
        auditLogService.log("UPDATE", "COACH", id, "COACH", old, saved);
        return saved;
    }

    public List<Coach> getAllCoaches(String specialty) {
        if (specialty != null) {
            return coachRepository.findBySpecialtyContaining(specialty);
        }
        return coachRepository.findAll();
    }

    public Coach getCoachById(Long id) {
        return coachRepository.findById(id)
                .orElseThrow(() -> new BusinessException("教练不存在"));
    }

    public Coach getCoachByUserId(Long userId) {
        return coachRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("教练不存在"));
    }

    public void validateViewCoachRevenue(Long coachId) {
        coachPermissionValidator.validateViewCoachRevenue(coachId);
    }
}
