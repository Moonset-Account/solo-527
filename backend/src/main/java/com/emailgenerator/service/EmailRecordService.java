package com.emailgenerator.service;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.entity.EmailRecord;
import com.emailgenerator.entity.EmailRecordVersion;
import com.emailgenerator.repository.EmailRecordRepository;
import com.emailgenerator.repository.EmailRecordVersionRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailRecordService {

    private final EmailRecordRepository emailRecordRepository;
    private final EmailRecordVersionRepository versionRepository;

    public EmailRecordService(EmailRecordRepository emailRecordRepository,
                              EmailRecordVersionRepository versionRepository) {
        this.emailRecordRepository = emailRecordRepository;
        this.versionRepository = versionRepository;
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

    @Transactional
    public EmailRecord updateDraft(Long id, String subject, String content,
                                   String recipientEmail, String recipientName,
                                   String changeLog, String operator) {
        EmailRecord record = emailRecordRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("邮件记录不存在"));

        saveVersion(record, record.getChangeLog() != null ? record.getChangeLog() : "初始版本", operator);

        if (subject != null) record.setSubject(subject);
        if (content != null) record.setContent(content);
        if (recipientEmail != null) record.setRecipientEmail(recipientEmail);
        if (recipientName != null) record.setRecipientName(recipientName);
        record.setVersion((record.getVersion() == null ? 1 : record.getVersion()) + 1);
        record.setChangeLog(changeLog != null ? changeLog : "更新草稿");
        record.setStatus("DRAFT");

        return emailRecordRepository.save(record);
    }

    private void saveVersion(EmailRecord record, String changeLog, String operator) {
        EmailRecordVersion version = new EmailRecordVersion();
        version.setRecordId(record.getId());
        version.setVersion(record.getVersion() == null ? 1 : record.getVersion());
        version.setSubject(record.getSubject());
        version.setContent(record.getContent());
        version.setRecipientEmail(record.getRecipientEmail());
        version.setRecipientName(record.getRecipientName());
        version.setChangeLog(changeLog);
        version.setCreateBy(operator);
        versionRepository.save(version);
    }

    public List<EmailRecordVersion> listVersions(Long recordId) {
        return versionRepository.findByRecordIdOrderByVersionDesc(recordId);
    }

    public EmailRecordVersion getVersion(Long recordId, Integer version) {
        return versionRepository.findByRecordIdAndVersion(recordId, version);
    }

    @Transactional
    public EmailRecord revertToVersion(Long recordId, Integer version, String operator) {
        EmailRecordVersion recordVersion = versionRepository.findByRecordIdAndVersion(recordId, version);
        if (recordVersion == null) {
            throw new RuntimeException("版本不存在");
        }

        EmailRecord record = emailRecordRepository.findById(recordId)
            .orElseThrow(() -> new RuntimeException("邮件记录不存在"));

        saveVersion(record, "保存当前版本，准备回滚", operator);

        record.setSubject(recordVersion.getSubject());
        record.setContent(recordVersion.getContent());
        record.setRecipientEmail(recordVersion.getRecipientEmail());
        record.setRecipientName(recordVersion.getRecipientName());
        record.setVersion((record.getVersion() == null ? 1 : record.getVersion()) + 1);
        record.setChangeLog("回滚到版本 v" + version);
        record.setStatus("DRAFT");

        return emailRecordRepository.save(record);
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
