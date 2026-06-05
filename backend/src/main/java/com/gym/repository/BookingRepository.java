package com.gym.repository;

import com.gym.common.enums.BookingStatusEnum;
import com.gym.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByMemberIdOrderByStartTimeDesc(Long memberId);

    List<Booking> findByCoachIdAndStartTimeBetweenOrderByStartTime(Long coachId, LocalDateTime start, LocalDateTime end);

    List<Booking> findByStatusAndStartTimeBefore(BookingStatusEnum status, LocalDateTime time);

    @Query("SELECT b FROM Booking b WHERE b.member.id = :memberId AND b.startTime BETWEEN :start AND :end")
    List<Booking> findMemberBookingsInRange(@Param("memberId") Long memberId,
                                            @Param("start") LocalDateTime start,
                                            @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.coach.id = :coachId AND b.status = 'COMPLETED' " +
           "AND b.startTime BETWEEN :start AND :end")
    long countCompletedSessionsByCoach(@Param("coachId") Long coachId,
                                       @Param("start") LocalDateTime start,
                                       @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = :status")
    long countByStatus(@Param("status") BookingStatusEnum status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.startTime BETWEEN :start AND :end")
    long countByStartTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'COMPLETED' AND b.startTime BETWEEN :start AND :end")
    long countCompletedByStartTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT b FROM Booking b WHERE b.status = 'CONFIRMED' AND b.startTime < :now")
    List<Booking> findOverdueBookings(@Param("now") LocalDateTime now);
}
