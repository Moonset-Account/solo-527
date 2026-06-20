package com.carcore.admin.repository;

import com.carcore.admin.entity.EfficiencyReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface EfficiencyReportRepository extends JpaRepository<EfficiencyReport, Long> {

    Optional<EfficiencyReport> findByReportNo(String reportNo);

    Optional<EfficiencyReport> findByReportTypeAndReportDate(String reportType, LocalDate reportDate);

    @Query("SELECT e FROM EfficiencyReport e WHERE " +
           "(:reportNo IS NULL OR :reportNo = '' OR e.reportNo LIKE %:reportNo%) " +
           "AND (:reportType IS NULL OR :reportType = '' OR e.reportType = :reportType) " +
           "AND (:startDate IS NULL OR e.reportDate >= :startDate) " +
           "AND (:endDate IS NULL OR e.reportDate <= :endDate)")
    Page<EfficiencyReport> findByConditions(@Param("reportNo") String reportNo,
                                            @Param("reportType") String reportType,
                                            @Param("startDate") LocalDate startDate,
                                            @Param("endDate") LocalDate endDate,
                                            Pageable pageable);
}
