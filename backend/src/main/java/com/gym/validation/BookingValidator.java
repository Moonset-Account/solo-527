package com.gym.validation;

import com.gym.common.BusinessException;
import com.gym.entity.Booking;
import com.gym.entity.Member;
import com.gym.entity.MemberPackage;
import com.gym.enums.BookingStatus;
import com.gym.repository.MemberFreezeRepository;
import com.gym.repository.MemberPackageRepository;
import com.gym.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BookingValidator {

    private final MemberFreezeRepository memberFreezeRepository;
    private final MemberPackageRepository memberPackageRepository;
    private final MemberRepository memberRepository;

    public void validateBooking(Booking booking) {
        validateMemberNotFrozen(booking.getMemberId(), booking.getBookingDate());
        validatePackageHasSessions(booking.getMemberPackageId());
        validateMemberStatus(booking.getMemberId());
    }

    public void validateMemberNotFrozen(Long memberId, LocalDate date) {
        boolean isFrozen = memberFreezeRepository.isMemberFrozenOnDate(memberId, date);
        if (isFrozen) {
            throw new BusinessException("会员在预约日期处于冻结状态，无法预约课程");
        }
    }

    public void validatePackageHasSessions(Long memberPackageId) {
        if (memberPackageId == null) {
            return;
        }
        MemberPackage memberPackage = memberPackageRepository.findById(memberPackageId)
                .orElseThrow(() -> new BusinessException("课包不存在"));

        if (memberPackage.getRemainingSessions() <= 0) {
            throw new BusinessException("课包剩余课时不足");
        }

        if (!"ACTIVE".equals(memberPackage.getStatus())) {
            throw new BusinessException("课包状态异常，无法使用");
        }

        if (memberPackage.getExpireDate() != null && memberPackage.getExpireDate().isBefore(LocalDate.now())) {
            throw new BusinessException("课包已过期");
        }
    }

    public void validateMemberStatus(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException("会员不存在"));

        if (!"ACTIVE".equals(member.getStatus())) {
            throw new BusinessException("会员状态异常，无法预约");
        }
    }

    public void validateCancelBooking(Booking booking) {
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BusinessException("预约已取消，无需重复取消");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new BusinessException("预约已完成，无法取消");
        }
    }

    public void validateCheckIn(Booking booking) {
        if (booking.getStatus() != BookingStatus.BOOKED) {
            throw new BusinessException("当前预约状态无法签到");
        }
    }
}
