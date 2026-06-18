package com.emailgenerator.service;

import com.emailgenerator.common.BaseQuery;
import com.emailgenerator.common.PageResult;
import com.emailgenerator.dto.BatchTaskDTO;
import com.emailgenerator.entity.BatchTask;
import com.emailgenerator.entity.EmailRecord;
import com.emailgenerator.entity.EmailTemplate;
import com.emailgenerator.entity.RiskSample;
import com.emailgenerator.repository.BatchTaskRepository;
import com.emailgenerator.repository.EmailRecordRepository;
import com.emailgenerator.repository.EmailTemplateRepository;
import com.emailgenerator.repository.RiskSampleRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
public class BatchTaskService {

    private final BatchTaskRepository batchTaskRepository;
    private final EmailTemplateRepository templateRepository;
    private final EmailRecordRepository emailRecordRepository;
    private final RiskSampleRepository riskSampleRepository;
    private final CallLogService callLogService;
    private final Random random = new Random();

    public BatchTaskService(BatchTaskRepository batchTaskRepository,
                            EmailTemplateRepository templateRepository,
                            EmailRecordRepository emailRecordRepository,
                            RiskSampleRepository riskSampleRepository,
                            CallLogService callLogService) {
        this.batchTaskRepository = batchTaskRepository;
        this.templateRepository = templateRepository;
        this.emailRecordRepository = emailRecordRepository;
        this.riskSampleRepository = riskSampleRepository;
        this.callLogService = callLogService;
    }

    public PageResult<BatchTask> list(BaseQuery query) {
        Pageable pageable = PageRequest.of(
            query.getPageNum() - 1,
            query.getPageSize(),
            Sort.by(Sort.Direction.DESC, "createTime")
        );

        Specification<BatchTask> spec = buildSpecification(query);
        Page<BatchTask> page = batchTaskRepository.findAll(spec, pageable);

        return new PageResult<>(
            page.getTotalElements(),
            page.getContent(),
            query.getPageNum(),
            query.getPageSize()
        );
    }

