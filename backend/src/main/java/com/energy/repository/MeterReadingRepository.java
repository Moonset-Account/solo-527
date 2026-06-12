package com.energy.repository;

import com.energy.entity.MeterReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MeterReadingRepository extends JpaRepository<MeterReading, Long> {
    List<MeterReading> findByMeterIdAndReadingTimeBetweenOrderByReadingTime(
            Long meterId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT mr FROM MeterReading mr JOIN Meter m ON mr.meterId = m.id " +
           "WHERE m.area = :area AND mr.readingTime BETWEEN :start AND :end " +
           "ORDER BY mr.readingTime")
    List<MeterReading> findByAreaAndTimeBetween(
            @Param("area") String area,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT m.area, MAX(mr.activePower) FROM MeterReading mr " +
           "JOIN Meter m ON mr.meterId = m.id " +
           "WHERE mr.readingTime BETWEEN :start AND :end " +
           "AND (:area IS NULL OR m.area = :area) " +
           "GROUP BY m.area")
    List<Object[]> findPeakPowerByAreaAndTimeBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("area") String area);

    @Query("SELECT mr FROM MeterReading mr WHERE mr.isValid = false " +
           "AND mr.readingTime BETWEEN :start AND :end ORDER BY mr.readingTime DESC")
    List<MeterReading> findInvalidReadings(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT mr FROM MeterReading mr JOIN Meter m ON mr.meterId = m.id " +
           "WHERE mr.isValid = false AND m.area = :area " +
           "AND mr.readingTime BETWEEN :start AND :end ORDER BY mr.readingTime DESC")
    List<MeterReading> findInvalidReadingsByArea(
            @Param("area") String area,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
