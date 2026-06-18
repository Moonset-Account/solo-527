package com.emailgenerator.service;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.entity.EmailRecord;
import com.emailgenerator.repository.EmailRecordRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailRecordService {

    private final EmailRecordRepository emailRecordRepository;

    public EmailRecordService(EmailRecordRepository emailRecordRepository) {
        this.emailRecordRepository = emailRecordRepository;
    }

    public PageResult<EmailRecord> list(BaseQuery query, Long taskId) {
        Pageable pageable = PageRequest.of(
            query.getPageNum() - 1,
            query.getPageSize(),
            Sort.by(Sort.Direction.DESC, "createTime")
        );

        Specification<EmailRecord> spec = buildSpecification(query, taskId);
        Page<EmailRecord> page = emailRecordRepository.findAll(spec, pageable);

        return new PageResult<>(
            page.getTotalElements(),
            page.getContent(),
            query.getPageNum(),
            query.getPageSize()
        );
    }

    private Specification<EmailRecord> buildSpecification(BaseQuery query, Long taskId) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (taskId != null) {
                predicates.add(criteriaBuilder.equal(root.get("taskId"), taskId));
            }
            if (query.getKeyword() != null && !query.getKeyword().isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("recipientEmail"), "%" + query.getKeyword() + "%"));
            }
            if (query.getStatus() != null && !query.getStatus().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), query.getStatus()));
            }
            if (query.getOwner() != null && !query.getOwner().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("owner"), query.getOwner()));
            }
            if (query.getSource() != null && !query.getSource().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("source"), query.getSource()));
            }
            if (query.getLegalOwner() != null && !query.getLegalOwner().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("legalOwner"), query.getLegalOwner()));
            }
            if (query.getErrorReason() != null && !query.getErrorReason().isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("errorMessage"), "%" + query.getErrorReason() + "%"));
            }
            if (query.getStartTime() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createTime"), query.getStartTime()));
            }
            if (query.getEndTime() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createTime"), query.getEndTime()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public EmailRecord getById(Long id) {
        return emailRecordRepository.findById(id).orElse(null);
    }

    public List<EmailRecord> listByTaskId(Long taskId) {
        return emailRecordRepository.findByTaskId(taskId, org.springframework.data.domain.Pageable.unpaged()).getContent();
    }

    public Map<String, Object> getStatsByLegalOwner() {
        List<Object[]> results = emailRecordRepository.statsByLegalOwner();
        Map<String, Object> stats = new HashMap<>();
        List<Map<String, Object>> list = new ArrayList<>();

        long totalAll = 0;
        long successAll = 0;
        long failAll = 0;
        long riskAll = 0;

        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            String legalOwner = (String) row[0];
            long total = ((Number) row[1]).longValue();
            long success = ((Number) row[2]).longValue();
            long fail = ((Number) row[3]).longValue();
            long risk = ((Number) row[4]).longValue();

            item.put("legalOwner", legalOwner);
            item.put("totalCount", total);
            item.put("successCount", success);
            item.put("failCount", fail);
            item.put("riskCount", risk);
            item.put("successRate", total > 0 ? (double) success / total * 100 : 0);
            list.add(item);

            totalAll += total;
            successAll += success;
            failAll += fail;
            riskAll += risk;
        }

        stats.put("details", list);
        stats.put("totalCount", totalAll);
        stats.put("successCount", successAll);
        stats.put("failCount", failAll);
        stats.put("riskCount", riskAll);
        stats.put("overallSuccessRate", totalAll > 0 ? (double) successAll / totalAll * 100 : 0);

        return stats;
    }

    public List<Map<String, Object>> getErrorStats(java.time.LocalDateTime startTime, java.time.LocalDateTime endTime) {
        List<Object[]> results = emailRecordRepository.errorStatsByDateRange(startTime, endTime);
        List<Map<String, Object>> stats = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("errorReason", row[0]);
            item.put("count", row[1]);
            stats.add(item);
        }
        return stats;
    }

    public List<Map<String, Object>> getDateStats(java.time.LocalDateTime startTime, java.time.LocalDateTime endTime) {
        List<Object[]> results = emailRecordRepository.statsByDateRange(startTime, endTime);
        List<Map<String, Object>> stats = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("date", row[0].toString());
            item.put("totalCount", row[1]);
            item.put("successCount", row[2]);
            item.put("failCount", row[3]);
            stats.add(item);
        }
        return stats;
    }
}