    private Specification<BatchTask> buildSpecification(BaseQuery query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query.getKeyword() != null && !query.getKeyword().isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("taskName"), "%" + query.getKeyword() + "%"));
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
            if (query.getStartTime() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createTime"), query.getStartTime()));
            }
            if (query.getEndTime() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createTime"), query.getEndTime()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public BatchTask getById(Long id) {
        return batchTaskRepository.findById(id).orElse(null);
    }

    @Transactional
    public BatchTask create(BatchTaskDTO dto, String operator) {
        EmailTemplate template = templateRepository.findById(dto.getTemplateId())
            .orElseThrow(() -> new RuntimeException("模板不存在"));

        BatchTask task = new BatchTask();
        BeanUtils.copyProperties(dto, task);
        task.setTemplateName(template.getName());
        task.setSource(template.getSource());
        task.setOwner(template.getOwner());
        task.setLegalOwner(template.getLegalOwner());
        task.setStatus("PENDING");
        task.setTotalCount(0);
        task.setSuccessCount(0);
        task.setFailCount(0);
        task.setRiskCount(0);
        task.setCreateBy(operator);
        task.setUpdateBy(operator);

        return batchTaskRepository.save(task);
    }

    @Transactional
    public BatchTask update(BatchTaskDTO dto, String operator) {
        BatchTask task = batchTaskRepository.findById(dto.getId())
            .orElseThrow(() -> new RuntimeException("任务不存在"));

        if (!"PENDING".equals(task.getStatus())) {
            throw new RuntimeException("只有待执行的任务才能修改");
        }

        if (dto.getTemplateId() != null && !dto.getTemplateId().equals(task.getTemplateId())) {
            EmailTemplate template = templateRepository.findById(dto.getTemplateId())
                .orElseThrow(() -> new RuntimeException("模板不存在"));
            task.setTemplateId(template.getId());
            task.setTemplateName(template.getName());
            task.setSource(template.getSource());
            task.setOwner(template.getOwner());
            task.setLegalOwner(template.getLegalOwner());
        }

        if (dto.getTaskName() != null) {
            task.setTaskName(dto.getTaskName());
        }
        if (dto.getDescription() != null) {
            task.setDescription(dto.getDescription());
        }
        if (dto.getScheduleTime() != null) {
            task.setScheduleTime(dto.getScheduleTime());
        }
        if (dto.getDataSource() != null) {
            task.setDataSource(dto.getDataSource());
        }

        task.setUpdateBy(operator);
        return batchTaskRepository.save(task);
    }

    @Transactional
    public void delete(Long id) {
        BatchTask task = batchTaskRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("任务不存在"));

        if ("RUNNING".equals(task.getStatus())) {
            throw new RuntimeException("执行中的任务不能删除");
        }

        batchTaskRepository.deleteById(id);
    }

    @Async
    @Transactional
    public void executeTask(Long taskId, String operator) {
        BatchTask task = batchTaskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("任务不存在"));

        if (!"PENDING".equals(task.getStatus()) && !"FAILED".equals(task.getStatus())) {
            return;
        }

        String requestId = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();

        try {
            task.setStatus("RUNNING");
            task.setStartTime(LocalDateTime.now());
            task.setUpdateBy(operator);
            batchTaskRepository.save(task);

            EmailTemplate template = templateRepository.findById(task.getTemplateId())
                .orElseThrow(() -> new RuntimeException("模板不存在"));

            int totalCount = 50 + random.nextInt(50);
            int successCount = 0;
            int failCount = 0;
            int riskCount = 0;

            for (int i = 0; i < totalCount; i++) {
                EmailRecord record = generateEmailRecord(task, template, i, operator);
                emailRecordRepository.save(record);

                if ("SUCCESS".equals(record.getStatus())) {
                    successCount++;
                } else {
                    failCount++;
                }

                if (Boolean.TRUE.equals(record.getIsRisk())) {
                    riskCount++;
                    RiskSample riskSample = createRiskSample(record, task, operator);
                    riskSampleRepository.save(riskSample);
                }
            }

            task.setTotalCount(totalCount);
            task.setSuccessCount(successCount);
            task.setFailCount(failCount);
            task.setRiskCount(riskCount);
            task.setStatus("COMPLETED");
            task.setEndTime(LocalDateTime.now());
            task.setUpdateBy(operator);
            batchTaskRepository.save(task);

            long costTime = System.currentTimeMillis() - startTime;
            callLogService.logCall(requestId, "batchTask/execute", "POST",
                String.valueOf(taskId), "SUCCESS", null, null, costTime,
                task.getSource(), operator, task.getLegalOwner(), taskId, template.getId(), operator);

        } catch (Exception e) {
            task.setStatus("FAILED");
            task.setEndTime(LocalDateTime.now());
            task.setUpdateBy(operator);
            batchTaskRepository.save(task);

            long costTime = System.currentTimeMillis() - startTime;
            callLogService.logCall(requestId, "batchTask/execute", "POST",
                String.valueOf(taskId), "FAILED", "SYSTEM_ERROR", e.getMessage(), costTime,
                task.getSource(), operator, task.getLegalOwner(), taskId, task.getTemplateId(), operator);
        }
    }

    private EmailRecord generateEmailRecord(BatchTask task, EmailTemplate template, int index, String operator) {
        EmailRecord record = new EmailRecord();
        record.setTaskId(task.getId());
        record.setTaskName(task.getTaskName());
        record.setTemplateId(template.getId());
        record.setTemplateName(template.getName());
        record.setRecipientEmail("user" + index + "@example.com");
        record.setRecipientName("用户" + index);
        record.setSubject(template.getSubject() + " - 第" + (index + 1) + "封");

        String content = template.getContent()
            .replace("{name}", "用户" + index)
            .replace("{company}", "示例公司");
        record.setContent(content);

        record.setSource(task.getSource());
        record.setOwner(task.getOwner());
        record.setLegalOwner(task.getLegalOwner());
        record.setCreateBy(operator);
        record.setGenerateTime(LocalDateTime.now());

        int rand = random.nextInt(100);
        if (rand < 85) {
            record.setStatus("SUCCESS");
        } else if (rand < 95) {
            record.setStatus("FAILED");
            record.setErrorMessage(getRandomErrorReason());
        } else {
            record.setStatus("SUCCESS");
            record.setIsRisk(true);
            record.setRiskReason(getRandomRiskReason());
        }

        return record;
    }

    private String getRandomErrorReason() {
        String[] reasons = {
            "模板变量解析失败",
            "收件人地址无效",
            "内容长度超限",
            "系统内部错误",
            "数据库连接超时"
        };
        return reasons[random.nextInt(reasons.length)];
    }

    private String getRandomRiskReason() {
        String[] reasons = {
            "包含敏感词汇",
            "可能涉及违规承诺",
            "数据准确性存疑",
            "需要法务复核"
        };
        return reasons[random.nextInt(reasons.length)];
    }

    private RiskSample createRiskSample(EmailRecord record, BatchTask task, String operator) {
        RiskSample riskSample = new RiskSample();
        riskSample.setRecordId(record.getId());
        riskSample.setTaskId(task.getId());
        riskSample.setTaskName(task.getTaskName());
        riskSample.setTemplateId(record.getTemplateId());
        riskSample.setTemplateName(record.getTemplateName());
        riskSample.setSubject(record.getSubject());
        riskSample.setContent(record.getContent());
        riskSample.setRiskType("CONTENT_RISK");
        riskSample.setRiskDescription(record.getRiskReason());
        riskSample.setRiskLevel(getRandomRiskLevel());
        riskSample.setSource(record.getSource());
        riskSample.setOwner(record.getOwner());
        riskSample.setLegalOwner(record.getLegalOwner());
        riskSample.setReviewStatus("PENDING");
        riskSample.setCreateBy(operator);
        return riskSample;
    }

    private String getRandomRiskLevel() {
        String[] levels = {"LOW", "MEDIUM", "HIGH"};
        return levels[random.nextInt(levels.length)];
    }

    @Transactional
    public BatchTask startTask(Long id, String operator) {
        executeTask(id, operator);
        return getById(id);
    }
}
