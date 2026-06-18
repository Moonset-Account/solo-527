package com.emailgenerator.repository;

import com.emailgenerator.entity.RiskSample;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RiskSampleRepository extends JpaRepository<RiskSample, Long>, JpaSpecificationExecutor<RiskSample> {

    Page<RiskSample> findByTaskId(Long taskId, Pageable pageable);

    Page<RiskSample> findByReviewStatus(String reviewStatus, Pageable pageable);

    @Query("SELECT r.riskType, COUNT(r) FROM RiskSample r GROUP BY r.riskType")
    List<Object[]> statsByRiskType();

    @Query("SELECT r.legalOwner, COUNT(r), " +
           "SUM(CASE WHEN r.reviewStatus = 'PASSED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN r.reviewStatus = 'REJECTED' THEN 1 ELSE 0 END) " +
           "FROM RiskSample r GROUP BY r.legalOwner")
    List<Object[]> statsByLegalOwner();

    @Query("SELECT DATE(r.createTime), COUNT(r) FROM RiskSample r " +
           "WHERE r.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(r.createTime) ORDER BY DATE(r.createTime)")
    List<Object[]> statsByDateRange(LocalDateTime startTime, LocalDateTime endTime);
}
