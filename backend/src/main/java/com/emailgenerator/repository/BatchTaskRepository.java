package com.emailgenerator.repository;

import com.emailgenerator.entity.BatchTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BatchTaskRepository extends JpaRepository<BatchTask, Long>, JpaSpecificationExecutor<BatchTask> {

    Page<BatchTask> findByStatus(String status, Pageable pageable);

    List<BatchTask> findByStatusAndScheduleTimeBefore(String status, LocalDateTime scheduleTime);

    @Query("SELECT t.legalOwner, COUNT(t), " +
           "SUM(t.successCount), SUM(t.failCount), SUM(t.riskCount) " +
           "FROM BatchTask t GROUP BY t.legalOwner")
    List<Object[]> statsByLegalOwner();

    @Query("SELECT DATE(t.createTime), COUNT(t), " +
           "SUM(t.successCount), SUM(t.failCount) " +
           "FROM BatchTask t WHERE t.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY DATE(t.createTime) ORDER BY DATE(t.createTime)")
    List<Object[]> statsByDateRange(LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT t.owner, COUNT(t), SUM(t.successCount) " +
           "FROM BatchTask t GROUP BY t.owner")
    List<Object[]> statsByOwner();
}
