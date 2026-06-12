package com.energy.service.impl;

import com.energy.dto.AlertQueryDTO;
import com.energy.dto.AssignAlertDTO;
import com.energy.dto.HandleAlertDTO;
import com.energy.entity.Alert;
import com.energy.entity.AlertHandling;
import com.energy.repository.AlertHandlingRepository;
import com.energy.repository.AlertRepository;
import com.energy.service.AlertService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepository;
    private final AlertHandlingRepository handlingRepository;

    @Override
    @Cacheable(value = "alerts", key = "#dto.hashCode()")
    public Page<Alert> queryAlerts(AlertQueryDTO dto) {
        Specification<Alert> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (dto.getStartTime() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("alertTime"), dto.getStartTime()));
            }
            if (dto.getEndTime() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("alertTime"), dto.getEndTime()));
            }
            if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), dto.getStatus()));
            }
            if (dto.getAssignee() != null && !dto.getAssignee().isEmpty()) {
                predicates.add(cb.equal(root.get("assignee"), dto.getAssignee()));
            }
            if (dto.getAlertType() != null && !dto.getAlertType().isEmpty()) {
                predicates.add(cb.equal(root.get("alertType"), dto.getAlertType()));
            }
            if (dto.getAlertLevel() != null && !dto.getAlertLevel().isEmpty()) {
                predicates.add(cb.equal(root.get("alertLevel"), dto.getAlertLevel()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        PageRequest pageable = PageRequest.of(dto.getPage(), dto.getSize(), Sort.by(Sort.Direction.DESC, "alertTime"));
        return alertRepository.findAll(spec, pageable);
    }

    @Override
    public Alert getAlertById(Long id) {
        return alertRepository.findById(id).orElseThrow(() -> new RuntimeException("告警不存在"));
    }

    @Override
    @Transactional
    @CacheEvict(value = "alerts", allEntries = true)
    public Alert assignAlert(AssignAlertDTO dto) {
        Alert alert = alertRepository.findById(dto.getAlertId())
                .orElseThrow(() -> new RuntimeException("告警不存在"));
        alert.setAssignee(dto.getAssignee());
        alert.setAssignTime(LocalDateTime.now());
        alert.setStatus("ASSIGNED");
        alert.setUpdateTime(LocalDateTime.now());
        return alertRepository.save(alert);
    }

    @Override
    @Transactional
    @CacheEvict(value = "alerts", allEntries = true)
    public AlertHandling handleAlert(HandleAlertDTO dto) {
        Alert alert = alertRepository.findById(dto.getAlertId())
                .orElseThrow(() -> new RuntimeException("告警不存在"));
        alert.setStatus(dto.getHandleResult());
        alert.setUpdateTime(LocalDateTime.now());
        alertRepository.save(alert);

        AlertHandling handling = new AlertHandling();
        handling.setAlertId(dto.getAlertId());
        handling.setHandler(dto.getHandler());
        handling.setHandleTime(LocalDateTime.now());
        handling.setHandleResult(dto.getHandleResult());
        handling.setHandleRemark(dto.getHandleRemark());
        if (alert.getAssignTime() != null) {
            handling.setResponseDuration((int) Duration.between(alert.getAssignTime(), handling.getHandleTime()).toMinutes());
        }
        return handlingRepository.save(handling);
    }

    @Override
    public List<AlertHandling> getHandlingHistory(Long alertId) {
        return handlingRepository.findByAlertIdOrderByHandleTimeDesc(alertId);
    }

    @Override
    public Map<String, Long> getAlertStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("pending", alertRepository.countByStatus("PENDING"));
        stats.put("assigned", alertRepository.countByStatus("ASSIGNED"));
        stats.put("processing", alertRepository.countByStatus("PROCESSING"));
        stats.put("resolved", alertRepository.countByStatus("RESOLVED"));
        stats.put("total", alertRepository.count());
        return stats;
    }

    @Override
    public List<Alert> getAbnormalMeters(AlertQueryDTO dto) {
        LocalDateTime start = dto.getStartTime() != null ? dto.getStartTime() : LocalDateTime.now().minusHours(24);
        LocalDateTime end = dto.getEndTime() != null ? dto.getEndTime() : LocalDateTime.now();
        return alertRepository.findByFilters(start, end, dto.getStatus(), dto.getAssignee());
    }
}
