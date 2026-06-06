package com.gym.service;

import com.gym.entity.*;
import com.gym.enums.BookingStatus;
import com.gym.enums.BookingType;
import com.gym.repository.*;
import com.gym.validation.CoachPermissionValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MemberRepository memberRepository;
    private final BookingRepository bookingRepository;
    private final GroupClassRepository groupClassRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final CoachRepository coachRepository;
    private final CoachPermissionValidator coachPermissionValidator;

    public Map<String, Object> getDashboardStats(LocalDate startDate, LocalDate endDate, Long coachId) {
        if (coachPermissionValidator.isCoachRole()) {
            Long currentCoachId = coachPermissionValidator.getCurrentCoachId();
            coachId = currentCoachId;
        }

        Map<String, Object> stats = new HashMap<>();

        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<Member> newMembers = memberRepository.findByCreatedAtBetween(start, end.plusDays(1));
        stats.put("newMemberCount", newMembers.size());
        stats.put("totalActiveMembers", memberRepository.countActiveMembers());

        List<Booking> bookings;
        if (coachId != null) {
            bookings = bookingRepository.findCoachBookingsOnDate(coachId, LocalDate.now());
            stats.put("coachId", coachId);
        } else {
            bookings = bookingRepository.findByDateRange(start, end);
        }

        long completedCount = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .count();
        long bookedCount = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.BOOKED)
                .count();
        long cancelledCount = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                .count();

        stats.put("totalBookings", bookings.size());
        stats.put("completedBookings", completedCount);
        stats.put("pendingBookings", bookedCount);
        stats.put("cancelledBookings", cancelledCount);

        long privateCount = bookings.stream()
                .filter(b -> b.getBookingType() == BookingType.PRIVATE)
                .count();
        long groupCount = bookings.stream()
                .filter(b -> b.getBookingType() == BookingType.GROUP)
                .count();
        stats.put("privateBookings", privateCount);
        stats.put("groupBookings", groupCount);

        List<GroupClass> classes = groupClassRepository.findByDateRange(start, end);
        stats.put("totalGroupClasses", classes.size());

        int totalCapacity = classes.stream().mapToInt(GroupClass::getCapacity).sum();
        int totalRegistered = classes.stream().mapToInt(GroupClass::getRegisteredCount).sum();
        double utilizationRate = totalCapacity > 0 ? (double) totalRegistered / totalCapacity * 100 : 0;
        stats.put("classUtilizationRate", String.format("%.2f", utilizationRate) + "%");

        List<MemberPackage> expiringPackages = memberPackageRepository.findExpiringPackages(LocalDate.now(), LocalDate.now().plusDays(30));
        stats.put("expiringPackagesCount", expiringPackages.size());

        List<MemberPackage> lowSessionPackages = memberPackageRepository.findAll().stream()
                .filter(p -> "ACTIVE".equals(p.getStatus()) && p.getRemainingSessions() <= 3)
                .toList();
        stats.put("lowSessionPackagesCount", lowSessionPackages.size());

        stats.put("dateRange", Map.of("start", start, "end", end));
        stats.put("generatedAt", new Date());

        return stats;
    }

    public Map<String, Object> getCoachPerformance(Long coachId, LocalDate startDate, LocalDate endDate) {
        coachPermissionValidator.validateViewCoachRevenue(coachId);

        LocalDate start = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        Map<String, Object> performance = new HashMap<>();

        List<Booking> bookings = bookingRepository.findByDateRange(start, end).stream()
                .filter(b -> coachId.equals(b.getCoachId()))
                .toList();

        long completedPrivate = bookings.stream()
                .filter(b -> b.getBookingType() == BookingType.PRIVATE && b.getStatus() == BookingStatus.COMPLETED)
                .count();

        List<GroupClass> groupClasses = groupClassRepository.findCoachClassesInRange(coachId, start, end);
        long completedGroup = groupClasses.stream()
                .filter(c -> "COMPLETED".equals(c.getStatus()))
                .count();

        List<MemberPackage> packages = memberPackageRepository.findActivePackagesByCoachId(coachId);
        long totalMembers = packages.stream().map(MemberPackage::getMemberId).distinct().count();

        performance.put("coachId", coachId);
        performance.put("privateSessionCount", completedPrivate);
        performance.put("groupClassCount", completedGroup);
        performance.put("totalMembers", totalMembers);
        performance.put("dateRange", Map.of("start", start, "end", end));

        return performance;
    }

    public List<Map<String, Object>> getRenewalFunnel() {
        List<Map<String, Object>> funnel = new ArrayList<>();

        List<MemberPackage> allPackages = memberPackageRepository.findAll();
        long total = allPackages.size();

        long activeCount = allPackages.stream().filter(p -> "ACTIVE".equals(p.getStatus())).count();
        long expiringIn30Days = allPackages.stream()
                .filter(p -> "ACTIVE".equals(p.getStatus()) && p.getExpireDate() != null
                        && !p.getExpireDate().isBefore(LocalDate.now())
                        && p.getExpireDate().isBefore(LocalDate.now().plusDays(30)))
                .count();
        long lowSessions = allPackages.stream()
                .filter(p -> "ACTIVE".equals(p.getStatus()) && p.getRemainingSessions() <= 3)
                .count();
        long expiredCount = allPackages.stream().filter(p -> "EXPIRED".equals(p.getStatus())).count();

        funnel.add(Map.of("stage", "总课包数", "count", total, "color", "#3B82F6"));
        funnel.add(Map.of("stage", "活跃课包", "count", activeCount, "color", "#10B981"));
        funnel.add(Map.of("stage", "30天内到期", "count", expiringIn30Days, "color", "#F59E0B"));
        funnel.add(Map.of("stage", "剩余≤3课时", "count", lowSessions, "color", "#EF4444"));
        funnel.add(Map.of("stage", "已过期", "count", expiredCount, "color", "#6B7280"));

        return funnel;
    }
}
