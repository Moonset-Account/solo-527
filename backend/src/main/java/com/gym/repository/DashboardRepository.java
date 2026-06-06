package com.gym.repository;

import com.gym.entity.Booking;
import com.gym.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface DashboardRepository extends JpaRepository<Booking, Long> {

    @Query("SELECT COUNT(b) FROM Booking b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:startDate IS NULL OR b.bookingDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.bookingDate <= :endDate) AND " +
           "(:coachId IS NULL OR b.coachId = :coachId)")
    long countBookings(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("coachId") Long coachId,
            @Param("status") BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'COMPLETED' AND " +
           "(:startDate IS NULL OR b.bookingDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.bookingDate <= :endDate) AND " +
           "(:coachId IS NULL OR b.coachId = :coachId)")
    long countCompletedBookings(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("coachId") Long coachId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'CANCELLED' AND " +
           "(:startDate IS NULL OR b.bookingDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.bookingDate <= :endDate) AND " +
           "(:coachId IS NULL OR b.coachId = :coachId)")
    long countCancelledBookings(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("coachId") Long coachId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingType = 'PRIVATE' AND " +
           "(:startDate IS NULL OR b.bookingDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.bookingDate <= :endDate) AND " +
           "(:coachId IS NULL OR b.coachId = :coachId)")
    long countPrivateBookings(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("coachId") Long coachId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingType = 'GROUP' AND " +
           "(:startDate IS NULL OR b.bookingDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.bookingDate <= :endDate) AND " +
           "(:coachId IS NULL OR b.coachId = :coachId)")
    long countGroupBookings(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("coachId") Long coachId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingType = :type AND " +
           "b.status = :status AND " +
           "(:startDate IS NULL OR b.bookingDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.bookingDate <= :endDate) AND " +
           "(:coachId IS NULL OR b.coachId = :coachId)")
    long countBookingsByTypeAndStatus(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("coachId") Long coachId,
            @Param("status") BookingStatus status,
            @Param("type") String type);

    @Query("SELECT COUNT(g) FROM GroupClass g WHERE " +
           "(:startDate IS NULL OR g.classDate >= :startDate) AND " +
           "(:endDate IS NULL OR g.classDate <= :endDate) AND " +
           "(:coachId IS NULL OR g.coachId = :coachId)")
    long countGroupClasses(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("coachId") Long coachId);

    @Query("SELECT COUNT(g) FROM GroupClass g WHERE g.status = 'CANCELLED' AND " +
           "(:startDate IS NULL OR g.classDate >= :startDate) AND " +
           "(:endDate IS NULL OR g.classDate <= :endDate) AND " +
           "(:coachId IS NULL OR g.coachId = :coachId)")
    long countCancelledGroupClasses(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("coachId") Long coachId);

    @Query("SELECT COUNT(p) FROM MemberPackage p WHERE " +
           "(:coachId IS NULL OR p.coachId = :coachId)")
    long countMemberPackages(@Param("coachId") Long coachId);

    @Query("SELECT COUNT(p) FROM MemberPackage p WHERE p.status = 'ACTIVE' AND " +
           "(:coachId IS NULL OR p.coachId = :coachId)")
    long countActivePackages(@Param("coachId") Long coachId);

    @Query("SELECT COALESCE(SUM(p.remainingSessions), 0) FROM MemberPackage p WHERE p.status = 'ACTIVE' AND " +
           "(:coachId IS NULL OR p.coachId = :coachId)")
    long sumRemainingSessions(@Param("coachId") Long coachId);

    @Query("SELECT COUNT(DISTINCT b.memberId) FROM Booking b WHERE " +
           "(:startDate IS NULL OR b.bookingDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.bookingDate <= :endDate) AND " +
           "(:coachId IS NULL OR b.coachId = :coachId)")
    long countActiveMembers(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("coachId") Long coachId);

    @Query("SELECT COUNT(DISTINCT p.memberId) FROM MemberPackage p WHERE p.status = 'ACTIVE' AND " +
           "(:coachId IS NULL OR p.coachId = :coachId)")
    long countActivePackageMembers(@Param("coachId") Long coachId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.bookingType = 'PRIVATE' AND b.status = 'COMPLETED' AND " +
           "b.coachId = :coachId AND " +
           "(:startDate IS NULL OR b.bookingDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.bookingDate <= :endDate)")
    long countCompletedPrivateBookings(
            @Param("coachId") Long coachId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(g) FROM GroupClass g WHERE g.coachId = :coachId AND g.status != 'CANCELLED' AND " +
           "(:startDate IS NULL OR g.classDate >= :startDate) AND " +
           "(:endDate IS NULL OR g.classDate <= :endDate)")
    long countCoachGroupClasses(
            @Param("coachId") Long coachId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(DISTINCT b.memberId) FROM Booking b WHERE b.coachId = :coachId AND " +
           "(:startDate IS NULL OR b.bookingDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.bookingDate <= :endDate)")
    long countCoachMembers(
            @Param("coachId") Long coachId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(p) FROM MemberPackage p WHERE p.status = 'ACTIVE' AND " +
           "(:coachId IS NULL OR p.coachId = :coachId) AND " +
           "p.expireDate BETWEEN :today AND :threshold")
    long countExpiringPackages(
            @Param("coachId") Long coachId,
            @Param("today") LocalDate today,
            @Param("threshold") LocalDate threshold);

    @Query("SELECT COUNT(p) FROM MemberPackage p WHERE p.status = 'ACTIVE' AND " +
           "(:coachId IS NULL OR p.coachId = :coachId) AND " +
           "p.remainingSessions <= :threshold")
    long countLowSessionPackages(
            @Param("coachId") Long coachId,
            @Param("threshold") Integer threshold);
}
