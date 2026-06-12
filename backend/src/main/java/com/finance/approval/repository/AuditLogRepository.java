package com.finance.approval.repository;

import com.finance.approval.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAll(Pageable pageable);

    Page<AuditLog> findByUserId(Long userId, Pageable pageable);

    Page<AuditLog> findByModule(String module, Pageable pageable);

    Page<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:module IS NULL OR :module = '' OR a.module = :module) AND " +
           "(:userId IS NULL OR a.userId = :userId) AND " +
           "(:start IS NULL OR a.createdAt >= :start) AND " +
           "(:end IS NULL OR a.createdAt <= :end) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findByConditions(
            @Param("module") String module,
            @Param("userId") Long userId,
            @Param("start") LocalDateTime startTime,
            @Param("end") LocalDateTime endTime,
            Pageable pageable);
}
