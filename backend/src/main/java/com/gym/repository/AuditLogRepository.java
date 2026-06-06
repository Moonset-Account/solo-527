package com.gym.repository;

import com.gym.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUserId(Long userId);
    List<AuditLog> findByModule(String module);
    List<AuditLog> findByTargetTypeAndTargetId(String targetType, Long targetId);
    List<AuditLog> findByTargetTypeOrderByCreatedAtDesc(String targetType);

    @Query("SELECT al FROM AuditLog al WHERE al.createdAt BETWEEN :start AND :end")
    List<AuditLog> findByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    Page<AuditLog> findByModuleAndCreatedAtBetween(String module, LocalDateTime start, LocalDateTime end, Pageable pageable);
}
