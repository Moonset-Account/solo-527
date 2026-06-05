package com.gym.service;

import com.gym.common.enums.BookingStatusEnum;
import com.gym.common.enums.MemberStatusEnum;
import com.gym.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {

    private final MemberRepository memberRepository;
    private final CoachRepository coachRepository;
    private final BookingRepository bookingRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final GroupClassRepository groupClassRepository;

    public DashboardService(MemberRepository memberRepository, CoachRepository coachRepository, BookingRepository bookingRepository,
                            MemberPackageRepository memberPackageRepository, GroupClassRepository groupClassRepository) {
        this.memberRepository = memberRepository;
        this.coachRepository = coachRepository;
        this.bookingRepository = bookingRepository;
        this.memberPackageRepository = memberPackageRepository;
        this.groupClassRepository = groupClassRepository;
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalMembers", memberRepository.count());
        stats.put("activeMembers", memberRepository.countActiveMembers());
        stats.put("frozenMembers", memberRepository.countFrozenMembers());
        stats.put("activeCoaches", coachRepository.findByActiveTrue().size());

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);

        long todayBookings = bookingRepository.countByStartTimeBetween(startOfDay, endOfDay);
        long todayCompleted = bookingRepository.countCompletedByStartTimeBetween(startOfDay, endOfDay);
        long pendingBookings = bookingRepository.countByStatus(BookingStatusEnum.PENDING);
        long confirmedBookings = bookingRepository.countByStatus(BookingStatusEnum.CONFIRMED);

        stats.put("todayBookings", todayBookings);
        stats.put("todayCompleted", todayCompleted);
        stats.put("pendingBookings", pendingBookings);
        stats.put("confirmedBookings", confirmedBookings);

        stats.put("activePackages", memberPackageRepository.countActivePackages());

        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = today.withDayOfMonth(today.lengthOfMonth()).atTime(23, 59, 59);

        Map<String, Object> coachPerformance = new HashMap<>();
        coachRepository.findByActiveTrue().forEach(coach -> {
            long sessions = bookingRepository.countCompletedSessionsByCoach(
                    coach.getId(), startOfMonth, endOfMonth);
            coachPerformance.put(coach.getName(), sessions);
        });
        stats.put("coachPerformance", coachPerformance);

        stats.put("membersLowOnSessions", memberRepository.findMembersLowOnSessions(3));
        stats.put("expiringMembers", memberRepository.findMembersLowOnSessions(0));

        stats.put("overdueBookings", bookingRepository.findOverdueBookings(LocalDateTime.now()));

        Map<String, Object> renewalFunnel = new HashMap<>();
        renewalFunnel.put("totalMembers", memberRepository.count());
        renewalFunnel.put("activeMembers", memberRepository.countActiveMembers());
        renewalFunnel.put("lowSessionMembers", memberRepository.findMembersLowOnSessions(3).size());
        renewalFunnel.put("zeroSessionMembers", memberRepository.findMembersLowOnSessions(0).size());
        renewalFunnel.put("expiredMembers", memberRepository.countExpiredMembers());
        stats.put("renewalFunnel", renewalFunnel);

        Map<String, Object> resourceStatus = new HashMap<>();
        resourceStatus.put("activeCoaches", coachRepository.findByActiveTrue().size());
        resourceStatus.put("totalCoaches", coachRepository.count());
        resourceStatus.put("availableCoachesNow", coachRepository.findByActiveTrue().size() - 
            bookingRepository.findByStatusAndStartTimeBefore(BookingStatusEnum.CONFIRMED, LocalDateTime.now()).size());
        resourceStatus.put("activeGroupClasses", groupClassRepository.findByCancelledFalse().size());
        resourceStatus.put("totalGroupClasses", groupClassRepository.findAll().size());
        stats.put("resourceStatus", resourceStatus);

        return stats;
    }
}
