package com.approval.workflow.service;

import com.approval.workflow.dto.DelayQueryDTO;
import com.approval.workflow.entity.DelayRecord;
import com.approval.workflow.entity.Requirement;
import com.approval.workflow.entity.User;
import com.approval.workflow.enums.OperationType;
import com.approval.workflow.enums.RoleType;
import com.approval.workflow.repository.DelayRecordRepository;
import com.approval.workflow.repository.RequirementRepository;
import com.approval.workflow.repository.UserRepository;
import com.approval.workflow.util.SecurityUtil;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class DelayService {

    private final DelayRecordRepository delayRecordRepository;
    private final RequirementRepository requirementRepository;
    private final UserRepository userRepository;
    private final OperationLogService operationLogService;

    public DelayService(DelayRecordRepository delayRecordRepository,
                        RequirementRepository requirementRepository,
                        UserRepository userRepository,
                        OperationLogService operationLogService) {
        this.delayRecordRepository = delayRecordRepository;
        this.requirementRepository = requirementRepository;
        this.userRepository = userRepository;
        this.operationLogService = operationLogService;
    }

    @Transactional
    public DelayRecord createDelayRecord(Long requirementId, Integer delayDays, String reason,
                                          Long responsibleDeptId, Long nodeId) {
        Requirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new RuntimeException("需求不存在"));

        checkDelayPermission(requirement);

        LocalDate originalDate = requirement.getExpectedDate();
        if (originalDate == null) {
            throw new RuntimeException("需求没有设置预期完成时间");
        }

        LocalDate newDate = originalDate.plusDays(delayDays);
        requirement.setExpectedDate(newDate);
        requirementRepository.save(requirement);

        DelayRecord delayRecord = new DelayRecord();
        delayRecord.setRequirementId(requirementId);
        delayRecord.setNodeId(nodeId);
        delayRecord.setDeptId(requirement.getDeptId());
        delayRecord.setResponsibleDeptId(responsibleDeptId);
        delayRecord.setReason(reason);
        delayRecord.setDelayDays(delayDays);
        delayRecord.setOriginalDate(originalDate);
        delayRecord.setNewDate(newDate);
        delayRecord.setOperatorId(SecurityUtil.getCurrentUserId());

        DelayRecord saved = delayRecordRepository.save(delayRecord);

        operationLogService.log(OperationType.DELAY, requirementId, nodeId,
                "延期" + delayDays + "天，原因：" + reason);

        return saved;
    }

    public List<DelayRecord> getDelayRecordsByRequirement(Long requirementId) {
        return delayRecordRepository.findByRequirementIdOrderByCreatedAtDesc(requirementId);
    }

    public Page<DelayRecord> searchDelayRecords(DelayQueryDTO query, Pageable pageable) {
        Specification<DelayRecord> spec = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query.getDeptId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("deptId"), query.getDeptId()));
            }

            if (query.getResponsibleDeptId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("responsibleDeptId"), query.getResponsibleDeptId()));
            }

            if (query.getResponsibleDeptIds() != null && !query.getResponsibleDeptIds().isEmpty()) {
                predicates.add(root.get("responsibleDeptId").in(query.getResponsibleDeptIds()));
            }

            if (StringUtils.hasText(query.getKeyword())) {
                predicates.add(criteriaBuilder.like(root.get("reason"), "%" + query.getKeyword() + "%"));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return delayRecordRepository.findAll(spec, pageable);
    }

    public List<Object[]> getDelayStatisticsByDeptIds(List<Long> deptIds) {
        return delayRecordRepository.countByResponsibleDeptIdIn(deptIds);
    }

    public List<DelayRecord> getDelayRecordsByDeptIds(List<Long> deptIds) {
        return delayRecordRepository.findByResponsibleDeptIdIn(deptIds);
    }

    private void checkDelayPermission(Requirement requirement) {
        String role = SecurityUtil.getCurrentUserRole();

        if (RoleType.ADMIN.name().equals(role)) {
            return;
        }

        if (RoleType.DEPT_MANAGER.name().equals(role)) {
            Long currentUserId = SecurityUtil.getCurrentUserId();
            User currentUser = userRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && currentUser.getDeptId().equals(requirement.getDeptId())) {
                return;
            }
        }

        throw new RuntimeException("无权限进行延期操作");
    }
}
