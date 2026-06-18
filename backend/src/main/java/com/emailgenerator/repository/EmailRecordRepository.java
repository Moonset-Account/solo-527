package com.emailgenerator.repository;

import com.emailgenerator.entity.EmailRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EmailRecordRepository extends JpaRepository<EmailRecord, Long>, JpaSpecificationExecutor<EmailRecord> {

    Page<EmailRecord> findByTaskId(Long taskId, Pageable pageable);

    List<EmailRecord> findByTaskIdAndStatus(Long taskId, String status);

    Long countByTaskId(Long taskId);

    Long countByTaskIdAndStatus(Long taskId, String status);

    Long countByTaskIdAndIsRiskTrue(Long taskId);

    @Query("SELECT r.legalOwner, COUNT(r), " +
           "SUM(CASE WHEN r.status = 'SUCCESS' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN r.status = 'FAILED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN r.isRisk = true THEN 1 ELSE 0 END) " +
           "FROM EmailRecord r GROUP BY r.legalOwner")
    List<Object[]> statsByLegalOwner();

    @Query("SELECT DATE(r.createTime), COUNT(r), " +
           "SUM(CASE WHEN r.status = 'SUCCESS' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN r.status = 'FAILED' THEN 1 ELSE 0 END) " +
           "FROM EmailRecord r WHERE r.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(r.createTime) ORDER BY DATE(r.createTime)")
    List<Object[]> statsByDateRange(LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT r.errorMessage, COUNT(r) FROM EmailRecord r " +
           "WHERE r.status = 'FAILED' AND r.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY r.errorMessage ORDER BY COUNT(r) DESC")
    List<Object[]> errorStatsByDateRange(LocalDateTime startTime, LocalDateTime endTime);
}
