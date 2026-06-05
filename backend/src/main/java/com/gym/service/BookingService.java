package com.gym.service;

import com.gym.common.enums.BookingStatusEnum;
import com.gym.common.enums.CourseTypeEnum;
import com.gym.common.enums.MemberStatusEnum;
import com.gym.entity.*;
import com.gym.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final MemberRepository memberRepository;
    private final CoachRepository coachRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final GroupClassRepository groupClassRepository;
    private final MemberFreezeRepository memberFreezeRepository;
    private final NotificationService notificationService;

    @Transactional
    public Booking createBooking(Long memberId, Long coachId, Long memberPackageId, Long groupClassId,
                                 LocalDateTime startTime, LocalDateTime endTime, CourseTypeEnum courseType) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("会员不存在"));

        if (member.getStatus() == MemberStatusEnum.FROZEN) {
            throw new RuntimeException("会员处于冻结状态，无法预约课程");
        }

        if (member.getStatus() == MemberStatusEnum.EXPIRED || member.getStatus() == MemberStatusEnum.CANCELLED) {
            throw new RuntimeException("会员状态异常，无法预约课程");
        }

        LocalDate today = LocalDate.now();
        List<MemberFreeze> activeFreezes = memberFreezeRepository.findActiveFreezesForMemberAndDate(memberId, today);
        if (!activeFreezes.isEmpty()) {
            throw new RuntimeException("会员处于冻结期内，无法预约课程");
        }

        Coach coach = coachRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("教练不存在"));

        if (!coach.getActive()) {
            throw new RuntimeException("该教练已离职");
        }

        Booking booking = new Booking();
        booking.setMember(member);
        booking.setCoach(coach);
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setCourseType(courseType);
        booking.setStatus(BookingStatusEnum.CONFIRMED);

        if (courseType == CourseTypeEnum.PERSONAL) {
            MemberPackage memberPackage = memberPackageRepository.findById(memberPackageId)
                    .orElseThrow(() -> new RuntimeException("课包不存在"));
            if (memberPackage.getRemainingSessions() <= 0) {
                throw new RuntimeException("课包课时不足");
            }
            if (!memberPackage.getMember().getId().equals(memberId)) {
                throw new RuntimeException("课包不属于该会员");
            }
            booking.setMemberPackage(memberPackage);
        } else if (courseType == CourseTypeEnum.GROUP && groupClassId != null) {
            GroupClass groupClass = groupClassRepository.findById(groupClassId)
                    .orElseThrow(() -> new RuntimeException("团课不存在"));
            if (groupClass.getCancelled()) {
                throw new RuntimeException("团课已取消");
            }
            if (groupClass.getBookedCount() >= groupClass.getMaxCapacity()) {
                throw new RuntimeException("团课名额已满");
            }
            groupClass.setBookedCount(groupClass.getBookedCount() + 1);
            groupClassRepository.save(groupClass);
            booking.setGroupClass(groupClass);
        }

        Booking savedBooking = bookingRepository.save(booking);

        notificationService.createNotification("BOOKING", "预约成功",
                "您已成功预约" + startTime.toLocalDate() + "的课程",
                memberId, "MEMBER", "BOOKING", savedBooking.getId());

        return savedBooking;
    }

    @Transactional
    public Booking completeBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));

        if (booking.getStatus() == BookingStatusEnum.COMPLETED) {
            return booking;
        }

        booking.setStatus(BookingStatusEnum.COMPLETED);
        booking.setCheckInTime(LocalDateTime.now());

        if (!booking.getDeducted() && booking.getMemberPackage() != null) {
            MemberPackage memberPackage = booking.getMemberPackage();
            memberPackage.setUsedSessions(memberPackage.getUsedSessions() + 1);
            memberPackage.setRemainingSessions(memberPackage.getRemainingSessions() - 1);
            memberPackageRepository.save(memberPackage);
            booking.setDeducted(true);

            Member member = booking.getMember();
            member.setTotalRemainingSessions(member.getTotalRemainingSessions() - 1);
            memberRepository.save(member);
        }

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking cancelBooking(Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("预约不存在"));

        if (booking.getStatus() == BookingStatusEnum.COMPLETED || booking.getStatus() == BookingStatusEnum.CANCELLED) {
            throw new RuntimeException("该预约无法取消");
        }

        booking.setStatus(BookingStatusEnum.CANCELLED);

        if (booking.getGroupClass() != null) {
            GroupClass groupClass = booking.getGroupClass();
            groupClass.setBookedCount(Math.max(0, groupClass.getBookedCount() - 1));
            groupClassRepository.save(groupClass);
        }

        return bookingRepository.save(booking);
    }

    public List<Booking> getMemberBookings(Long memberId) {
        return bookingRepository.findByMemberIdOrderByStartTimeDesc(memberId);
    }

    public List<Booking> getCoachBookings(Long coachId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(23, 59, 59);
        return bookingRepository.findByCoachIdAndStartTimeBetweenOrderByStartTime(coachId, start, end);
    }
}
