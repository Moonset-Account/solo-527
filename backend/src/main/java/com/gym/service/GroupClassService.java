package com.gym.service;

import com.gym.common.BusinessException;
import com.gym.entity.GroupClass;
import com.gym.repository.GroupClassRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class GroupClassService {

    private final GroupClassRepository groupClassRepository;
    private final AuditLogService auditLogService;

    public GroupClassService(GroupClassRepository groupClassRepository, AuditLogService auditLogService) {
        this.groupClassRepository = groupClassRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public GroupClass createGroupClass(GroupClass groupClass) {
        groupClass.setClassNo("GC" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase());
        if (groupClass.getRegisteredCount() == null) {
            groupClass.setRegisteredCount(0);
        }
        if (groupClass.getStatus() == null) {
            groupClass.setStatus("SCHEDULED");
        }

        GroupClass saved = groupClassRepository.save(groupClass);
        auditLogService.log("CREATE", "GROUP_CLASS", saved.getId(), "GROUP_CLASS", null, saved);
        return saved;
    }

    @Transactional
    public GroupClass updateGroupClass(Long id, GroupClass groupClass) {
        GroupClass existing = groupClassRepository.findById(id)
                .orElseThrow(() -> new BusinessException("团课不存在"));

        GroupClass old = new GroupClass();
        old.setName(existing.getName());
        old.setStatus(existing.getStatus());
        old.setCapacity(existing.getCapacity());

        existing.setName(groupClass.getName());
        existing.setCoachId(groupClass.getCoachId());
        existing.setClassDate(groupClass.getClassDate());
        existing.setStartTime(groupClass.getStartTime());
        existing.setEndTime(groupClass.getEndTime());
        existing.setCapacity(groupClass.getCapacity());
        existing.setLocation(groupClass.getLocation());
        existing.setDescription(groupClass.getDescription());
        existing.setStatus(groupClass.getStatus());

        GroupClass saved = groupClassRepository.save(existing);
        auditLogService.log("UPDATE", "GROUP_CLASS", id, "GROUP_CLASS", old, saved);
        return saved;
    }

    @Transactional
    public GroupClass cancelClass(Long id) {
        GroupClass groupClass = groupClassRepository.findById(id)
                .orElseThrow(() -> new BusinessException("团课不存在"));

        GroupClass old = new GroupClass();
        old.setStatus(groupClass.getStatus());

        groupClass.setStatus("CANCELLED");

        GroupClass saved = groupClassRepository.save(groupClass);
        auditLogService.log("CANCEL", "GROUP_CLASS", id, "GROUP_CLASS", old, saved);
        return saved;
    }

    public List<GroupClass> getClassesByDate(LocalDate date) {
        return groupClassRepository.findByClassDate(date);
    }

    public List<GroupClass> getClassesByDateRange(LocalDate startDate, LocalDate endDate) {
        return groupClassRepository.findByDateRange(startDate, endDate);
    }

    public List<GroupClass> getClassesByCoach(Long coachId) {
        return groupClassRepository.findByCoachId(coachId);
    }

    public List<GroupClass> getCoachClassesInRange(Long coachId, LocalDate startDate, LocalDate endDate) {
        return groupClassRepository.findCoachClassesInRange(coachId, startDate, endDate);
    }

    public GroupClass getClassById(Long id) {
        return groupClassRepository.findById(id)
                .orElseThrow(() -> new BusinessException("团课不存在"));
    }

    public List<GroupClass> getAllClasses(String status) {
        if (status != null) {
            return groupClassRepository.findByStatus(status);
        }
        return groupClassRepository.findAll();
    }
}
