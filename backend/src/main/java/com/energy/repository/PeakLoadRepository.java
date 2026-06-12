package com.energy.repository;

import com.energy.entity.PeakLoad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PeakLoadRepository extends JpaRepository<PeakLoad, Long> {
    List<PeakLoad> findByAreaOrderByPeakTimeDesc(String area);

    @Query("SELECT p FROM PeakLoad p WHERE p.peakTime BETWEEN :start AND :end " +
           "AND (:area IS NULL OR p.area = :area) ORDER BY p.peakValue DESC")
    List<PeakLoad> findByFilters(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("area") String area);

    @Query("SELECT p FROM PeakLoad p WHERE p.strategyFailure = true " +
           "ORDER BY p.peakTime DESC")
    List<PeakLoad> findFailedPeaks();
}
