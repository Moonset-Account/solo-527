package com.gym.repository;

import com.gym.entity.Booking;
import com.gym.enums.BookingStatus;
import com.gym.enums.BookingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByMemberId(Long memberId);
    List<Booking> findByCoachId(Long coachId);
    List<Booking> findByGroupClassId(Long groupClassId);
    List<Booking> findByBookingType(BookingType bookingType);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByBookingDate(LocalDate bookingDate);

    @Query("SELECT b FROM Booking b WHERE b.bookingDate BETWEEN :startDate AND :endDate")
    List<Booking> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT b FROM Booking b WHERE b.coachId = :coachId AND b.bookingDate = :date AND b.status != 'CANCELLED'")
    List<Booking> findCoachBookingsOnDate(@Param("coachId") Long coachId, @Param("date") LocalDate date);

    @Query("SELECT b FROM Booking b WHERE b.memberId = :memberId AND b.bookingDate BETWEEN :startDate AND :endDate")
    List<Booking> findMemberBookingsInRange(@Param("memberId") Long memberId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.coachId = :coachId AND b.bookingDate BETWEEN :startDate AND :endDate AND b.status = 'COMPLETED'")
    long countCompletedBookingsByCoachAndDateRange(@Param("coachId") Long coachId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    boolean existsByMemberIdAndBookingDateAndStatusNot(Long memberId, LocalDate bookingDate, BookingStatus status);
}
