package com.pm.workstation.service.impl;

import com.pm.workstation.dto.PageResultDTO;
import com.pm.workstation.dto.ReportQueryDTO;
import com.pm.workstation.entity.CollaborationReport;
import com.pm.workstation.entity.Requirement;
import com.pm.workstation.enums.RequirementConclusion;
import com.pm.workstation.enums.RequirementStatus;
import com.pm.workstation.repository.CollaborationReportRepository;
import com.pm.workstation.repository.RequirementRepository;
import com.pm.workstation.service.ReportService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportServiceImpl implements ReportService {

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private CollaborationReportRepository collaborationReportRepository;

    @Override
    @Transactional
    public CollaborationReport generateDailyReport() {
        LocalDate today = LocalDate.now();
        long totalRequirements = requirementRepository.count();
        long completedCount = requirementRepository.countByStatus(RequirementStatus.COMPLETED);
        long delayedCount = requirementRepository.findByConclusion(RequirementConclusion.DELAYED).size();
        long onTimeCount = requirementRepository.findByConclusion(RequirementConclusion.ON_TIME).size();

        BigDecimal delayRatio = BigDecimal.ZERO;
        long conclusionTotal = onTimeCount + delayedCount;
        if (conclusionTotal > 0) {
            delayRatio = BigDecimal.valueOf(delayedCount)
                    .divide(BigDecimal.valueOf(conclusionTotal), 4, RoundingMode.HALF_UP);
        }

        List<Requirement> completedReqs = requirementRepository.findByStatus(RequirementStatus.COMPLETED);
        BigDecimal avgProcessDays = BigDecimal.ZERO;
        if (!completedReqs.isEmpty()) {
            double avg = completedReqs.stream()
                    .filter(r -> r.getCompletedAt() != null)
                    .mapToLong(r -> ChronoUnit.DAYS.between(r.getCreatedAt(), r.getCompletedAt()))
                    .average()
                    .orElse(0.0);
            avgProcessDays = BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
        }

        Map<String, Map<String, Long>> deptMetrics = new LinkedHashMap<>();
        List<Requirement> allReqs = requirementRepository.findAll();
        for (Requirement req : allReqs) {
            if (req.getDepartment() != null) {
                deptMetrics.computeIfAbsent(req.getDepartment(), k -> {
                    Map<String, Long> m = new HashMap<>();
                    m.put("total", 0L);
                    m.put("completed", 0L);
                    m.put("delayed", 0L);
                    return m;
                });
                Map<String, Long> metrics = deptMetrics.get(req.getDepartment());
                metrics.merge("total", 1L, Long::sum);
                if (req.getStatus() == RequirementStatus.COMPLETED) {
                    metrics.merge("completed", 1L, Long::sum);
                }
                if (req.getConclusion() == RequirementConclusion.DELAYED) {
                    metrics.merge("delayed", 1L, Long::sum);
                }
            }
        }

        String deptMetricsJson = deptMetrics.toString();

        collaborationReportRepository.findByReportDate(today).ifPresent(collaborationReportRepository::delete);

        CollaborationReport report = new CollaborationReport();
        report.setReportDate(today);
        report.setTotalRequirements((int) totalRequirements);
        report.setCompletedCount((int) completedCount);
        report.setDelayedCount((int) delayedCount);
        report.setDelayRatio(delayRatio);
        report.setAvgProcessDays(avgProcessDays);
        report.setDeptMetrics(deptMetricsJson);
        report.setCreatedAt(LocalDateTime.now());
        return collaborationReportRepository.save(report);
    }

    @Override
    public PageResultDTO<CollaborationReport> getReports(ReportQueryDTO query) {
        int page = query.getPage();
        int size = query.getSize();
        if (query.getStartDate() != null && query.getEndDate() != null) {
            List<CollaborationReport> reports = collaborationReportRepository
                    .findByReportDateBetweenOrderByReportDateDesc(query.getStartDate(), query.getEndDate());
            int start = (page - 1) * size;
            int end = Math.min(start + size, reports.size());
            List<CollaborationReport> pageList = start < reports.size()
                    ? reports.subList(start, end) : List.of();
            return PageResultDTO.of(pageList, reports.size(), page, size);
        }
        Page<CollaborationReport> pageResult = collaborationReportRepository
                .findAll(PageRequest.of(page - 1, size));
        return PageResultDTO.of(pageResult.getContent(), pageResult.getTotalElements(), page, size);
    }

    @Override
    public BigDecimal getDelayRatio(String startDate, String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.plusDays(1).atStartOfDay();

        List<Requirement> completed = requirementRepository.findCompletedBetween(startDateTime, endDateTime);
        long delayedCount = completed.stream()
                .filter(r -> r.getConclusion() == RequirementConclusion.DELAYED)
                .count();
        long onTimeCount = completed.stream()
                .filter(r -> r.getConclusion() == RequirementConclusion.ON_TIME)
                .count();
        long total = delayedCount + onTimeCount;
        if (total == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(delayedCount)
                .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP);
    }

    @Override
    public Map<String, Object> getDeptMetrics() {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Requirement> allReqs = requirementRepository.findAll();
        Map<String, Map<String, Long>> deptData = new LinkedHashMap<>();

        for (Requirement req : allReqs) {
            String dept = req.getDepartment();
            if (dept == null) continue;
            deptData.computeIfAbsent(dept, k -> {
                Map<String, Long> m = new HashMap<>();
                m.put("total", 0L);
                m.put("completed", 0L);
                m.put("delayed", 0L);
                return m;
            });
            Map<String, Long> metrics = deptData.get(dept);
            metrics.merge("total", 1L, Long::sum);
            if (req.getStatus() == RequirementStatus.COMPLETED) {
                metrics.merge("completed", 1L, Long::sum);
            }
            if (req.getConclusion() == RequirementConclusion.DELAYED) {
                metrics.merge("delayed", 1L, Long::sum);
            }
        }

        result.put("departments", deptData);
        return result;
    }
}
