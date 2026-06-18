package com.emailgenerator.service;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.entity.RiskSample;
import com.emailgenerator.repository.RiskSampleRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RiskSampleService {

    private final RiskSampleRepository riskSampleRepository;

    public RiskSampleService(RiskSampleRepository riskSampleRepository) {
        this.riskSampleRepository = riskSampleRepository;
    }

    public PageResult<RiskSample> list(BaseQuery query, Long taskId) {
        Pageable pageable = PageRequest.of(
            query.getPageNum() - 1,
            query.getPageSize(),
            Sort.by(Sort.Direction.DESC, "createTime")
        );

        Specification<RiskSample> spec = buildSpecification(query, taskId);
        Page<RiskSample> page = riskSampleRepository.findAll(spec, pageable);

        return new PageResult<>(
            page.getTotalElements(),
            page.getContent(),
            query.getPageNum(),
            query.getPageSize()
        );
    }

    private Specification<RiskSample> buildSpecification(BaseQuery query, Long taskId) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (taskId != null) {
                predicates.add(criteriaBuilder.equal(root.get("taskId"), taskId));
            }
            if (query.getKeyword() != null && !query.getKeyword().isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("riskDescription"), "%" + query.getKeyword() + "%"));
            }
            if (query.getStatus() != null && !query.getStatus().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("reviewStatus"), query.getStatus()));
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
            if (query.getStartTime() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createTime"), query.getStartTime()));
            }
            if (query.getEndTime() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createTime"), query.getEndTime()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public RiskSample getById(Long id) {
        return riskSampleRepository.findById(id).orElse(null);
    }

    @Transactional
    public RiskSample review(Long id, String reviewStatus, String reviewComment, String reviewer) {
        RiskSample sample = riskSampleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("风险样本不存在"));

        if (!"PENDING".equals(sample.getReviewStatus())) {
            throw new RuntimeException("已复核的样本不能再次复核");
        }

        sample.setReviewStatus(reviewStatus);
        sample.setReviewComment(reviewComment);
        sample.setReviewBy(reviewer);
        sample.setReviewTime(LocalDateTime.now());

        return riskSampleRepository.save(sample);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        List<Object[]> riskTypeStats = riskSampleRepository.statsByRiskType();
        List<Map<String, Object>> riskTypeList = new ArrayList<>();
        for (Object[] row : riskTypeStats) {
            Map<String, Object> item = new HashMap<>();
            item.put("riskType", row[0]);
            item.put("count", row[1]);
            riskTypeList.add(item);
        }
        stats.put("byRiskType", riskTypeList);

        List<Object[]> legalOwnerStats = riskSampleRepository.statsByLegalOwner();
        List<Map<String, Object>> legalOwnerList = new ArrayList<>();
        for (Object[] row : legalOwnerStats) {
            Map<String, Object> item = new HashMap<>();
            item.put("legalOwner", row[0]);
            item.put("totalCount", row[1]);
            item.put("passedCount", row[2]);
            item.put("rejectedCount", row[3]);
            legalOwnerList.add(item);
        }
        stats.put("byLegalOwner", legalOwnerList);

        return stats;
    }
}
