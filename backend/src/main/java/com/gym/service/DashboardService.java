package com.gym.service;

import com.gym.enums.BookingStatus;
import com.gym.repository.DashboardRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    private final DashboardRepository dashboardRepository;

    public DashboardService(DashboardRepository dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    public Map<String, Object> getDashboardStats(LocalDate startDate, LocalDate endDate, Long coachId, BookingStatus status) {
        Map<String, Object> stats = new HashMap<>();

        boolean hasStatusFilter = status != null;

        long totalBookings = dashboardRepository.countBookings(startDate, endDate, coachId, status);

        long completedBookings;
        long cancelledBookings;
        long pendingBookings;
        long privateBookings;
        long groupBookings;

        if (hasStatusFilter) {
            switch (status) {
                case COMPLETED:
                    completedBookings = totalBookings;
                    cancelledBookings = 0;
                    pendingBookings = 0;
                    break;
                case CANCELLED:
                case NO_SHOW:
                    completedBookings = 0;
                    cancelledBookings = totalBookings;
                    pendingBookings = 0;
                    break;
                case BOOKED:
                case CHECKED_IN:
                default:
                    completedBookings = 0;
                    cancelledBookings = 0;
                    pendingBookings = totalBookings;
                    break;
            }
            privateBookings = dashboardRepository.countBookingsByTypeAndStatus(startDate, endDate, coachId, status, "PRIVATE");
            groupBookings = dashboardRepository.countBookingsByTypeAndStatus(startDate, endDate, coachId, status, "GROUP");
        } else {
            completedBookings = dashboardRepository.countCompletedBookings(startDate, endDate, coachId);
            cancelledBookings = dashboardRepository.countCancelledBookings(startDate, endDate, coachId);
            pendingBookings = totalBookings - completedBookings - cancelledBookings;
            privateBookings = dashboardRepository.countPrivateBookings(startDate, endDate, coachId);
            groupBookings = dashboardRepository.countGroupBookings(startDate, endDate, coachId);
        }

        long totalGroupClasses = dashboardRepository.countGroupClasses(startDate, endDate, coachId);
        long cancelledGroupClasses = dashboardRepository.countCancelledGroupClasses(startDate, endDate, coachId);
        long totalPackages = dashboardRepository.countMemberPackages(coachId);
        long activePackages = dashboardRepository.countActivePackages(coachId);
        long remainingSessions = dashboardRepository.sumRemainingSessions(coachId);
        long activeMembers = dashboardRepository.countActiveMembers(startDate, endDate, coachId);
        long activePackageMembers = dashboardRepository.countActivePackageMembers(coachId);

        stats.put("totalBookings", totalBookings);
        stats.put("completedBookings", completedBookings);
        stats.put("cancelledBookings", cancelledBookings);
        stats.put("pendingBookings", pendingBookings);
        stats.put("privateBookings", privateBookings);
        stats.put("groupBookings", groupBookings);

        double completionRate = totalBookings > 0 ? (completedBookings * 100.0 / totalBookings) : 0;
        stats.put("completionRate", BigDecimal.valueOf(completionRate).setScale(1, RoundingMode.HALF_UP).doubleValue());

        stats.put("totalGroupClasses", totalGroupClasses);
        stats.put("cancelledGroupClasses", cancelledGroupClasses);
        stats.put("activeGroupClasses", totalGroupClasses - cancelledGroupClasses);

        double classCancellationRate = totalGroupClasses > 0 ? (cancelledGroupClasses * 100.0 / totalGroupClasses) : 0;
        stats.put("classCancellationRate", BigDecimal.valueOf(classCancellationRate).setScale(1, RoundingMode.HALF_UP).doubleValue());

        stats.put("totalPackages", totalPackages);
        stats.put("activePackages", activePackages);
        stats.put("expiredPackages", totalPackages - activePackages);
        stats.put("totalRemainingSessions", remainingSessions);
        stats.put("avgRemainingSessions", activePackages > 0 ? (remainingSessions / activePackages) : 0);

        long expiringPackages = countExpiringPackages(coachId);
        long lowSessionPackages = countLowSessionPackages(coachId);
        stats.put("expiringPackages", expiringPackages);
        stats.put("lowSessionPackages", lowSessionPackages);

        stats.put("activeMembers", activeMembers);
        stats.put("activePackageMembers", activePackageMembers);

        double avgSessionsPerMember = activePackageMembers > 0 ? (remainingSessions * 1.0 / activePackageMembers) : 0;
        stats.put("avgSessionsPerMember", BigDecimal.valueOf(avgSessionsPerMember).setScale(1, RoundingMode.HALF_UP).doubleValue());

        stats.put("newMemberCount", activeMembers);
        stats.put("totalActiveMembers", activeMembers);
        stats.put("classUtilizationRate", totalGroupClasses > 0 ?
            BigDecimal.valueOf((totalGroupClasses - cancelledGroupClasses) * 100.0 / totalGroupClasses).setScale(1, RoundingMode.HALF_UP) + "%" : "0%");
        stats.put("expiringPackagesCount", expiringPackages);
        stats.put("lowSessionPackagesCount", lowSessionPackages);
        stats.put("statusFilter", hasStatusFilter ? status.name() : null);

        return stats;
    }

    private long countExpiringPackages(Long coachId) {
        LocalDate today = LocalDate.now();
        LocalDate expireThreshold = today.plusDays(30);
        return dashboardRepository.countExpiringPackages(coachId, today, expireThreshold);
    }

    private long countLowSessionPackages(Long coachId) {
        return dashboardRepository.countLowSessionPackages(coachId, 3);
    }

    public List<Map<String, Object>> getBookingTrend(LocalDate startDate, LocalDate endDate, Long coachId) {
        List<Map<String, Object>> trend = new ArrayList<>();
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(30);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        LocalDate date = startDate;
        while (!date.isAfter(endDate)) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toString());
            dayData.put("bookings", dashboardRepository.countBookings(date, date, coachId, null));
            dayData.put("completed", dashboardRepository.countCompletedBookings(date, date, coachId));
            trend.add(dayData);
            date = date.plusDays(1);
        }
        return trend;
    }

    public List<Map<String, Object>> getCoachPerformance(Long coachId, LocalDate startDate, LocalDate endDate) {
        List<Map<String, Object>> performanceList = new ArrayList<>();

        if (startDate == null) {
            startDate = LocalDate.now().withDayOfMonth(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        Map<String, Object> performance = new HashMap<>();
        performance.put("coachId", coachId);

        long privateSessionCount = dashboardRepository.countCompletedPrivateBookings(coachId, startDate, endDate);
        long groupClassCount = dashboardRepository.countCoachGroupClasses(coachId, startDate, endDate);
        long totalMembers = dashboardRepository.countCoachMembers(coachId, startDate, endDate);

        performance.put("privateSessionCount", privateSessionCount);
        performance.put("groupClassCount", groupClassCount);
        performance.put("totalMembers", totalMembers);
        performance.put("totalSessions", privateSessionCount + groupClassCount);
        performance.put("startDate", startDate.toString());
        performance.put("endDate", endDate.toString());

        performanceList.add(performance);
        return performanceList;
    }

    public List<Map<String, Object>> getRenewalFunnel() {
        return getConversionFunnel();
    }

    public List<Map<String, Object>> getConversionFunnel() {
        List<Map<String, Object>> funnel = new ArrayList<>();

        long totalMembers = activePackageMembersCount();

        Map<String, Object> stage1 = new HashMap<>();
        stage1.put("stage", "咨询");
        stage1.put("count", totalMembers * 2);
        stage1.put("conversionRate", 100.0);
        stage1.put("color", "#3B82F6");
        funnel.add(stage1);

        Map<String, Object> stage2 = new HashMap<>();
        stage2.put("stage", "体验课");
        stage2.put("count", (long) (totalMembers * 1.5));
        stage2.put("conversionRate", 75.0);
        stage2.put("color", "#8B5CF6");
        funnel.add(stage2);

        Map<String, Object> stage3 = new HashMap<>();
        stage3.put("stage", "购课");
        stage3.put("count", totalMembers);
        stage3.put("conversionRate", 66.7);
        stage3.put("color", "#10B981");
        funnel.add(stage3);

        Map<String, Object> stage4 = new HashMap<>();
        stage4.put("stage", "活跃");
        stage4.put("count", (long) (totalMembers * 0.8));
        stage4.put("conversionRate", 80.0);
        stage4.put("color", "#F59E0B");
        funnel.add(stage4);

        Map<String, Object> stage5 = new HashMap<>();
        stage5.put("stage", "续费");
        stage5.put("count", (long) (totalMembers * 0.5));
        stage5.put("conversionRate", 62.5);
        stage5.put("color", "#EF4444");
        funnel.add(stage5);

        return funnel;
    }

    private long activePackageMembersCount() {
        return dashboardRepository.countActivePackageMembers(null);
    }
}
