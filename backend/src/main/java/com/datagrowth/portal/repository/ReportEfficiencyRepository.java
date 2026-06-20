package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.ReportEfficiency;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReportEfficiencyRepository extends JpaRepository<ReportEfficiency, Long> {
    Page<ReportEfficiency> findByStatDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    @Query("SELECT r FROM ReportEfficiency r WHERE r.statDate BETWEEN :startDate AND :endDate ORDER BY r.statDate DESC, r.avgGenerationTimeMs DESC")
    List<ReportEfficiency> findByDateRangeOrderByTime(
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate
    );
    
    @Query("SELECT r.reportName, AVG(r.avgGenerationTimeMs) as avgTime, SUM(r.generationCount) as totalCount " +
           "FROM ReportEfficiency r WHERE r.statDate BETWEEN :startDate AND :endDate " +
           "GROUP BY r.reportCode, r.reportName ORDER BY avgTime DESC")
    List<Object[]> findSummaryByDateRange(
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate
    );
}
