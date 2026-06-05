package com.gym.task;

import com.gym.common.enums.BookingStatusEnum;
import com.gym.common.enums.MemberStatusEnum;
import com.gym.entity.Booking;
import com.gym.entity.MemberFreeze;
import com.gym.repository.BookingRepository;
import com.gym.repository.MemberFreezeRepository;
import com.gym.repository.MemberRepository;
import com.gym.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class ScheduledTasks {

    private final BookingRepository bookingRepository;
    private final MemberRepository memberRepository;
    private final MemberFreezeRepository memberFreezeRepository;
    private final NotificationService notificationService;

    public ScheduledTasks(BookingRepository bookingRepository, MemberRepository memberRepository,
                          MemberFreezeRepository memberFreezeRepository, NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.memberRepository = memberRepository;
        this.memberFreezeRepository = memberFreezeRepository;
        this.notificationService = notificationService;
    }

    @Value("${app.reminder.before-hours:2}")
    private int reminderBeforeHours;

    @Scheduled(cron = "0 0 * * * ?")
    public void sendBookingReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderTime = now.plusHours(reminderBeforeHours);

        List<Booking> upcomingBookings = bookingRepository
                .findByStatusAndStartTimeBefore(BookingStatusEnum.CONFIRMED, reminderTime);

        for (Booking booking : upcomingBookings) {
            if (booking.getStartTime().isAfter(now)) {
                notificationService.createNotification(
                        "REMINDER",
                        "课程提醒",
                        "您预约的课程将在" + reminderBeforeHours + "小时后开始，请准时到达",
                        booking.getMember().getId(),
                        "MEMBER",
                        "BOOKING",
                        booking.getId()
                );
            }
        }
    }

    @Scheduled(cron = "0 0 2 * * ?")
    public void updateExpiredMembers() {
        LocalDate today = LocalDate.now();
        memberRepository.findAll().forEach(member -> {
            if (member.getExpireDate() != null && member.getExpireDate().isBefore(today)
                    && member.getStatus() == MemberStatusEnum.ACTIVE) {
                member.setStatus(MemberStatusEnum.EXPIRED);
                memberRepository.save(member);
            }
        });
    }

    @Scheduled(cron = "0 30 2 * * ?")
    public void markAbsentBookings() {
        LocalDateTime yesterdayEnd = LocalDate.now().atStartOfDay();
        List<Booking> bookings = bookingRepository
                .findByStatusAndStartTimeBefore(BookingStatusEnum.CONFIRMED, yesterdayEnd);

        for (Booking booking : bookings) {
            booking.setStatus(BookingStatusEnum.ABSENT);
            bookingRepository.save(booking);
        }
    }

    @Scheduled(cron = "0 0 3 * * ?")
    public void updateFreezeStatus() {
        LocalDate today = LocalDate.now();
        List<MemberFreeze> freezes = memberFreezeRepository.findAll();
        for (MemberFreeze freeze : freezes) {
            if (freeze.getActive() && freeze.getEndDate().isBefore(today)) {
                freeze.setActive(false);
                memberFreezeRepository.save(freeze);
            }
        }
    }
}
