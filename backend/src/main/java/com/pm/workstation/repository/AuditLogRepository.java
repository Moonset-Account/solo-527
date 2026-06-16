package com.pm.workstation.repository;

import com.pm.workstation.entity.AuditLog;
import com.pm.workstation.enums.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByUserId(Long userId);

    List<AuditLog> findByAction(AuditAction action);

    List<AuditLog> findByTargetTypeAndTargetId(String targetType, Long targetId);

    List<AuditLog> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<AuditLog> findByUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    Page<AuditLog> findByAction(AuditAction action, Pageable pageable);
}
