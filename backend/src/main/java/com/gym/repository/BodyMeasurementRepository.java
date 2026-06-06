package com.gym.repository;

import com.gym.entity.BodyMeasurement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BodyMeasurementRepository extends JpaRepository<BodyMeasurement, Long> {
    List<BodyMeasurement> findByMemberIdOrderByMeasureDateDesc(Long memberId);

    @Query("SELECT bm FROM BodyMeasurement bm WHERE bm.memberId = :memberId AND bm.measureDate BETWEEN :startDate AND :endDate ORDER BY bm.measureDate")
    List<BodyMeasurement> findByMemberIdAndDateRange(@Param("memberId") Long memberId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
