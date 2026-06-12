package com.finance.approval.service;

import com.finance.approval.enums.ApplicationStatus;
import com.finance.approval.repository.ApprovalRecordRepository;
import com.finance.approval.repository.ExpenseApplicationRepository;
import com.finance.approval.repository.TimeoutExceptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ExpenseApplicationRepository expenseApplicationRepository;
    private final ApprovalRecordRepository approvalRecordRepository;
    private final TimeoutExceptionRepository timeoutExceptionRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String DASHBOARD_CACHE_KEY = "dashboard:statistics";
    private static final String EFFICIENCY_CACHE_KEY = "dashboard:efficiency";
    private static final long CACHE_EXPIRE_MINUTES = 30;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStatistics() {
        @SuppressWarnings("unchecked")
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(DASHBOARD_CACHE_KEY);
        if (cached != null) {
            return cached;
        }

        Map<String, Object> statistics = new HashMap<>();

        long totalApplications = expenseApplicationRepository.count();
        long pendingCount = expenseApplicationRepository.countByStatus(ApplicationStatus.PENDING);
        long approvedCount = expenseApplicationRepository.countByStatus(ApplicationStatus.APPROVED);
        long rejectedCount = expenseApplicationRepository.countByStatus(ApplicationStatus.REJECTED);
        long draftCount = expenseApplicationRepository.countByStatus(ApplicationStatus.DRAFT);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        BigDecimal monthTotal = expenseApplicationRepository.getTotalApprovedAmount(monthStart, now);

        statistics.put("totalApplications", totalApplications);
        statistics.put("pendingCount", pendingCount);
        statistics.put("approvedCount", approvedCount);
        statistics.put("rejectedCount", rejectedCount);
        statistics.put("draftCount", draftCount);
        statistics.put("monthTotalAmount", monthTotal);
        statistics.put("approvalRate", totalApplications > 0
                ? (double) approvedCount / totalApplications * 100 : 0);
        statistics.put("pendingRate", totalApplications > 0
                ? (double) pendingCount / totalApplications * 100 : 0);

        redisTemplate.opsForValue().set(DASHBOARD_CACHE_KEY, statistics, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        return statistics;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getApprovalEfficiencyData() {
        @SuppressWarnings("unchecked")
        Map<String, Object> cached = (Map<String, Object>) redisTemplate.opsForValue().get(EFFICIENCY_CACHE_KEY);
        if (cached != null) {
            return cached;
        }

        Map<String, Object> efficiency = new HashMap<>();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime threeMonthsAgo = now.minusMonths(3);

        Double avgApprovalTime = approvalRecordRepository.getAverageApprovalTime(threeMonthsAgo, now);
        List<Object[]> approverCount = approvalRecordRepository.getApprovalCountByApprover(threeMonthsAgo, now);
        List<Object[]> timeoutByApprover = timeoutExceptionRepository.getTimeoutCountByApprover();

        efficiency.put("averageApprovalTimeSeconds", avgApprovalTime != null ? avgApprovalTime : 0);
        efficiency.put("averageApprovalTimeMinutes", avgApprovalTime != null ? avgApprovalTime / 60 : 0);
        efficiency.put("approvalCountByApprover", approverCount);
        efficiency.put("timeoutCountByApprover", timeoutByApprover);

        redisTemplate.opsForValue().set(EFFICIENCY_CACHE_KEY, efficiency, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
        return efficiency;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getExpenseStatistics(LocalDateTime start, LocalDateTime end) {
        Map<String, Object> statistics = new HashMap<>();

        if (start == null) {
            start = LocalDateTime.now().minusMonths(1);
        }
        if (end == null) {
            end = LocalDateTime.now();
        }

        BigDecimal totalAmount = expenseApplicationRepository.getTotalApprovedAmount(start, end);
        List<Object[]> expenseByType = expenseApplicationRepository.getExpenseStatisticsByType(start, end);

        statistics.put("totalAmount", totalAmount);
        statistics.put("startDate", start);
        statistics.put("endDate", end);
        statistics.put("expenseByType", expenseByType);

        return statistics;
    }

    public void clearDashboardCache() {
        redisTemplate.delete(DASHBOARD_CACHE_KEY);
        redisTemplate.delete(EFFICIENCY_CACHE_KEY);
    }
}
