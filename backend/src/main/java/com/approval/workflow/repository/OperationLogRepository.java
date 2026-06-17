package com.approval.workflow.repository;

import com.approval.workflow.entity.OperationLog;
import com.approval.workflow.enums.OperationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, Long>, JpaSpecificationExecutor<OperationLog> {

    Page<OperationLog> findByRequirementIdOrderByCreatedAtDesc(Long requirementId, Pageable pageable);

    Page<OperationLog> findByOperatorId(Long operatorId, Pageable pageable);

    List<OperationLog> findByRequirementIdInAndOperationType(List<Long> requirementIds, OperationType operationType);

    Page<OperationLog> findByOperationType(OperationType operationType, Pageable pageable);

    Page<OperationLog> findByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    List<OperationLog> findByRequirementIdInAndCreatedAtBetween(List<Long> requirementIds, LocalDateTime startTime, LocalDateTime endTime);
}
