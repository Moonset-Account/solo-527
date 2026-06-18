package com.emailgenerator.service;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.entity.CallLog;
import com.emailgenerator.repository.CallLogRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CallLogService {

    private final CallLogRepository callLogRepository;

    public CallLogService(CallLogRepository callLogRepository) {
        this.callLogRepository = callLogRepository;
    }

    public void logCall(String requestId, String apiName, String method, String requestParams,
                        String status, String errorCode, String errorMessage, Long costTime,
                        String source, String owner, String legalOwner, Long taskId, Long templateId,
                        String createBy) {
        CallLog log = new CallLog();
        log.setRequestId(requestId);
        log.setApiName(apiName);
        log.setMethod(method);
        log.setRequestParams(requestParams);
        log.setStatus(status);
        log.setErrorCode(errorCode);
        log.setErrorMessage(errorMessage);
        log.setCostTime(costTime);
        log.setSource(source);
        log.setOwner(owner);
        log.setLegalOwner(legalOwner);
        log.setTaskId(taskId);
        log.setTemplateId(templateId);
        log.setCreateBy(createBy);
        callLogRepository.save(log);
    }

    public PageResult<CallLog> list(BaseQuery query) {
        Pageable pageable = PageRequest.of(
            query.getPageNum() - 1,
            query.getPageSize(),
            Sort.by(Sort.Direction.DESC, "createTime")
        );

        Specification<CallLog> spec = buildSpecification(query);
        Page<CallLog> page = callLogRepository.findAll(spec, pageable);

        return new PageResult<>(
            page.getTotalElements(),
            page.getContent(),
            query.getPageNum(),
            query.getPageSize()
        );
    }

    private Specification<CallLog> buildSpecification(BaseQuery query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query.getKeyword() != null && !query.getKeyword().isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("apiName"), "%" + query.getKeyword() + "%"));
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

    public CallLog getById(Long id) {
        return callLogRepository.findById(id).orElse(null);
    }

    public List<Map<String, Object>> getErrorStats(LocalDateTime startTime, LocalDateTime endTime) {
        List<Object[]> results = callLogRepository.errorStatsByDateRange(startTime, endTime);
        List<Map<String, Object>> stats = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("errorCode", row[0]);
            item.put("errorMessage", row[1]);
            item.put("count", row[2]);
            stats.add(item);
        }
        return stats;
    }

    public List<Map<String, Object>> getApiStats(LocalDateTime startTime, LocalDateTime endTime) {
        List<Object[]> results = callLogRepository.statsByApiAndDateRange(startTime, endTime);
        List<Map<String, Object>> stats = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> item = new HashMap<>();
            item.put("apiName", row[0]);
            item.put("totalCount", row[1]);
            item.put("successCount", row[2]);
            item.put("failCount", row[3]);
            item.put("avgCostTime", row[4]);
            stats.add(item);
        }
        return stats;
    }
}
