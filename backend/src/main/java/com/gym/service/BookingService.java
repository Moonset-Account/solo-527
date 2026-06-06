package com.gym.service;

import com.gym.common.BusinessException;
import com.gym.entity.Booking;
import com.gym.entity.GroupClass;
import com.gym.entity.MemberPackage;
import com.gym.enums.BookingStatus;
import com.gym.enums.BookingType;
import com.gym.repository.BookingRepository;
import com.gym.repository.GroupClassRepository;
import com.gym.repository.MemberPackageRepository;
import com.gym.validation.BookingValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final GroupClassRepository groupClassRepository;
    private final BookingValidator bookingValidator;
    private final AuditLogService auditLogService;

    @Transactional
    public Booking createBooking(Booking booking) {
        bookingValidator.validateBooking(booking);

        booking.setBookingNo("BK" + UUID.randomUUID().toString().replace("-", "").substring(0, 14).toUpperCase());
        booking.setStatus(BookingStatus.BOOKED);

        if (booking.getBookingType() == BookingType.GROUP && booking.getGroupClassId() != null) {
            GroupClass groupClass = groupClassRepository.findById(booking.getGroupClassId())
                    .orElseThrow(() -> new BusinessException("团课不存在"));
            if (groupClass.getRegisteredCount() >= groupClass.getCapacity()) {
                throw new BusinessException("团课名额已满");
            }
            groupClass.setRegisteredCount(groupClass.getRegisteredCount() + 1);
            groupClassRepository.save(groupClass);
        }

        Booking saved = bookingRepository.save(booking);
        auditLogService.log("CREATE", "BOOKING", saved.getId(), "BOOKING", null, saved);
        return saved;
    }

    @Transactional
    public Booking cancelBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BusinessException("预约不存在"));

        bookingValidator.validateCancelBooking(booking);

        Booking oldBooking = new Booking();
        oldBooking.setStatus(booking.getStatus());

        booking.setStatus(BookingStatus.CANCELLED);

        if (booking.getBookingType() == BookingType.GROUP && booking.getGroupClassId() != null) {
            GroupClass groupClass = groupClassRepository.findById(booking.getGroupClassId()).orElse(null);
            if (groupClass != null && groupClass.getRegisteredCount() > 0) {
                groupClass.setRegisteredCount(groupClass.getRegisteredCount() - 1);
                groupClassRepository.save(groupClass);
            }
        }

        Booking saved = bookingRepository.save(booking);
        auditLogService.log("CANCEL", "BOOKING", id, "BOOKING", oldBooking, saved);
        return saved;
    }

    @Transactional
    public Booking checkIn(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BusinessException("预约不存在"));

        bookingValidator.validateCheckIn(booking);

        Booking oldBooking = new Booking();
        oldBooking.setStatus(booking.getStatus());

        booking.setStatus(BookingStatus.CHECKED_IN);
        booking.setCheckInTime(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        auditLogService.log("CHECK_IN", "BOOKING", id, "BOOKING", oldBooking, saved);
        return saved;
    }

    @Transactional
    public Booking completeBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BusinessException("预约不存在"));

        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new BusinessException("当前状态无法完成");
        }

        Booking oldBooking = new Booking();
        oldBooking.setStatus(booking.getStatus());

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCheckOutTime(LocalDateTime.now());

        if (booking.getMemberPackageId() != null) {
            deductSession(booking.getMemberPackageId());
        }

        Booking saved = bookingRepository.save(booking);
        auditLogService.log("COMPLETE", "BOOKING", id, "BOOKING", oldBooking, saved);
        return saved;
    }

    @Transactional
    public void deductSession(Long memberPackageId) {
        MemberPackage memberPackage = memberPackageRepository.findById(memberPackageId)
                .orElseThrow(() -> new BusinessException("课包不存在"));

        if (memberPackage.getRemainingSessions() <= 0) {
            throw new BusinessException("课包课时不足");
        }

        memberPackage.setRemainingSessions(memberPackage.getRemainingSessions() - 1);
        memberPackage.setUsedSessions(memberPackage.getUsedSessions() + 1);

        if (memberPackage.getRemainingSessions() == 0) {
            memberPackage.setStatus("EXPIRED");
        }

        memberPackageRepository.save(memberPackage);
        auditLogService.log("DEDUCT_SESSION", "PACKAGE", memberPackageId, "MEMBER_PACKAGE", null, memberPackage);
    }

    public List<Booking> getBookings(Long memberId, Long coachId, LocalDate startDate, LocalDate endDate, BookingStatus status) {
        if (startDate != null && endDate != null) {
            return bookingRepository.findByDateRange(startDate, endDate);
        }
        if (memberId != null) {
            return bookingRepository.findByMemberId(memberId);
        }
        if (coachId != null) {
            return bookingRepository.findByCoachId(coachId);
        }
        if (status != null) {
            return bookingRepository.findByStatus(status);
        }
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new BusinessException("预约不存在"));
    }

    public List<Booking> getCoachBookingsOnDate(Long coachId, LocalDate date) {
        return bookingRepository.findCoachBookingsOnDate(coachId, date);
    }
}
