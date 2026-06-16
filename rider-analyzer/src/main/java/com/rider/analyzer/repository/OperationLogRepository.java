package com.rider.analyzer.repository;

import com.rider.analyzer.entity.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OperationLogRepository extends JpaRepository<OperationLog, Long> {

    List<OperationLog> findByModuleAndCreateTimeBetween(String module, LocalDateTime start, LocalDateTime end);

    List<OperationLog> findByCreateTimeBetween(LocalDateTime start, LocalDateTime end);
}
