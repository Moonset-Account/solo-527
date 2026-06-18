package com.emailgenerator.repository;

import com.emailgenerator.entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, Long>, JpaSpecificationExecutor<CallLog> {

    List<CallLog> findByRequestId(String requestId);

    List<CallLog> findByTaskId(Long taskId);

    @Query("SELECT l.apiName, COUNT(l), " +
           "SUM(CASE WHEN l.status = 'SUCCESS' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN l.status = 'FAILED' THEN 1 ELSE 0 END), " +
           "AVG(l.costTime) " +
           "FROM CallLog l WHERE l.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY l.apiName")
    List<Object[]> statsByApiAndDateRange(LocalDateTime startTime, LocalDateTime endTime);

    @Query("SELECT l.errorCode, l.errorMessage, COUNT(l) FROM CallLog l " +
           "WHERE l.status = 'FAILED' AND l.createTime BETWEEN :startTime AND :endTime " +
           "GROUP BY l.errorCode, l.errorMessage ORDER BY COUNT(l) DESC")
    List<Object[]> errorStatsByDateRange(LocalDateTime startTime, LocalDateTime endTime);
}
