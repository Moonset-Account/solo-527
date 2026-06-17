package com.approval.workflow.service;

import com.approval.workflow.dto.OperationLogQueryDTO;
import com.approval.workflow.entity.OperationLog;
import com.approval.workflow.entity.User;
import com.approval.workflow.enums.OperationType;
import com.approval.workflow.repository.OperationLogRepository;
import com.approval.workflow.repository.UserRepository;
import com.approval.workflow.util.SecurityUtil;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OperationLogService {

    private final OperationLogRepository operationLogRepository;
    private final UserRepository userRepository;

    public OperationLogService(OperationLogRepository operationLogRepository, UserRepository userRepository) {
        this.operationLogRepository = operationLogRepository;
        this.userRepository = userRepository;
    }

    public void log(OperationType operationType, Long requirementId, Long nodeId,
                     String detail, String beforeStatus, String afterStatus, String remark) {
        Long operatorId = SecurityUtil.getCurrentUserId();
        String operatorName = "";
        if (operatorId != null) {
            User user = userRepository.findById(operatorId).orElse(null);
            if (user != null) {
                operatorName = user.getRealName();
            }
        }

        OperationLog log = new OperationLog();
        log.setOperationType(operationType);
        log.setRequirementId(requirementId);
        log.setNodeId(nodeId);
        log.setOperatorId(operatorId);
        log.setOperatorName(operatorName);
        log.setDetail(detail);
        log.setBeforeStatus(beforeStatus);
        log.setAfterStatus(afterStatus);
        log.setRemark(remark);

        operationLogRepository.save(log);
    }

    public void log(OperationType operationType, Long requirementId, String detail) {
        log(operationType, requirementId, null, detail, null, null, null);
    }

    public void log(OperationType operationType, Long requirementId, Long nodeId, String detail) {
        log(operationType, requirementId, nodeId, detail, null, null, null);
    }

    public Page<OperationLog> getLogsByRequirement(Long requirementId, Pageable pageable) {
        return operationLogRepository.findByRequirementIdOrderByCreatedAtDesc(requirementId, pageable);
    }

    public Page<OperationLog> getLogsByOperator(Long operatorId, Pageable pageable) {
        return operationLogRepository.findByOperatorId(operatorId, pageable);
    }

    public Page<OperationLog> getAllLogs(Pageable pageable) {
        return operationLogRepository.findAll(pageable);
    }

    public Page<OperationLog> getLogsByType(OperationType operationType, Pageable pageable) {
        return operationLogRepository.findByOperationType(operationType, pageable);
    }

    public List<OperationLog> getLogsByRequirementIds(List<Long> requirementIds, OperationType operationType) {
        return operationLogRepository.findByRequirementIdInAndOperationType(requirementIds, operationType);
    }

    public Page<OperationLog> searchLogs(OperationLogQueryDTO query, Pageable pageable) {
        Specification<OperationLog> spec = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query.getOperationType() != null) {
                predicates.add(criteriaBuilder.equal(root.get("operationType"), query.getOperationType()));
            }

            if (query.getOperatorId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("operatorId"), query.getOperatorId()));
            }

            if (query.getRequirementId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("requirementId"), query.getRequirementId()));
            }

            if (query.getKeyword() != null && !query.getKeyword().trim().isEmpty()) {
                String keyword = "%" + query.getKeyword().trim() + "%";
                Predicate detailLike = criteriaBuilder.like(root.get("detail"), keyword);
                Predicate remarkLike = criteriaBuilder.like(root.get("remark"), keyword);
                Predicate operatorNameLike = criteriaBuilder.like(root.get("operatorName"), keyword);
                predicates.add(criteriaBuilder.or(detailLike, remarkLike, operatorNameLike));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return operationLogRepository.findAll(spec, pageable);
    }
}
