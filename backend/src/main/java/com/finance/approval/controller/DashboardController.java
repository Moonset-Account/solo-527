package com.finance.approval.controller;

import com.finance.approval.dto.ApiResponse;
import com.finance.approval.entity.ApprovalRecord;
import com.finance.approval.entity.ExpenseApplication;
import com.finance.approval.enums.ApplicationStatus;
import com.finance.approval.repository.ApprovalRecordRepository;
import com.finance.approval.repository.ExpenseApplicationRepository;
import com.finance.approval.repository.SysUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ExpenseApplicationRepository applicationRepository;
    private final ApprovalRecordRepository approvalRecordRepository;
    private final SysUserRepository userRepository;

    @GetMapping("/statistics")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> getStatistics() {
        Map<String, Object> statistics = new HashMap<>();

        long totalApplications = applicationRepository.count();
        long pendingApplications = applicationRepository.findByStatus(ApplicationStatus.PENDING, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long approvedApplications = applicationRepository.findByStatus(ApplicationStatus.APPROVED, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long rejectedApplications = applicationRepository.findByStatus(ApplicationStatus.REJECTED, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long totalUsers = userRepository.count();

        List<ExpenseApplication> approvedList = applicationRepository.findByStatus(ApplicationStatus.APPROVED, org.springframework.data.domain.Pageable.unpaged()).getContent();
        BigDecimal totalApprovedAmount = approvedList.stream()
                .map(ExpenseApplication::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        statistics.put("totalApplications", totalApplications);
        statistics.put("pendingApplications", pendingApplications);
        statistics.put("approvedApplications", approvedApplications);
        statistics.put("rejectedApplications", rejectedApplications);
        statistics.put("totalUsers", totalUsers);
        statistics.put("totalApprovedAmount", totalApprovedAmount);
        statistics.put("approvalRate", totalApplications > 0 ? (double) approvedApplications / totalApplications : 0);

        return ApiResponse.success(statistics);
    }

    @GetMapping("/efficiency")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE_MANAGER')")
    public ApiResponse<Map<String, Object>> getEfficiencyData() {
        Map<String, Object> efficiency = new HashMap<>();

        List<ApprovalRecord> records = approvalRecordRepository.findAll();
        long totalApprovals = records.size();
        long totalTimeMinutes = 0;

        for (ApprovalRecord record : records) {
            if (record.getApprovalTime() != null && record.getCreatedAt() != null) {
                long diff = java.time.Duration.between(record.getCreatedAt(), record.getApprovalTime()).toMinutes();
                if (diff > 0) {
                    totalTimeMinutes += diff;
                }
            }
        }

        double avgApprovalTime = totalApprovals > 0 ? (double) totalTimeMinutes / totalApprovals : 0;

        efficiency.put("totalApprovals", totalApprovals);
        efficiency.put("avgApprovalTimeMinutes", avgApprovalTime);
        efficiency.put("avgApprovalTimeHours", avgApprovalTime / 60);

        Map<String, Long> dailyApprovals = new HashMap<>();
        for (ApprovalRecord record : records) {
            if (record.getApprovalTime() != null) {
                String date = record.getApprovalTime().toLocalDate().toString();
                dailyApprovals.put(date, dailyApprovals.getOrDefault(date, 0L) + 1);
            }
        }
        efficiency.put("dailyApprovals", dailyApprovals);

        return ApiResponse.success(efficiency);
    }

    @GetMapping("/expense-trend")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> getExpenseTrend(
            @RequestParam(required = false, defaultValue = "30") int days) {
        Map<String, Object> trend = new HashMap<>();

        LocalDateTime startDate = LocalDate.now().minusDays(days).atStartOfDay();
        LocalDateTime endDate = LocalDate.now().atTime(23, 59, 59);

        List<ExpenseApplication> applications = applicationRepository.findAll();
        List<Map<String, Object>> trendData = new ArrayList<>();

        Map<String, BigDecimal> dailyAmounts = new HashMap<>();
        Map<String, Long> dailyCounts = new HashMap<>();

        for (ExpenseApplication app : applications) {
            if (app.getStatus() == ApplicationStatus.APPROVED &&
                    app.getCompletedAt() != null &&
                    !app.getCompletedAt().isBefore(startDate) &&
                    !app.getCompletedAt().isAfter(endDate)) {
                String date = app.getCompletedAt().toLocalDate().toString();
                dailyAmounts.put(date, dailyAmounts.getOrDefault(date, BigDecimal.ZERO).add(app.getAmount()));
                dailyCounts.put(date, dailyCounts.getOrDefault(date, 0L) + 1);
            }
        }

        for (LocalDate date = startDate.toLocalDate(); !date.isAfter(endDate.toLocalDate()); date = date.plusDays(1)) {
            String dateStr = date.toString();
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", dateStr);
            dayData.put("amount", dailyAmounts.getOrDefault(dateStr, BigDecimal.ZERO));
            dayData.put("count", dailyCounts.getOrDefault(dateStr, 0L));
            trendData.add(dayData);
        }

        trend.put("trendData", trendData);
        trend.put("totalAmount", dailyAmounts.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add));
        trend.put("totalCount", dailyCounts.values().stream().mapToLong(Long::longValue).sum());
        trend.put("days", days);

        return ApiResponse.success(trend);
    }
}
