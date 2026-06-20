package com.datagrowth.portal.repository;

import com.datagrowth.portal.entity.AnomalyRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnomalyRecordRepository extends JpaRepository<AnomalyRecord, Long> {
    Page<AnomalyRecord> findBySeverityIn(List<String> severities, Pageable pageable);
    Page<AnomalyRecord> findByStatusIn(List<String> statuses, Pageable pageable);
    Page<AnomalyRecord> findByMetricNameContaining(String metricName, Pageable pageable);
    
    @Query("SELECT a FROM AnomalyRecord a WHERE a.anomalyTime BETWEEN :startTime AND :endTime")
    Page<AnomalyRecord> findByAnomalyTimeBetween(
        @Param("startTime") LocalDateTime startTime, 
        @Param("endTime") LocalDateTime endTime, 
        Pageable pageable
    );
    
    @Query("SELECT a.severity, COUNT(a) FROM AnomalyRecord a WHERE a.status != 'RESOLVED' GROUP BY a.severity")
    List<Object[]> countBySeverityAndUnresolved();
    
    @Query("SELECT COUNT(a) FROM AnomalyRecord a WHERE a.status = :status")
    long countByStatus(@Param("status") String status);
}
